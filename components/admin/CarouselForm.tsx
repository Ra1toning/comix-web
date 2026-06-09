'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ImagePlus, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllComics, Comic } from '@/lib/services/firebase-comic';
import { CarouselItem } from '@/lib/services/firebase-carousel';
import { isValidImageFile } from '@/lib/utils/imageConversion';

export interface CarouselFormData {
  comicId: string;
  titleOverride?: string;
  descriptionOverride?: string;
  imageFile?: File;
  imageUrl?: string;
  removeImageOverride?: boolean;
  badgeText?: string;
  order: number;
  isActive: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}

interface CarouselFormProps {
  initialData?: CarouselItem;
  loading?: boolean;
  onSubmit: (data: CarouselFormData) => Promise<void>;
  onCancel?: () => void;
}

const toInputDate = (date?: Date | null) => {
  if (!date) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const timestampToDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate();
  }
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const CarouselForm = ({
  initialData,
  loading = false,
  onSubmit,
  onCancel,
}: CarouselFormProps) => {
  const [formData, setFormData] = useState<CarouselFormData>({
    comicId: initialData?.comicId || '',
    titleOverride: initialData?.titleOverride || '',
    descriptionOverride: initialData?.descriptionOverride || '',
    imageUrl: initialData?.bannerImageStoragePath
      ? undefined
      : initialData?.bannerImageOverride || '',
    badgeText: initialData?.badgeText || '',
    order: initialData?.order ?? 0,
    isActive: initialData?.isActive ?? true,
    startDate: timestampToDate(initialData?.startDate),
    endDate: timestampToDate(initialData?.endDate),
  });
  const [comics, setComics] = useState<Comic[]>([]);
  const [comicsLoading, setComicsLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.bannerImageStoragePath
      ? initialData.bannerImageOverride || null
      : null
  );
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComics = async () => {
      try {
        const data = await getAllComics();
        setComics(data.filter(comic => comic.isPublished));
      } catch (err) {
        console.error('Error fetching comics:', err);
      } finally {
        setComicsLoading(false);
      }
    };

    fetchComics();
  }, []);

  const selectedComic = useMemo(
    () => comics.find(comic => comic.id === formData.comicId),
    [comics, formData.comicId]
  );
  const fallbackImage = selectedComic?.bannerImage || selectedComic?.poster || '';
  const customImage = imagePreview || formData.imageUrl?.trim() || '';
  const displayedImage = customImage || fallbackImage;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    const target = event.target as HTMLInputElement;

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) || 0 }));
    } else if (type === 'datetime-local') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? new Date(value) : null,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      setError('10MB-аас бага JPG, PNG эсвэл WebP зураг оруулна уу.');
      return;
    }

    const reader = new FileReader();
    reader.onload = result => setImagePreview(result.target?.result as string);
    reader.readAsDataURL(file);
    setFormData(prev => ({
      ...prev,
      imageFile: file,
      imageUrl: undefined,
      removeImageOverride: false,
    }));
    setError('');
  };

  const removeOverride = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      imageFile: undefined,
      imageUrl: '',
      removeImageOverride: Boolean(initialData?.bannerImageOverride),
    }));
  };

  const validateForm = () => {
    if (!formData.comicId) {
      setError('Комик сонгоно уу.');
      return false;
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      setError('Эхлэх огноо дуусах огнооноос өмнө байна.');
      return false;
    }
    if (formData.imageUrl?.trim()) {
      try {
        const url = new URL(formData.imageUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch {
        setError('Зургийн холбоос http:// эсвэл https:// хаягтай байх ёстой.');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа.');
    }
  };

  return (
    <Card className="overflow-hidden border-white/10 bg-white/[0.025]">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-lg">
          {initialData?.id ? 'Нүүрний слайд засах' : 'Нүүрний слайд үүсгэх'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mx-5 mt-5 flex gap-3 rounded-md border border-red-500/30 bg-red-500/10 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <div className="space-y-6 p-5 sm:p-6">
              <section>
                <div className="mb-3">
                  <h3 className="text-sm font-semibold">Комик</h3>
                  <p className="text-xs text-foreground/60">
                    Слайдаар нээх комикийг сонгоно уу.
                  </p>
                </div>
                {comicsLoading ? (
                  <Skeleton className="h-11" />
                ) : (
                  <select
                    name="comicId"
                    value={formData.comicId}
                    onChange={handleChange}
                    className="h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-pink-400/60"
                  >
                    <option value="">Нийтлэгдсэн комик сонгох...</option>
                    {comics.map(comic => (
                      <option key={comic.id} value={comic.id}>
                        {comic.title} · {comic.type}
                      </option>
                    ))}
                  </select>
                )}
              </section>

              <section className="border-t border-white/10 pt-6">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold">Нүүрний зураг</h3>
                  <p className="text-xs text-foreground/60">
                    Энэ зураг зөвхөн нүүрний слайдад ашиглагдана. Комикийн нүүр болон
                    баннер зураг өөрчлөгдөхгүй.
                  </p>
                </div>

                <div className="relative aspect-[16/7] overflow-hidden rounded-md border border-white/10 bg-black/30">
                  {displayedImage ? (
                    <img
                      src={displayedImage}
                      alt="Нүүрний слайдын урьдчилсан харагдац"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-foreground/50">
                      Комик сонгох эсвэл зураг оруулах
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/70 p-3">
                    <span className="text-xs text-white/70">
                      {customImage ? 'Слайдын тусгай зураг' : 'Комикийн үндсэн зураг'}
                    </span>
                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <Button type="button" size="sm" variant="secondary" asChild>
                          <span>
                            <ImagePlus className="mr-2 h-4 w-4" />
                            {customImage ? 'Солих' : 'Оруулах'}
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImage}
                          className="hidden"
                        />
                      </label>
                      {customImage && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={removeOverride}
                          title="Комикийн үндсэн зургийг ашиглах"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium">
                    Зургийн холбоос
                    <span className="mt-1 block text-xs font-normal text-foreground/60">
                      Зураг upload хийхийн оронд ашиглах боломжтой.
                    </span>
                  </label>
                  <Input
                    type="url"
                    value={formData.imageUrl || ''}
                    onChange={event => {
                      const imageUrl = event.target.value;
                      setImagePreview(null);
                      setFormData(prev => ({
                        ...prev,
                        imageUrl,
                        imageFile: undefined,
                        removeImageOverride: false,
                      }));
                    }}
                    placeholder="https://example.com/banner.jpg"
                    className="border-white/10 bg-black/20"
                  />
                </div>
              </section>

              <section className="grid gap-4 border-t border-white/10 pt-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Слайдын гарчиг</label>
                  <Input
                    name="titleOverride"
                    value={formData.titleOverride}
                    onChange={handleChange}
                    placeholder={selectedComic?.title || 'Комикийн гарчгийг ашиглах'}
                    className="border-white/10 bg-black/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Тэмдэглэгээ</label>
                  <Input
                    name="badgeText"
                    value={formData.badgeText}
                    onChange={handleChange}
                    placeholder="Онцлох"
                    className="border-white/10 bg-black/20"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Тайлбар</label>
                  <textarea
                    name="descriptionOverride"
                    value={formData.descriptionOverride}
                    onChange={handleChange}
                    placeholder="Комикийн тайлбарыг ашиглах бол хоосон орхино"
                    rows={4}
                    className="w-full resize-y rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-pink-400/60"
                  />
                </div>
              </section>
            </div>

            <aside className="border-t border-white/10 bg-black/10 p-5 sm:p-6 lg:border-l lg:border-t-0">
              <div className="space-y-5 lg:sticky lg:top-6">
                <div>
                  <h3 className="text-sm font-semibold">Нийтлэх тохиргоо</h3>
                  <p className="mt-1 text-xs text-foreground/60">
                    Дараалал, харагдац болон хугацааг удирдана.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Харагдах дараалал</label>
                  <Input
                    type="number"
                    name="order"
                    min="0"
                    value={formData.order}
                    onChange={handleChange}
                    className="border-white/10 bg-black/20"
                  />
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-black/20 p-3">
                  <span>
                    <span className="block text-sm font-medium">Идэвхтэй</span>
                    <span className="block text-xs text-foreground/60">
                      Нүүр хуудсанд харуулах
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4"
                  />
                </label>

                <div>
                  <label className="mb-2 block text-sm font-medium">Эхлэх хугацаа</label>
                  <Input
                    type="datetime-local"
                    name="startDate"
                    value={toInputDate(formData.startDate)}
                    onChange={handleChange}
                    className="border-white/10 bg-black/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Дуусах хугацаа</label>
                  <Input
                    type="datetime-local"
                    name="endDate"
                    value={toInputDate(formData.endDate)}
                    onChange={handleChange}
                    className="border-white/10 bg-black/20"
                  />
                </div>

                <div className="flex gap-2 border-t border-white/10 pt-5">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Хадгалж байна...' : initialData?.id ? 'Өөрчлөлт хадгалах' : 'Слайд үүсгэх'}
                  </Button>
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={loading}
                      title="Цуцлах"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
