'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Eye,
  FileClock,
  Images,
  Layers,
  Plus,
  Tags,
  Users,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AdminStats,
  getAdminStats,
  getRecentComicsForAdmin,
} from '@/lib/services/firebase-admin';
import { Comic } from '@/lib/services/firebase-comic';
import {
  AdminPageHeader,
  AdminPageTransition,
  AdminPanel,
  AdminPanelHeader,
  AdminStatTile,
  AdminTable,
  StatusChip,
  StatTone,
} from '@/components/admin/AdminUI';

const statsConfig: {
  key: keyof AdminStats;
  label: string;
  icon: typeof BookOpen;
  tone: StatTone;
}[] = [
  { key: 'totalComics', label: 'Нийт комик', icon: BookOpen, tone: 'default' },
  { key: 'publishedComics', label: 'Нийтлэгдсэн комик', icon: Eye, tone: 'emerald' },
  { key: 'draftComics', label: 'Ноорог комик', icon: FileClock, tone: 'amber' },
  { key: 'publishedChapters', label: 'Нийтлэгдсэн бүлэг', icon: Layers, tone: 'sky' },
  { key: 'totalUsers', label: 'Хэрэглэгч', icon: Users, tone: 'pink' },
  { key: 'activeCarouselItems', label: 'Идэвхтэй слайд', icon: Images, tone: 'default' },
];

const quickActions = [
  {
    label: 'Комик нэмэх',
    description: 'Шинэ бүтээл бүртгэж, зурган мэдээлэл оруулах.',
    href: '/admin/comics/new',
    icon: Plus,
  },
  {
    label: 'Нүүрний слайд',
    description: 'Нүүр хуудасны онцлох слайдыг тохируулах.',
    href: '/admin/carousel',
    icon: Images,
  },
  {
    label: 'Жанрууд',
    description: 'Каталогийн ангилал, шүүлтүүрийг удирдах.',
    href: '/admin/genres',
    icon: Tags,
  },
  {
    label: 'Хэрэглэгчид',
    description: 'Lumio ID-р хайж, гишүүнчлэлийн эрх сунгах.',
    href: '/admin/users',
    icon: Users,
  },
];

const formatDate = (value: unknown) => {
  const date =
    value && typeof value === 'object' && 'toDate' in value
      ? (value as { toDate: () => Date }).toDate()
      : null;
  return date ? date.toLocaleDateString('mn-MN') : '—';
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    Promise.all([getAdminStats(), getRecentComicsForAdmin(5)])
      .then(([statsData, recentData]) => {
        setStats(statsData);
        setRecent(recentData);
      })
      .catch((error) => {
        console.error('Error fetching dashboard data:', error);
        setStatsError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminPageTransition>
      <div className="space-y-6">
        <AdminPageHeader
          title="Хяналтын самбар"
          description="Контент, нийтлэл болон хэрэглэгчдийн бодит үзүүлэлт."
        />

        {statsError ? (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            Статистик ачаалж чадсангүй. Хуудсаа дахин ачаална уу.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {statsConfig.map(({ key, label, icon, tone }) => (
              <AdminStatTile
                key={key}
                label={label}
                value={stats?.[key] ?? 0}
                icon={icon}
                tone={tone}
                loading={loading}
              />
            ))}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <AdminPanel>
            <AdminPanelHeader
              title="Сүүлд нэмэгдсэн комикууд"
              actions={
                <Link
                  href="/admin/comics"
                  className="group flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-white"
                >
                  Бүгдийг харах
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              }
            />
            {loading ? (
              <div className="space-y-2 p-5">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} className="h-11 rounded-lg" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <p className="p-8 text-center text-sm text-zinc-500">
                Комик бүртгэгдээгүй байна.{' '}
                <Link href="/admin/comics/new" className="text-pink-300 hover:underline">
                  Эхнийхээ нэмээрэй
                </Link>
                .
              </p>
            ) : (
              <AdminTable>
                <thead>
                  <tr>
                    <th>Комик</th>
                    <th>Төлөв</th>
                    <th>Бүлэг</th>
                    <th>Нэмэгдсэн</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((comic) => (
                    <tr key={comic.id}>
                      <td>
                        <Link
                          href={`/admin/comics/${comic.id}/edit`}
                          className="flex items-center gap-3"
                        >
                          <img
                            src={comic.poster}
                            alt=""
                            className="h-11 w-8 shrink-0 rounded object-cover"
                          />
                          <span className="max-w-[240px] truncate font-medium text-white hover:text-pink-200">
                            {comic.title}
                          </span>
                        </Link>
                      </td>
                      <td>
                        {comic.isPublished ? (
                          <StatusChip tone="emerald">Нийтлэгдсэн</StatusChip>
                        ) : (
                          <StatusChip tone="amber">Ноорог</StatusChip>
                        )}
                      </td>
                      <td className="text-zinc-400 tabular-nums">
                        {comic.publishedChapters ?? 0}/{comic.totalChapters ?? 0}
                      </td>
                      <td className="text-xs text-zinc-500">{formatDate(comic.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            )}
          </AdminPanel>

          <AdminPanel className="self-start">
            <AdminPanelHeader title="Шуурхай үйлдэл" />
            <div className="p-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-3.5 rounded-lg p-3 transition-colors hover:bg-white/[0.045]"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-pink-300 transition-colors group-hover:bg-pink-400/10">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-white">
                        {action.label}
                      </span>
                      <span className="block truncate text-xs text-zinc-500">
                        {action.description}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-zinc-700 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-400" />
                  </Link>
                );
              })}
            </div>
          </AdminPanel>
        </div>
      </div>
    </AdminPageTransition>
  );
}
