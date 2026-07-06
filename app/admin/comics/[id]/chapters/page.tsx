'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getComicById } from '@/lib/services/firebase-comic';
import {
  getChaptersByComicId,
  createChapter,
  updateChapter,
  deleteChapter,
  publishChapter,
  unpublishChapter,
} from '@/lib/services/firebase-admin-chapters';
import {
  uploadChapterPage,
  getOrCreateStorageFolder,
  deleteStorageFiles,
} from '@/lib/services/firebase-storage';
import { Comic, Chapter } from '@/lib/services/firebase-comic';
import { ChapterForm, ChapterFormData } from '@/components/admin/ChapterFormNew';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  AdminPageHeader,
  AdminPageTransition,
  AdminPanel,
  AdminPanelHeader,
  AdminStatTile,
  AdminTable,
  StatusChip,
} from '@/components/admin/AdminUI';
import { COMIC_STATUS_INFO } from '@/lib/comic-taxonomy';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  ArrowUpDown,
  Layers,
  Eye,
  FileClock,
} from 'lucide-react';
import Link from 'next/link';

const getPageStoragePath = (
  storageFolder: string,
  chapterNumber: number,
  pageIndex: number
) =>
  `comics/${storageFolder}/chapter-${chapterNumber}/page-${String(pageIndex).padStart(
    3,
    '0'
  )}.webp`;

const getMaxPageIndexFromPaths = (paths: string[]) =>
  paths.reduce((max, path) => {
    const match = path.match(/page-(\d+)\.webp$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

const formatDate = (value: any) => {
  if (!value) return '—';
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('mn-MN');
};

export default function ChaptersManagementPage() {
  const params = useParams();
  const router = useRouter();
  const comicId = params.id as string;

  const [comic, setComic] = useState<Comic | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [deleteTarget, setDeleteTarget] = useState<Chapter | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const comicData = await getComicById(comicId);
        if (!comicData) {
          router.push('/admin/comics');
          return;
        }
        setComic(comicData);

        const chaptersData = await getChaptersByComicId(comicId);
        setChapters(chaptersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [comicId, router]);

  const filteredChapters = useMemo(() => {
    let filtered = chapters;

    if (searchTerm) {
      filtered = filtered.filter(
        chapter =>
          chapter.chapterNumber.toString().includes(searchTerm) ||
          chapter.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus === 'published') {
      filtered = filtered.filter(c => c.isPublished);
    } else if (filterStatus === 'draft') {
      filtered = filtered.filter(c => !c.isPublished);
    }

    return [...filtered].sort((a, b) =>
      sortDirection === 'desc'
        ? b.chapterNumber - a.chapterNumber
        : a.chapterNumber - b.chapterNumber
    );
  }, [chapters, searchTerm, filterStatus, sortDirection]);

  const refresh = async () => {
    const [updatedChapters, updatedComic] = await Promise.all([
      getChaptersByComicId(comicId),
      getComicById(comicId),
    ]);
    setChapters(updatedChapters);
    setComic(updatedComic);
  };

  const handleCreateChapter = async (data: ChapterFormData) => {
    setSubmitting(true);
    setUploadProgress(0);

    try {
      const storageFolder = comic ? getOrCreateStorageFolder(comic) : comicId;
      const pageUrls: string[] = [];
      const pageStoragePaths: string[] = [];

      for (let index = 0; index < data.pageItems.length; index += 1) {
        const item = data.pageItems[index];
        if (!item.file) continue;

        const uploaded = await uploadChapterPage(
          item.file,
          storageFolder,
          data.chapterNumber,
          index + 1
        );
        pageUrls.push(uploaded.url);
        pageStoragePaths.push(uploaded.storagePath);
        setUploadProgress(Math.round(((index + 1) / data.pageItems.length) * 100));
      }

      await createChapter(comicId, {
        chapterNumber: data.chapterNumber,
        title: data.title.trim() || `Бүлэг ${data.chapterNumber}`,
        pages: pageUrls,
        pageStoragePaths,
        isPublished: data.isPublished,
      });

      await refresh();
      setShowForm(false);
      setUploadProgress(0);
    } catch (error) {
      console.error('Error creating chapter:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateChapter = async (data: ChapterFormData) => {
    if (!editingChapter) return;

    setSubmitting(true);
    setUploadProgress(0);

    try {
      const storageFolder = comic ? getOrCreateStorageFolder(comic) : comicId;
      const previousPaths = editingChapter.pageStoragePaths || [];
      const keptExistingPaths = new Set(
        data.pageItems
          .filter(item => !item.file && item.storagePath)
          .map(item => item.storagePath as string)
      );
      const pageUrls: string[] = [];
      const pageStoragePaths: string[] = [];
      let nextSparePageIndex =
        Math.max(previousPaths.length, getMaxPageIndexFromPaths(previousPaths), data.pageItems.length) + 1;

      for (let index = 0; index < data.pageItems.length; index += 1) {
        const item = data.pageItems[index];

        if (!item.file) {
          if (item.existingUrl) pageUrls.push(item.existingUrl);
          if (item.storagePath) pageStoragePaths.push(item.storagePath);
          continue;
        }

        const targetPath = getPageStoragePath(storageFolder, data.chapterNumber, index + 1);
        const isOwnReplacement = item.originalStoragePath === targetPath;
        const uploadIndex =
          keptExistingPaths.has(targetPath) && !isOwnReplacement
            ? nextSparePageIndex++
            : index + 1;

        const uploaded = await uploadChapterPage(
          item.file,
          storageFolder,
          data.chapterNumber,
          uploadIndex
        );
        pageUrls.push(uploaded.url);
        pageStoragePaths.push(uploaded.storagePath);
        setUploadProgress(Math.round(((index + 1) / data.pageItems.length) * 100));
      }

      const nextPaths = new Set(pageStoragePaths);
      const removedPaths = previousPaths.filter(path => !nextPaths.has(path));
      if (removedPaths.length > 0) {
        await deleteStorageFiles(removedPaths);
      }

      await updateChapter(editingChapter.id, {
        chapterNumber: data.chapterNumber,
        title: data.title.trim() || `Бүлэг ${data.chapterNumber}`,
        pages: pageUrls,
        pageStoragePaths,
        isPublished: data.isPublished,
      });

      await refresh();
      setEditingChapter(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Error updating chapter:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChapter = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    setErrorMessage('');
    try {
      await deleteChapter(deleteTarget.id);
      await refresh();
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting chapter:', error);
      setErrorMessage('Бүлэг устгаж чадсангүй. Дахин оролдоно уу.');
      setDeleteTarget(null);
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePublish = async (chapter: Chapter) => {
    setErrorMessage('');
    setTogglingId(chapter.id);
    try {
      if (chapter.isPublished) {
        await unpublishChapter(chapter.id);
      } else {
        await publishChapter(chapter.id);
      }
      await refresh();
    } catch (error) {
      console.error('Error toggling publish:', error);
      setErrorMessage('Бүлгийн нийтлэх төлөвийг шинэчилж чадсангүй.');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading || !comic) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const draftCount = comic.totalChapters - comic.publishedChapters;

  return (
    <AdminPageTransition>
      <div className="space-y-5">
        <AdminPageHeader
          title="Бүлгүүдийг удирдах"
          description="Бүлгийн нийтлэх төлөвийг хүснэгтээс шууд солино — ноорог бүлгийг зөвхөн админ харна."
          actions={
            !showForm && !editingChapter ? (
              <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
                <Plus className="size-4" />
                Бүлэг нэмэх
              </Button>
            ) : undefined
          }
        />

        <AdminPanel className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {comic.poster && (
              <img
                src={comic.poster}
                alt={comic.title}
                className="h-20 w-14 shrink-0 rounded-lg border border-white/10 object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/comics/${comic.id}/edit`}
                className="text-base font-semibold text-white transition-colors hover:text-pink-200"
              >
                {comic.title}
              </Link>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <StatusChip tone="zinc">{comic.type}</StatusChip>
                <StatusChip tone={comic.status === 'Идэвхтэй' ? 'emerald' : comic.status === 'Дууссан' ? 'sky' : 'amber'}>
                  {COMIC_STATUS_INFO[comic.status]?.label || comic.status}
                </StatusChip>
                {comic.isPublished ? (
                  <StatusChip tone="emerald">Нийтлэгдсэн комик</StatusChip>
                ) : (
                  <StatusChip tone="amber">Ноорог комик</StatusChip>
                )}
              </div>
            </div>
            <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-[330px]">
              <AdminStatTile label="Нийт бүлэг" value={comic.totalChapters} icon={Layers} />
              <AdminStatTile
                label="Нийтлэгдсэн"
                value={comic.publishedChapters}
                icon={Eye}
                tone="emerald"
              />
              <AdminStatTile label="Ноорог" value={draftCount} icon={FileClock} tone="amber" />
            </div>
          </div>
        </AdminPanel>

        {(showForm || editingChapter) && (
          <ChapterForm
            comicId={comicId}
            initialData={editingChapter || undefined}
            loading={submitting}
            onSubmit={editingChapter ? handleUpdateChapter : handleCreateChapter}
            onCancel={() => {
              setShowForm(false);
              setEditingChapter(null);
            }}
          />
        )}

        {uploadProgress > 0 && (
          <AdminPanel className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-pink-400 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="font-mono text-xs text-zinc-400">{uploadProgress}%</span>
            </div>
          </AdminPanel>
        )}

        <AdminPanel>
          <AdminPanelHeader
            title="Бүлгүүд"
            hint={`${filteredChapters.length} бүлэг`}
            actions={
              chapters.length > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="relative hidden sm:block">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-600" />
                    <Input
                      placeholder="Дугаар, гарчгаар хайх..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8 w-52 rounded-lg border-white/10 bg-white/[0.03] pl-8 text-xs"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="h-8 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-xs text-zinc-300 outline-none focus:border-pink-400/40"
                  >
                    <option value="all">Бүх төлөв</option>
                    <option value="published">Нийтлэгдсэн</option>
                    <option value="draft">Ноорог</option>
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs text-zinc-500 hover:text-white"
                    onClick={() =>
                      setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'))
                    }
                  >
                    <ArrowUpDown className="size-3.5" />
                    {sortDirection === 'desc' ? 'Буурах' : 'Өсөх'}
                  </Button>
                </div>
              ) : undefined
            }
          />

          {filteredChapters.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center">
              <Layers className="mb-3 size-8 text-zinc-700" />
              <p className="text-sm text-zinc-400">
                {chapters.length === 0
                  ? 'Бүлэг бүртгэгдээгүй байна. Эхний бүлгээ нэмнэ үү.'
                  : 'Хайлтад тохирох бүлэг олдсонгүй.'}
              </p>
            </div>
          ) : (
            <AdminTable>
              <thead>
                <tr>
                  <th>Бүлэг</th>
                  <th>Гарчиг</th>
                  <th>Хуудас</th>
                  <th>Үүсгэсэн</th>
                  <th>Нийтлэх</th>
                  <th className="text-right!">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {filteredChapters.map(chapter => (
                  <tr key={chapter.id}>
                    <td>
                      <span className="rounded-md bg-pink-400/10 px-2 py-1 font-mono text-xs font-semibold text-pink-300">
                        #{String(chapter.chapterNumber).padStart(3, '0')}
                      </span>
                    </td>
                    <td>
                      <p className="max-w-[280px] truncate text-[13px] font-medium text-white">
                        {chapter.title}
                      </p>
                    </td>
                    <td className="text-zinc-400 tabular-nums">
                      {chapter.pageCount || chapter.pages?.length || 0}
                    </td>
                    <td className="text-xs text-zinc-500">{formatDate(chapter.createdAt)}</td>
                    <td>
                      <Switch
                        checked={Boolean(chapter.isPublished)}
                        onCheckedChange={() => handleTogglePublish(chapter)}
                        disabled={
                          togglingId === chapter.id || deleting === chapter.id || submitting
                        }
                        aria-label={chapter.isPublished ? 'Ноорог болгох' : 'Нийтлэх'}
                      />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Бүлэг засах"
                          onClick={() => setEditingChapter(chapter)}
                          disabled={submitting || deleting === chapter.id}
                          className="size-8 text-zinc-500 hover:text-white"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Бүлэг устгах"
                          onClick={() => setDeleteTarget(chapter)}
                          disabled={deleting === chapter.id || submitting}
                          className="size-8 text-zinc-600 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          )}
        </AdminPanel>

        {errorMessage && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {errorMessage}
          </p>
        )}

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Бүлэг устгах"
          description={`${deleteTarget?.chapterNumber || ''}-р бүлэг болон Storage-д хадгалагдсан бүх хуудасны зураг бүр мөсөн устна.`}
          loading={Boolean(deleting)}
          onConfirm={handleDeleteChapter}
          onOpenChange={(open) => {
            if (!open && !deleting) setDeleteTarget(null);
          }}
        />
      </div>
    </AdminPageTransition>
  );
}
