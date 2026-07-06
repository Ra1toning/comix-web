'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Edit3,
  Eye,
  EyeOff,
  ImageIcon,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { CarouselForm, CarouselFormData } from '@/components/admin/CarouselForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  AdminPageHeader,
  AdminPageTransition,
  AdminPanel,
  AdminStatTile,
  StatusChip,
} from '@/components/admin/AdminUI';
import { Images, Eye as EyeIcon, ImagePlus } from 'lucide-react';
import {
  CarouselItemWithComic,
  createCarouselItem,
  deleteCarouselItem,
  getAdminCarouselItems,
  toggleCarouselItemActive,
  updateCarouselItem,
} from '@/lib/services/firebase-carousel';

export default function AdminCarouselPage() {
  const [items, setItems] = useState<CarouselItemWithComic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CarouselItemWithComic | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CarouselItemWithComic | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const refreshItems = async () => {
    const data = await getAdminCarouselItems();
    setItems(data);
  };

  useEffect(() => {
    refreshItems()
      .catch(error => console.error('Error fetching carousel items:', error))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    return items.filter(item =>
      [item.comic?.title, item.titleOverride, item.badgeText]
        .filter(Boolean)
        .some(value => value?.toLowerCase().includes(term))
    );
  }, [items, searchTerm]);

  const handleAdd = async (data: CarouselFormData) => {
    setSubmitting(true);
    try {
      await createCarouselItem(data);
      await refreshItems();
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (data: CarouselFormData) => {
    if (!editingItem) return;
    setSubmitting(true);
    try {
      await updateCarouselItem(editingItem.id, data);
      await refreshItems();
      setEditingItem(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    setErrorMessage('');
    try {
      await deleteCarouselItem(deleteTarget.id);
      setItems(prev => prev.filter(item => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting carousel item:', error);
      setErrorMessage('Слайд устгаж чадсангүй. Дахин оролдоно уу.');
      setDeleteTarget(null);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (item: CarouselItemWithComic) => {
    try {
      await toggleCarouselItemActive(item.id, !item.isActive);
      setItems(prev =>
        prev.map(current =>
          current.id === item.id ? { ...current, isActive: !current.isActive } : current
        )
      );
    } catch (error) {
      console.error('Error toggling carousel item:', error);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <AdminPageTransition>
      <div className="space-y-5">
        <AdminPageHeader
          title="Нүүрний слайд"
          description="Нийтлэгдсэн комик сонгож, нүүр хуудасны онцлох слайдыг тохируулна."
          actions={
            !showForm && !editingItem ? (
              <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
                <Plus className="size-4" />
                Шинэ слайд
              </Button>
            ) : undefined
          }
        />

        {(showForm || editingItem) && (
          <CarouselForm
            initialData={editingItem || undefined}
            loading={submitting}
            onSubmit={editingItem ? handleEdit : handleAdd}
            onCancel={closeForm}
          />
        )}

        <div className="grid grid-cols-3 gap-3">
          <AdminStatTile label="Нийт слайд" value={items.length} icon={Images} />
          <AdminStatTile
            label="Идэвхтэй"
            value={items.filter(item => item.isActive).length}
            icon={EyeIcon}
            tone="emerald"
          />
          <AdminStatTile
            label="Тусгай зураг"
            value={items.filter(item => item.bannerImageOverride).length}
            icon={ImagePlus}
            tone="sky"
          />
        </div>

        <AdminPanel className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
            <Input
              placeholder="Слайд хайх..."
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              className="h-9 rounded-lg border-white/10 bg-white/[0.03] pl-9 text-[13px]"
            />
          </div>
        </AdminPanel>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(item => (
              <Skeleton key={item} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <AdminPanel className="border-dashed">
            <div className="flex flex-col items-center py-16 text-center">
              <ImageIcon className="mb-3 size-8 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-300">
                {items.length ? 'Тохирох слайд олдсонгүй' : 'Слайд бүртгэгдээгүй байна'}
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Нийтлэгдсэн комикоос нүүрний слайд үүсгэнэ үү.
              </p>
            </div>
          </AdminPanel>
        ) : (
          <AdminPanel className="overflow-hidden">
            {filteredItems.map(item => {
              const displayImage =
                item.bannerImageOverride ||
                item.comic?.bannerImage ||
                item.comic?.poster ||
                '';

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 border-b border-white/[0.06] p-4 transition-colors last:border-b-0 hover:bg-white/[0.025] sm:flex-row sm:items-center"
                >
                  <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg bg-black/30 sm:h-20 sm:w-36">
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt={item.titleOverride || item.comic?.title || 'Нүүрний слайд'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-zinc-700" />
                    )}
                    <span className="absolute left-2 top-2 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[10px] text-white">
                      #{item.order}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-[13px] font-semibold text-white">
                        {item.titleOverride || item.comic?.title}
                      </h2>
                      {item.isActive ? (
                        <StatusChip tone="emerald">Идэвхтэй</StatusChip>
                      ) : (
                        <StatusChip tone="zinc">Нуугдсан</StatusChip>
                      )}
                      {item.bannerImageOverride && (
                        <StatusChip tone="sky">Тусгай зураг</StatusChip>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {item.comic?.title} · {item.comic?.type}
                      {item.badgeText ? ` · ${item.badgeText}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-0.5 self-end sm:self-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggle(item)}
                      disabled={deleting === item.id}
                      title={item.isActive ? 'Слайд нуух' : 'Слайд харуулах'}
                      className="size-8 text-zinc-500 hover:text-white"
                    >
                      {item.isActive ? (
                        <Eye className="size-4 text-emerald-400" />
                      ) : (
                        <EyeOff className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowForm(false);
                        setEditingItem(item);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={submitting || deleting === item.id}
                      title="Слайд засах"
                      className="size-8 text-zinc-500 hover:text-white"
                    >
                      <Edit3 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(item)}
                      disabled={deleting === item.id || submitting}
                      title="Слайд устгах"
                      className="size-8 text-zinc-600 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </AdminPanel>
        )}

        {errorMessage && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {errorMessage}
          </p>
        )}

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Слайд устгах"
          description={`"${deleteTarget?.titleOverride || deleteTarget?.comic?.title || ''}" слайд болон upload хийсэн тусгай зураг бүр мөсөн устна.`}
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
