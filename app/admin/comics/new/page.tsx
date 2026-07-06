'use client';

import { useRouter } from 'next/navigation';
import { createComic } from '@/lib/services/firebase-admin';
import { ComicForm, ComicFormData } from '@/components/admin/ComicForm';
import { AdminPageHeader, AdminPageTransition } from '@/components/admin/AdminUI';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function NewComicPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: ComicFormData) => {
    setLoading(true);
    try {
      await createComic(data);
      router.push('/admin/comics');
    } catch (error) {
      console.error('Error creating comic:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminPageTransition>
      <div className="mx-auto max-w-3xl space-y-5">
        <AdminPageHeader
          title="Шинэ комик нэмэх"
          description="Комикийн мэдээлэл, зураг болон нийтлэх төлөвийг бүртгэнэ."
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
          loading={loading}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/comics')}
        />
      </div>
    </AdminPageTransition>
  );
}
