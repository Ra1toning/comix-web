'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { getComicById } from '@/lib/services/firebase-comic';
import { Comic } from '@/lib/services/firebase-comic';
import { updateComic } from '@/lib/services/firebase-admin';
import { ComicForm, ComicFormData } from '@/components/admin/ComicForm';
import { AdminPageHeader, AdminPageTransition } from '@/components/admin/AdminUI';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EditComicPage() {
  const params = useParams();
  const router = useRouter();
  const comicId = params.id as string;

  const [comic, setComic] = useState<Comic | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComic = async () => {
      try {
        const data = await getComicById(comicId);
        if (!data) {
          router.push('/admin/comics');
          return;
        }
        setComic(data);
      } catch (error) {
        console.error('Error fetching comic:', error);
        router.push('/admin/comics');
      } finally {
        setLoading(false);
      }
    };

    fetchComic();
  }, [comicId, router]);

  const handleSubmit = async (data: ComicFormData) => {
    setSubmitting(true);
    try {
      await updateComic(comicId, data);
      router.push('/admin/comics');
    } catch (error) {
      console.error('Error updating comic:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!comic) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground/70">Комик олдсонгүй</p>
      </div>
    );
  }

  return (
    <AdminPageTransition>
      <div className="mx-auto max-w-3xl space-y-5">
        <AdminPageHeader
          title="Комик засах"
          description={comic.title}
          actions={
            <Link href="/admin/comics">
              <Button variant="ghost" size="sm" className="gap-1.5 text-zinc-400 hover:text-white">
                <ArrowLeft className="size-4" />
                Буцах
              </Button>
            </Link>
          }
        />

        <ComicForm
          initialData={comic}
          loading={submitting}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/comics')}
        />
      </div>
    </AdminPageTransition>
  );
}
