'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Chapter } from '@/lib/services/firebase-comic';
import {
  chapterNumberExists,
  getNextChapterNumber,
} from '@/lib/services/firebase-admin-chapters';
import { isValidImageFile } from '@/lib/utils/imageConversion';

export interface ChapterPageFormItem {
  id: string;
  preview: string;
  existingUrl?: string;
  storagePath?: string;
  originalStoragePath?: string;
  file?: File;
  fileName?: string;
}

export interface ChapterFormData {
  chapterNumber: number;
  title: string;
  pageItems: ChapterPageFormItem[];
  isPublished: boolean;
}

interface ChapterFormProps {
  comicId: string;
  initialData?: Partial<Chapter>;
  loading?: boolean;
  onSubmit: (data: ChapterFormData) => Promise<void>;
  onCancel?: () => void;
}

const readFilePreview = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => resolve(event.target?.result as string);
    reader.onerror = () => reject(new Error(`${file.name} файлыг уншиж чадсангүй.`));
    reader.readAsDataURL(file);
  });

const createItemsFromFiles = async (files: FileList | File[]) => {
  const validFiles = Array.from(files).filter(isValidImageFile);
  validFiles.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );

  return Promise.all(
    validFiles.map(async file => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      preview: await readFilePreview(file),
      file,
      fileName: file.name,
    }))
  );
};

export const ChapterForm = ({
  comicId,
  initialData,
  loading = false,
  onSubmit,
  onCancel,
}: ChapterFormProps) => {
  const [formData, setFormData] = useState<ChapterFormData>({
    chapterNumber: initialData?.chapterNumber || 1,
    title: initialData?.title || '',
    pageItems: (initialData?.pages || []).map((url, index) => {
      const storagePath = initialData?.pageStoragePaths?.[index];
      return {
        id: `${storagePath || url}-${index}`,
        preview: url,
        existingUrl: url,
        storagePath,
        originalStoragePath: storagePath,
      };
    }),
    isPublished: initialData?.isPublished || false,
  });
  const [nextChapterNumber, setNextChapterNumber] = useState(1);
  const [error, setError] = useState('');
  const [loadingNextNumber, setLoadingNextNumber] = useState(true);
  const isEditing = Boolean(initialData?.id);

  useEffect(() => {
    const fetchNextNumber = async () => {
      try {
        const next = await getNextChapterNumber(comicId);
        setNextChapterNumber(next);
        if (!initialData?.chapterNumber) {
          setFormData(prev => ({ ...prev, chapterNumber: next }));
        }
      } catch (err) {
        console.error('Error fetching next chapter number:', err);
      } finally {
        setLoadingNextNumber(false);
      }
    };

    fetchNextNumber();
  }, [comicId, initialData?.chapterNumber]);

  const existingPageCount = useMemo(
    () => formData.pageItems.filter(item => item.existingUrl && !item.file).length,
    [formData.pageItems]
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const target = e.target as HTMLInputElement;

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    const allFiles = Array.from(files);
    const invalidFile = allFiles.find(file => !isValidImageFile(file));
    if (invalidFile) {
      setError(
        `${invalidFile.name} файл тохирохгүй байна. 10MB-аас бага JPG, PNG эсвэл WebP зураг оруулна уу.`
      );
      return;
    }

    const newItems = await createItemsFromFiles(allFiles);
    setFormData(prev => ({
      ...prev,
      pageItems: [...prev.pageItems, ...newItems],
    }));
    setError('');
  };

  const replacePage = async (index: number, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      setError('10MB-аас бага JPG, PNG эсвэл WebP зураг оруулна уу.');
      return;
    }

    const preview = await readFilePreview(file);
    setFormData(prev => {
      const pageItems = [...prev.pageItems];
      const current = pageItems[index];
      pageItems[index] = {
        ...current,
        preview,
        existingUrl: undefined,
        storagePath: current.storagePath,
        originalStoragePath: current.originalStoragePath || current.storagePath,
        file,
        fileName: file.name,
      };
      return { ...prev, pageItems };
    });
    setError('');
  };

  const removePage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pageItems: prev.pageItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const movePage = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.pageItems.length) return prev;

      const pageItems = [...prev.pageItems];
      [pageItems[index], pageItems[targetIndex]] = [
        pageItems[targetIndex],
        pageItems[index],
      ];
      return { ...prev, pageItems };
    });
  };

  const validateForm = async (): Promise<boolean> => {
    if (formData.chapterNumber < 1) {
      setError('Бүлгийн дугаар 1-ээс багагүй байна.');
      return false;
    }

    const isDuplicate = await chapterNumberExists(
      comicId,
      formData.chapterNumber,
      initialData?.id
    );
    if (isDuplicate) {
      setError(`Энэ комикт ${formData.chapterNumber}-р бүлэг бүртгэгдсэн байна.`);
      return false;
    }

    if (formData.pageItems.length === 0) {
      setError('Дор хаяж нэг хуудасны зураг шаардлагатай.');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validateForm())) return;

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа.');
    }
  };

  return (
    <Card className="border-white/10">
      <CardHeader>
        <CardTitle>{isEditing ? 'Бүлэг засах' : 'Шинэ бүлэг нэмэх'}</CardTitle>
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
            <label className="mb-2 block text-sm font-medium">Бүлгийн дугаар *</label>
            {loadingNextNumber ? (
              <Skeleton className="h-10" />
            ) : (
              <>
                <Input
                  type="number"
                  name="chapterNumber"
                  value={formData.chapterNumber}
                  onChange={handleChange}
                  min="1"
                  disabled={loading}
                  className="border-white/10 bg-white/5"
                />
                <p className="mt-1 text-xs text-foreground/70">
                  Санал болгох дараагийн дугаар: {nextChapterNumber}
                </p>
              </>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Бүлгийн гарчиг</label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Заавал биш"
              disabled={loading}
              className="border-white/10 bg-white/5"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="chapterIsPublished"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
              disabled={loading}
              className="h-4 w-4 cursor-pointer rounded border-white/20"
            />
            <label
              htmlFor="chapterIsPublished"
              className="cursor-pointer text-sm font-medium"
            >
              Энэ бүлгийг нийтлэх
            </label>
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Бүлгийн хуудсууд *</h3>
                <p className="text-xs text-foreground/70">
                  {formData.pageItems.length
                    ? `${formData.pageItems.length} сонгосон, ${existingPageCount} хадгалагдсан`
                    : 'Төхөөрөмжөөс бүлгийн хуудасны зургууд оруулна уу.'}
                </p>
              </div>
              <label className="cursor-pointer">
                <Button type="button" variant="secondary" asChild disabled={loading}>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Хуудас нэмэх
                  </span>
                </Button>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={event => addFiles(event.target.files)}
                  disabled={loading}
                  className="hidden"
                />
              </label>
            </div>

            <div
              onDragOver={event => event.preventDefault()}
              onDrop={event => {
                event.preventDefault();
                addFiles(event.dataTransfer.files);
              }}
              className="mb-4 rounded-lg border-2 border-dashed border-white/20 p-6 text-center transition-colors hover:border-white/40"
            >
              <Upload className="mx-auto mb-2 h-8 w-8 text-foreground/70" />
              <p className="text-sm text-foreground/70">
                Зургаа энд чирэх эсвэл "Хуудас нэмэх"-ийг ашиглана уу
              </p>
            </div>

            {formData.pageItems.length > 0 && (
              <div className="grid max-h-[32rem] grid-cols-2 gap-3 overflow-y-auto p-2 md:grid-cols-4 lg:grid-cols-6">
                {formData.pageItems.map((page, index) => (
                  <div key={page.id} className="group relative">
                    <img
                      src={page.preview}
                      alt={`${index + 1}-р хуудас`}
                      className="h-32 w-full rounded-lg border border-white/10 object-cover"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => movePage(index, 'up')}
                          disabled={index === 0}
                          className="rounded p-1 hover:bg-white/20 disabled:opacity-40"
                          title="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePage(index, 'down')}
                          disabled={index === formData.pageItems.length - 1}
                          className="rounded p-1 hover:bg-white/20 disabled:opacity-40"
                          title="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                      <label className="cursor-pointer rounded px-2 py-1 text-xs hover:bg-white/20">
                        Солих
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={event => replacePage(index, event.target.files)}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removePage(index)}
                        className="rounded p-1 hover:bg-red-500"
                        title="Устгах"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="absolute right-1 top-1 rounded bg-black/70 px-2 py-1 text-xs text-white">
                      {String(index + 1).padStart(3, '0')}
                    </div>
                    {page.fileName && (
                      <p className="mt-1 truncate text-xs text-foreground/60">
                        {page.fileName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 border-t border-white/10 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-linear-to-r from-cyan-300 via-emerald-200 to-amber-200 text-zinc-950 hover:brightness-105"
            >
              {loading ? 'Хадгалж байна...' : isEditing ? 'Бүлэг шинэчлэх' : 'Бүлэг хадгалах'}
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
