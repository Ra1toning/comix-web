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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-pink-400">
            Нүүр хуудасны контент
          </p>
          <h1 className="text-2xl font-semibold sm:text-3xl">Нүүрний слайд</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Нийтлэгдсэн комик сонгож, нүүрний слайдын зургийг тохируулна.
          </p>
        </div>
        {!showForm && !editingItem && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ слайд
          </Button>
        )}
      </header>

      {(showForm || editingItem) && (
        <CarouselForm
          initialData={editingItem || undefined}
          loading={submitting}
          onSubmit={editingItem ? handleEdit : handleAdd}
          onCancel={closeForm}
        />
      )}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 sm:grid-cols-3">
        <div className="bg-[var(--background)] p-4">
          <p className="text-xs text-foreground/50">Нийт слайд</p>
          <p className="mt-1 text-2xl font-semibold">{items.length}</p>
        </div>
        <div className="bg-[var(--background)] p-4">
          <p className="text-xs text-foreground/50">Идэвхтэй</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-400">
            {items.filter(item => item.isActive).length}
          </p>
        </div>
        <div className="col-span-2 bg-[var(--background)] p-4 sm:col-span-1">
          <p className="text-xs text-foreground/50">Тусгай зураг</p>
          <p className="mt-1 text-2xl font-semibold">
            {items.filter(item => item.bannerImageOverride).length}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
        <Input
          placeholder="Слайд хайх..."
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          className="h-11 border-white/10 bg-white/[0.03] pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(item => (
            <Skeleton key={item} className="h-28 rounded-md" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="border-dashed border-white/15 bg-transparent">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ImageIcon className="mb-3 h-8 w-8 text-foreground/30" />
            <p className="font-medium">
              {items.length ? 'Тохирох слайд олдсонгүй' : 'Слайд бүртгэгдээгүй байна'}
            </p>
            <p className="mt-1 text-sm text-foreground/50">
              Нийтлэгдсэн комикоос нүүрний слайд үүсгэнэ үү.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-md border border-white/10">
          {filteredItems.map((item, index) => {
            const displayImage =
              item.bannerImageOverride ||
              item.comic?.bannerImage ||
              item.comic?.poster ||
              '';

            return (
              <div
                key={item.id}
                className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.02] p-4 last:border-b-0 hover:bg-white/[0.045] sm:flex-row sm:items-center"
              >
                <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-md bg-black/30 sm:h-20 sm:w-36">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={item.titleOverride || item.comic?.title || 'Нүүрний слайд'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-foreground/30" />
                  )}
                  <span className="absolute left-2 top-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] text-white">
                    #{item.order}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-semibold">
                      {item.titleOverride || item.comic?.title}
                    </h2>
                    <Badge
                      className={
                        item.isActive
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                          : 'border-white/10 bg-white/5 text-foreground/50'
                      }
                    >
                      {item.isActive ? 'Идэвхтэй' : 'Нуугдсан'}
                    </Badge>
                    {item.bannerImageOverride && (
                      <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-400">
                        Тусгай зураг
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-foreground/55">
                    {item.comic?.title} · {item.comic?.type}
                    {item.badgeText ? ` · ${item.badgeText}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggle(item)}
                    disabled={deleting === item.id}
                    title={item.isActive ? 'Слайд нуух' : 'Слайд харуулах'}
                  >
                    {item.isActive ? (
                      <Eye className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
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
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(item)}
                    disabled={deleting === item.id || submitting}
                    title="Слайд устгах"
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {errorMessage && (
        <p className="border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
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
  );
}
