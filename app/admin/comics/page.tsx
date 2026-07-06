'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAllComics, Comic } from '@/lib/services/firebase-comic';
import { deleteComic, updateComic } from '@/lib/services/firebase-admin';
import { COMIC_STATUS_INFO } from '@/lib/comic-taxonomy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  AdminPageHeader,
  AdminPageTransition,
  AdminPanel,
  AdminTable,
  StatusChip,
} from '@/components/admin/AdminUI';
import { BookOpen, Trash2, Edit2, Layers, Plus, Search, X } from 'lucide-react';

const selectClass =
  'h-9 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[13px] text-zinc-300 outline-none transition-colors focus:border-pink-400/40';

const statusTone = (status: Comic['status']) =>
  status === 'Идэвхтэй' ? 'emerald' : status === 'Дууссан' ? 'sky' : 'amber';

export default function AdminComicsPage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Comic | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    getAllComics()
      .then(setComics)
      .catch((error) => {
        console.error('Error fetching comics:', error);
        setErrorMessage('Комикуудын жагсаалт ачаалж чадсангүй.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredComics = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return comics.filter(
      (comic) =>
        (!term ||
          comic.title.toLowerCase().includes(term) ||
          comic.author?.toLowerCase().includes(term)) &&
        (!selectedGenre || comic.genres.includes(selectedGenre)) &&
        (!selectedStatus || comic.status === selectedStatus) &&
        (!selectedType || comic.type === selectedType)
    );
  }, [comics, searchTerm, selectedGenre, selectedStatus, selectedType]);

  const allGenres = useMemo(
    () => Array.from(new Set(comics.flatMap((c) => c.genres))).sort(),
    [comics]
  );
  const allTypes = useMemo(() => Array.from(new Set(comics.map((c) => c.type))), [comics]);
  const allStatuses = useMemo(() => Array.from(new Set(comics.map((c) => c.status))), [comics]);
  const hasFilters = Boolean(searchTerm || selectedGenre || selectedStatus || selectedType);

  /** Хүснэгтээс шууд нийтлэх/ноорог болгох — форм руу орох шаардлагагүй. */
  const handleTogglePublish = async (comic: Comic) => {
    const next = !comic.isPublished;
    setTogglingId(comic.id);
    setErrorMessage('');
    // Optimistic: UI шууд шинэчлээд, алдаа гарвал буцаана.
    setComics((prev) =>
      prev.map((item) => (item.id === comic.id ? { ...item, isPublished: next } : item))
    );
    try {
      await updateComic(comic.id, { isPublished: next });
    } catch (error) {
      console.error('Error toggling publish:', error);
      setComics((prev) =>
        prev.map((item) => (item.id === comic.id ? { ...item, isPublished: !next } : item))
      );
      setErrorMessage('Нийтлэх төлөв өөрчилж чадсангүй. Дахин оролдоно уу.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    setErrorMessage('');
    try {
      await deleteComic(deleteTarget.id);
      setComics((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting comic:', error);
      setErrorMessage('Комик устгаж чадсангүй. Дахин оролдоно уу.');
      setDeleteTarget(null);
    } finally {
      setDeleting(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGenre('');
    setSelectedStatus('');
    setSelectedType('');
  };

  return (
    <AdminPageTransition>
      <div className="space-y-5">
        <AdminPageHeader
          title="Комикууд"
          description="Каталогийн бүх бүтээл — нийтлэх төлөвийг шууд хүснэгтээс солино."
          actions={
            <Link href="/admin/comics/new">
              <Button size="sm" className="gap-1.5">
                <Plus className="size-4" />
                Комик нэмэх
              </Button>
            </Link>
          }
        />

        <AdminPanel className="p-3">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
              <Input
                placeholder="Гарчиг эсвэл зохиогчоор хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 rounded-lg border-white/10 bg-white/[0.03] pl-9 text-[13px]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={selectClass}
              >
                <option value="">Бүх төрөл</option>
                {allTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={selectClass}
              >
                <option value="">Бүх төлөв</option>
                {allStatuses.map((status) => (
                  <option key={status} value={status}>
                    {COMIC_STATUS_INFO[status]?.label || status}
                  </option>
                ))}
              </select>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className={selectClass}
              >
                <option value="">Бүх жанр</option>
                {allGenres.map((genre) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 gap-1 text-xs text-zinc-500 hover:text-white"
                >
                  <X className="size-3.5" />
                  Цэвэрлэх
                </Button>
              )}
            </div>
          </div>
        </AdminPanel>

        <AdminPanel>
          {loading ? (
            <div className="space-y-2 p-5">
              {[1, 2, 3, 4, 5].map((item) => (
                <Skeleton key={item} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : filteredComics.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <BookOpen className="mb-3 size-8 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-300">
                {comics.length ? 'Шүүлтүүрт тохирох комик олдсонгүй' : 'Комик бүртгэгдээгүй байна'}
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                {comics.length ? 'Шүүлтүүрээ өөрчилж үзээрэй.' : 'Эхний комикоо нэмж эхлээрэй.'}
              </p>
            </div>
          ) : (
            <AdminTable>
              <thead>
                <tr>
                  <th>Комик</th>
                  <th>Төрөл</th>
                  <th>Төлөв</th>
                  <th>Бүлэг</th>
                  <th>Үзэлт</th>
                  <th>Нийтлэх</th>
                  <th className="text-right!">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {filteredComics.map((comic) => (
                  <tr key={comic.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img
                          src={comic.poster}
                          alt=""
                          className="h-12 w-9 shrink-0 rounded-md border border-white/10 object-cover"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/comics/${comic.id}/edit`}
                            className="block max-w-[260px] truncate text-[13px] font-medium text-white transition-colors hover:text-pink-200"
                          >
                            {comic.title}
                          </Link>
                          <p className="max-w-[260px] truncate text-xs text-zinc-600">
                            {comic.author || 'Зохиогч тодорхойгүй'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusChip tone="zinc">{comic.type}</StatusChip>
                    </td>
                    <td>
                      <StatusChip tone={statusTone(comic.status)}>
                        {COMIC_STATUS_INFO[comic.status]?.label || comic.status}
                      </StatusChip>
                    </td>
                    <td className="text-zinc-400 tabular-nums">
                      {comic.publishedChapters ?? 0}
                      <span className="text-zinc-700">/{comic.totalChapters ?? 0}</span>
                    </td>
                    <td className="text-zinc-400 tabular-nums">
                      {(comic.viewCount || 0).toLocaleString()}
                    </td>
                    <td>
                      <Switch
                        checked={Boolean(comic.isPublished)}
                        onCheckedChange={() => handleTogglePublish(comic)}
                        disabled={togglingId === comic.id || deleting === comic.id}
                        aria-label={comic.isPublished ? 'Ноорог болгох' : 'Нийтлэх'}
                      />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-0.5">
                        <Link href={`/admin/comics/${comic.id}/chapters`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Бүлгүүдийг удирдах"
                            className="size-8 text-zinc-500 hover:text-white"
                          >
                            <Layers className="size-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/comics/${comic.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Мэдээлэл засах"
                            className="size-8 text-zinc-500 hover:text-white"
                          >
                            <Edit2 className="size-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Устгах"
                          onClick={() => setDeleteTarget(comic)}
                          disabled={deleting === comic.id}
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

          {!loading && filteredComics.length > 0 && (
            <p className="border-t border-white/[0.06] px-5 py-3 text-xs text-zinc-600">
              Нийт {comics.length} комикоос {filteredComics.length}-г харуулж байна
            </p>
          )}
        </AdminPanel>

        {errorMessage && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {errorMessage}
          </p>
        )}

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Комик устгах"
          description={`"${deleteTarget?.title || ''}" комик болон түүнд хамаарах бүх бүлэг, зураг бүр мөсөн устна.`}
          loading={Boolean(deleting)}
          onConfirm={handleDelete}
          onOpenChange={(open) => {
            if (!open && !deleting) setDeleteTarget(null);
          }}
        />
      </div>
    </AdminPageTransition>
  );
}
