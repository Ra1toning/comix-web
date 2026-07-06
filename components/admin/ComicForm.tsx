'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Comic, ComicStatus, ComicType } from '@/lib/services/firebase-comic';
import { ensureDefaultGenres, getGenres } from '@/lib/services/firebase-genres';
import { COMIC_STATUSES, COMIC_STATUS_INFO, COMIC_TYPES } from '@/lib/comic-taxonomy';

export interface ComicFormData {
  title: string;
  description: string;
  posterFile?: File;
  bannerFile?: File;
  removeBanner?: boolean;
  genres: string[];
  type: ComicType;
  status: ComicStatus;
  author: string;
  isPublished: boolean;
}

interface ComicFormProps {
  initialData?: Partial<Comic>;
  loading?: boolean;
  onSubmit: (data: ComicFormData) => Promise<void>;
  onCancel?: () => void;
}

const comicTypes: ComicType[] = [...COMIC_TYPES];
const comicStatuses: ComicStatus[] = [...COMIC_STATUSES];
export const ComicForm = ({
  initialData,
  loading = false,
  onSubmit,
  onCancel,
}: ComicFormProps) => {
  const [formData, setFormData] = useState<ComicFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    genres: initialData?.genres || [],
    type: initialData?.type || 'Манга',
    status: initialData?.status || 'Идэвхтэй',
    author: initialData?.author || '',
    isPublished: initialData?.isPublished || false,
  });
  const [posterPreview, setPosterPreview] = useState<string | null>(
    initialData?.poster || null
  );
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    initialData?.bannerImage || null
  );
  const [error, setError] = useState('');
  const [managedGenres, setManagedGenres] = useState<string[]>([]);

  useEffect(() => {
    ensureDefaultGenres()
      .then(getGenres)
      .then(items => setManagedGenres(items.map(item => item.name)))
      .catch(error => {
        console.error('Failed to load genres:', error);
        setError('Жанрын жагсаалт ачаалж чадсангүй.');
      });
  }, []);

  const genreOptions = useMemo(
    () => Array.from(new Set([...managedGenres, ...(initialData?.genres || [])])).sort(),
    [managedGenres, initialData?.genres]
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const target = e.target as HTMLInputElement;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? target.checked : value,
    }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: 'poster' | 'banner'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('JPG, PNG эсвэл WebP зураг сонгоно уу.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Зураг 10MB-аас бага хэмжээтэй байх ёстой.');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const preview = event.target?.result as string;

      if (fileType === 'poster') {
        setFormData(prev => ({ ...prev, posterFile: file }));
        setPosterPreview(preview);
      } else {
        setFormData(prev => ({
          ...prev,
          bannerFile: file,
          removeBanner: false,
        }));
        setBannerPreview(preview);
      }
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(item => item !== genre)
        : [...prev.genres, genre],
    }));
  };

  const removePoster = () => {
    setFormData(prev => ({ ...prev, posterFile: undefined }));
    setPosterPreview(null);
  };

  const removeBanner = () => {
    setFormData(prev => ({
      ...prev,
      bannerFile: undefined,
      removeBanner: Boolean(initialData?.bannerImage),
    }));
    setBannerPreview(null);
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Гарчиг оруулах шаардлагатай.');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Тайлбар оруулах шаардлагатай.');
      return false;
    }
    if (!posterPreview) {
      setError('Нүүр зураг оруулах шаардлагатай.');
      return false;
    }
    if (formData.genres.length === 0) {
      setError('Дор хаяж нэг жанр сонгоно уу.');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа.');
    }
  };

  return (
    <Card className="rounded-xl border-white/[0.07] bg-white/[0.02]">
      <CardHeader>
        <CardTitle className="text-base">
          {initialData?.id ? 'Комикийн мэдээлэл' : 'Комикийн мэдээлэл'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">Гарчиг *</label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Жишээ: Solo Leveling: Return"
              className="border-white/10 bg-white/5"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Тайлбар *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Комикийн тухай тайлбар..."
              rows={5}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="mb-4 font-semibold">Зургууд</h3>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">
                Нүүр зураг *
                <span className="mt-1 block text-xs font-normal text-foreground/70">
                  JPG, PNG эсвэл WebP зураг оруулна.
                </span>
              </label>

              {posterPreview ? (
                <div className="relative mb-3 w-48">
                  <img
                    src={posterPreview}
                    alt="Нүүр зургийн урьдчилсан харагдац"
                    className="h-auto w-full rounded-lg border border-white/10"
                  />
                  <button
                    type="button"
                    onClick={removePoster}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1"
                    aria-label="Нүүр зураг устгах"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-white/20 p-6 text-center transition-colors hover:border-white/40">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-foreground/70" />
                  <label className="cursor-pointer">
                    <span className="text-sm text-pink-400">Нүүр зураг оруулах</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={event => handleFileChange(event, 'poster')}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Баннер зураг
                <span className="mt-1 block text-xs font-normal text-foreground/70">
                  Өргөн хэсэгт ашиглах нэмэлт зураг.
                </span>
              </label>

              {bannerPreview ? (
                <div className="relative mb-3 w-full max-w-md">
                  <img
                    src={bannerPreview}
                    alt="Баннер зургийн урьдчилсан харагдац"
                    className="h-40 w-full rounded-lg border border-white/10 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeBanner}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1"
                    aria-label="Баннер зураг устгах"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-white/20 p-6 text-center transition-colors hover:border-white/40">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-foreground/70" />
                  <label className="cursor-pointer">
                    <span className="text-sm text-foreground/70">
                      Баннер зураг оруулах
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={event => handleFileChange(event, 'banner')}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Жанр *</label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Жанр сонгох">
              {genreOptions.map(genre => {
                const selected = formData.genres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleGenre(genre)}
                    className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                      selected
                        ? 'border-pink-400/60 bg-pink-400/15 text-pink-200'
                        : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {selected && <Check className="size-3.5" />}
                    {genre}
                  </button>
                );
              })}
            </div>
            {!managedGenres.length && (
              <p className="mt-2 text-xs text-amber-400">
                Админ → Жанрууд хэсэгт жанр нэмэх эсвэл одоо байгаа комикуудаас импортлоорой.
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Төрөл *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full max-w-xs rounded-lg border border-white/10 bg-white/5 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {comicTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Төлөв *</label>
            <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Комикийн төлөв">
              {comicStatuses.map(status => {
                const info = COMIC_STATUS_INFO[status];
                const selected = formData.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setFormData(prev => ({ ...prev, status }))}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      selected
                        ? 'border-pink-400/60 bg-pink-400/10'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {selected && <Check className="size-3.5 text-pink-300" />}
                      {info.label}
                    </span>
                    <span className="mt-1.5 block text-xs leading-5 text-foreground/60">
                      {info.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Зохиогч</label>
            <Input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="Зохиогчийн нэр..."
              className="border-white/10 bg-white/5"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Нийтлэх төлөв *</label>
            <div className="grid gap-3 md:grid-cols-2" role="radiogroup" aria-label="Нийтлэх төлөв">
              <button
                type="button"
                role="radio"
                aria-checked={!formData.isPublished}
                onClick={() => setFormData(prev => ({ ...prev, isPublished: false }))}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  !formData.isPublished
                    ? 'border-yellow-400/50 bg-yellow-400/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {!formData.isPublished && <Check className="size-3.5 text-yellow-300" />}
                  Ноорог
                </span>
                <span className="mt-1.5 block text-xs leading-5 text-foreground/60">
                  Зөвхөн админд харагдана. Уншигчид каталог, нүүр хуудаснаас олохгүй.
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={formData.isPublished}
                onClick={() => setFormData(prev => ({ ...prev, isPublished: true }))}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  formData.isPublished
                    ? 'border-green-400/50 bg-green-400/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {formData.isPublished && <Check className="size-3.5 text-green-300" />}
                  Нийтлэх
                </span>
                <span className="mt-1.5 block text-xs leading-5 text-foreground/60">
                  Сайт дээр шууд харагдана. Нийтлэгдсэн бүлэгтэй байвал уншигдана.
                </span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 border-t border-white/10 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-linear-to-r from-cyan-300 via-emerald-200 to-amber-200 text-zinc-950 hover:brightness-105"
            >
              {loading ? 'Хадгалж байна...' : initialData?.id ? 'Комик шинэчлэх' : 'Комик хадгалах'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Цуцлах
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
