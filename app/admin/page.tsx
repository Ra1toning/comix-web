'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Images,
  LayoutDashboard,
  Plus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminStats, getAdminStats } from '@/lib/services/firebase-admin';

const statsConfig = [
  { key: 'totalComics', label: 'Нийт комик', icon: BookOpen },
  { key: 'publishedComics', label: 'Нийтлэгдсэн', icon: LayoutDashboard },
  { key: 'totalChapters', label: 'Нийт бүлэг', icon: BookOpen },
  { key: 'totalUsers', label: 'Хэрэглэгч', icon: Users },
  { key: 'activeCarouselItems', label: 'Идэвхтэй слайд', icon: Images },
] as const;

const actions = [
  {
    label: 'Комик нэмэх',
    description: 'Шинэ комик болон зургийн мэдээлэл оруулах.',
    href: '/admin/comics/new',
    icon: Plus,
  },
  {
    label: 'Комик удирдах',
    description: 'Нэр, бүлэг болон нийтлэх төлөвийг засах.',
    href: '/admin/comics',
    icon: BookOpen,
  },
  {
    label: 'Нүүрний слайд',
    description: 'Комик сонгож, слайдын зураг тохируулах.',
    href: '/admin/carousel',
    icon: Images,
  },
  {
    label: 'Хэрэглэгчид',
    description: 'Бүртгэлтэй хэрэглэгч болон эрхийг харах.',
    href: '/admin/users',
    icon: Users,
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(error => console.error('Error fetching admin stats:', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-pink-400">
            Удирдлагын хэсэг
          </p>
          <h1 className="text-2xl font-semibold sm:text-3xl">Хяналтын самбар</h1>
          <p className="mt-1 text-sm text-foreground/55">
            Контент болон нийтлэлийн ерөнхий мэдээлэл.
          </p>
        </div>
        <Link href="/admin/comics/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Комик нэмэх
          </Button>
        </Link>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground/70">Ерөнхий үзүүлэлт</h2>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 md:grid-cols-5">
          {statsConfig.map(({ key, label, icon: Icon }) => (
            <div key={key} className="bg-[var(--background)] p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-foreground/50">{label}</p>
                <Icon className="h-4 w-4 text-foreground/35" />
              </div>
              {loading ? (
                <Skeleton className="mt-3 h-8 w-16" />
              ) : (
                <p className="mt-2 text-2xl font-semibold">{stats?.[key] ?? 0}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground/70">Шуурхай үйлдэл</h2>
        </div>
        <div className="grid overflow-hidden rounded-md border border-white/10 md:grid-cols-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`group flex items-center gap-4 bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.055] ${
                  index < 2 ? 'border-b border-white/10' : ''
                } ${index % 2 === 0 ? 'md:border-r md:border-white/10' : ''}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/[0.07]">
                  <Icon className="h-5 w-5 text-pink-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{action.label}</p>
                  <p className="mt-0.5 text-sm text-foreground/50">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-foreground/30 transition-transform group-hover:translate-x-1 group-hover:text-foreground/70" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
