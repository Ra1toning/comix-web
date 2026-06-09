'use client';

import { useRouter } from 'next/navigation';
import { createComic } from '@/lib/services/firebase-admin';
import { ComicForm, ComicFormData } from '@/components/admin/ComicForm';
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
    <div className="space-y-6">

      <div className="flex items-center gap-4">
        <Link href="/admin/comics">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Буцах
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Шинэ комик нэмэх</h1>
          <p className="text-foreground/70 mt-1">Комикийн мэдээлэл болон зургийг бүртгэх</p>
        </div>
      </div>


      <ComicForm
        loading={loading}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/comics')}
      />
    </div>
  );
}
