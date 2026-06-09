'use client';

import { useEffect, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  ArrowUpDown,
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
  if (!value) return 'Тодорхойгүй';
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? 'Тодорхойгүй' : date.toLocaleDateString('mn-MN');
};

export default function ChaptersManagementPage() {
  const params = useParams();
  const router = useRouter();
  const comicId = params.id as string;

  const [comic, setComic] = useState<Comic | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([]);
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
        setFilteredChapters(chaptersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [comicId, router]);


  useEffect(() => {
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

    filtered = [...filtered].sort((a, b) =>
      sortDirection === 'desc'
        ? b.chapterNumber - a.chapterNumber
        : a.chapterNumber - b.chapterNumber
    );

    setFilteredChapters(filtered);
  }, [chapters, searchTerm, filterStatus, sortDirection]);

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


      const updatedChapters = await getChaptersByComicId(comicId);
      setChapters(updatedChapters);
      const updatedComic = await getComicById(comicId);
      setComic(updatedComic);
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


      const updatedChapters = await getChaptersByComicId(comicId);
      setChapters(updatedChapters);
      const updatedComic = await getComicById(comicId);
      setComic(updatedComic);
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
      const updatedChapters = await getChaptersByComicId(comicId);
      setChapters(updatedChapters);
      const updatedComic = await getComicById(comicId);
      setComic(updatedComic);
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
    try {
      if (chapter.isPublished) {
        await unpublishChapter(chapter.id);
      } else {
        await publishChapter(chapter.id);
      }


      const updatedChapters = await getChaptersByComicId(comicId);
      setChapters(updatedChapters);
      const updatedComic = await getComicById(comicId);
      setComic(updatedComic);
    } catch (error) {
      console.error('Error toggling publish:', error);
      setErrorMessage('Бүлгийн нийтлэх төлөвийг шинэчилж чадсангүй.');
    }
  };

  if (loading || !comic) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/comics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Буцах
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Бүлгүүдийг удирдах</h1>
            <p className="text-foreground/70 mt-1">{comic.title}</p>
          </div>
        </div>
        {!showForm && !editingChapter && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-linear-to-r from-cyan-300 via-emerald-200 to-amber-200 text-zinc-950 hover:brightness-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Бүлэг нэмэх
          </Button>
        )}
      </div>

      <Card className="border-white/10">
        <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center">
          {comic.poster && (
            <img
              src={comic.poster}
              alt={comic.title}
              className="h-28 w-20 rounded object-cover"
            />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{comic.title}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge className="border-blue-500/30 bg-blue-500/20 text-blue-400">
                {comic.type}
              </Badge>
              <Badge className="border-purple-500/30 bg-purple-500/20 text-purple-400">
                {comic.status}
              </Badge>
              <Badge
                className={
                  comic.isPublished
                    ? 'border-green-500/30 bg-green-500/20 text-green-400'
                    : 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                }
              >
                {comic.isPublished ? 'Нийтлэгдсэн комик' : 'Ноорог комик'}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:w-72">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-foreground/70">Нийт</p>
              <p className="text-2xl font-bold">{comic.totalChapters}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-foreground/70">Нийтлэгдсэн</p>
              <p className="text-2xl font-bold text-green-400">
                {comic.publishedChapters}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>


      <div className="grid grid-cols-3 gap-4">
        <Card className="border-white/10">
          <CardContent className="pt-6">
            <p className="text-sm text-foreground/70">Нийт бүлэг</p>
            <p className="text-3xl font-bold mt-2">{comic.totalChapters}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="pt-6">
            <p className="text-sm text-foreground/70">Нийтлэгдсэн</p>
            <p className="text-3xl font-bold mt-2 text-green-400">{comic.publishedChapters}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="pt-6">
            <p className="text-sm text-foreground/70">Ноорог</p>
            <p className="text-3xl font-bold mt-2 text-yellow-400">
              {comic.totalChapters - comic.publishedChapters}
            </p>
          </CardContent>
        </Card>
      </div>


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
        <Card className="border-white/10 bg-blue-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-cyan-300 via-emerald-200 to-amber-200 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-mono">{uploadProgress}%</span>
            </div>
          </CardContent>
        </Card>
      )}


      {chapters.length > 0 && (
        <Card className="border-white/10">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                <Input
                  placeholder="Бүлгийн дугаар эсвэл гарчгаар хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border-white/10 pl-10"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="all">Бүх төлөв</option>
                <option value="published">Нийтлэгдсэн</option>
                <option value="draft">Ноорог</option>
              </select>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'))
                }
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                {sortDirection === 'desc' ? 'Буурахаар' : 'Өсөхөөр'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      <Card className="border-white/10">
        <CardHeader>
          <CardTitle>
            Бүлгүүд ({filteredChapters.length})
            {filterStatus !== 'all' && (
              <span className="text-sm text-foreground/70 ml-2">
                ({filterStatus === 'published' ? 'нийтлэгдсэн' : 'ноорог'})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredChapters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-foreground/70">
                {chapters.length === 0
                  ? 'Бүлэг бүртгэгдээгүй байна. Эхний бүлгээ нэмнэ үү.'
                  : 'Хайлтад тохирох бүлэг олдсонгүй.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredChapters.map(chapter => (
                <div
                  key={chapter.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm bg-pink-500/20 text-pink-400 px-2 py-1 rounded">
                        Бүлэг {String(chapter.chapterNumber).padStart(3, '0')}
                      </span>
                      {chapter.isPublished ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Нийтлэгдсэн
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          Ноорог
                        </Badge>
                      )}
                    </div>
                    <p className="font-semibold truncate">{chapter.title}</p>
                    <p className="text-xs text-foreground/70 mt-1">
                      {chapter.pageCount || chapter.pages?.length || 0} хуудас
                      {' | '}
                      Үүсгэсэн: {formatDate(chapter.createdAt)}
                      {' | '}
                      Шинэчилсэн: {formatDate(chapter.updatedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(chapter)}
                      disabled={deleting === chapter.id || submitting}
                    >
                      {chapter.isPublished ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-foreground/50" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingChapter(chapter)}
                      disabled={submitting || deleting === chapter.id}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(chapter)}
                      disabled={deleting === chapter.id || submitting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {chapters.length > 0 && (
        <Card className="border-white/10 bg-blue-500/10">
          <CardContent className="pt-6">
            <p className="text-sm">
              <strong>Санамж:</strong> Уншигчдад харагдуулахын тулд бүлгээ нийтэлнэ үү. Ноорог бүлгүүдийг
              зөвхөн админ харах боломжтой.
            </p>
          </CardContent>
        </Card>
      )}

      {errorMessage && (
        <p className="border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
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
  );
}
