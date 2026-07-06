'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Images,
  Users,
  LogOut,
  Tags,
  Flame,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { UserAvatar } from '@/components/shared/UserAvatar';
import clsx from 'clsx';

interface MenuItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

const menuGroups: { label: string; items: MenuItem[] }[] = [
  {
    label: 'Тойм',
    items: [{ label: 'Хяналтын самбар', href: '/admin', icon: LayoutDashboard, exact: true }],
  },
  {
    label: 'Контент',
    items: [
      { label: 'Комикууд', href: '/admin/comics', icon: BookOpen },
      { label: 'Нүүрний слайд', href: '/admin/carousel', icon: Images },
      { label: 'Жанрууд', href: '/admin/genres', icon: Tags },
    ],
  },
  {
    label: 'Хэрэглэгчид',
    items: [{ label: 'Хэрэглэгчид', href: '/admin/users', icon: Users }],
  },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar = ({ isOpen = true, onClose }: AdminSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isItemActive = (item: MenuItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-40 w-64 p-3 transition-transform duration-300 md:inset-y-4 md:left-4 md:w-60 md:p-0',
        {
          '-translate-x-full md:translate-x-0': !isOpen,
          'translate-x-0': isOpen,
        }
      )}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c10]/90 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl">

        {/* Лого */}
        <div className="flex items-center justify-between px-4 pb-3 pt-4">
          <Link href="/admin" className="group flex items-center gap-2.5">
            <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-pink-400 via-fuchsia-500 to-violet-600 shadow-[0_4px_16px_rgba(236,72,153,0.35)] transition-transform duration-300 group-hover:scale-105">
              <Flame className="size-4 text-white drop-shadow" />
            </span>
            <span className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-[15px] font-semibold tracking-tight text-transparent">
                Lumio
              </span>
              <span className="rounded-md border border-pink-400/25 bg-pink-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-pink-300">
                Admin
              </span>
            </span>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Цэс хаах"
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        {/* Цэс */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={clsx(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors duration-200',
                        active
                          ? 'font-medium text-white'
                          : 'text-zinc-500 hover:text-zinc-200'
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="admin-nav-pill"
                          transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                          className="absolute inset-0 rounded-xl border border-white/[0.08] bg-gradient-to-r from-pink-400/[0.14] to-violet-500/[0.08] shadow-[0_0_20px_rgba(236,72,153,0.12)_inset]"
                        />
                      )}
                      <Icon
                        className={clsx(
                          'relative size-4 transition-all duration-200',
                          active
                            ? 'text-pink-300 drop-shadow-[0_0_6px_rgba(244,114,182,0.5)]'
                            : 'text-zinc-600 group-hover:text-zinc-400'
                        )}
                      />
                      <span className="relative">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Админы хэсэг */}
        <div className="p-3">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
            <div className="flex items-center gap-3">
              <span className="shrink-0 rounded-full bg-gradient-to-br from-pink-400 via-fuchsia-500 to-violet-500 p-[2px]">
                <UserAvatar
                  src={user?.photoURL || undefined}
                  alt={user?.name || 'Админ'}
                  className="size-8 rounded-full object-cover"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-white">
                  {user?.name || 'Админ'}
                </p>
                <p className="truncate font-mono text-[10px] text-pink-300/80">
                  {typeof user?.lumioId === 'number' ? `#${user.lumioId}` : 'Админ'}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <Link
                href="/home"
                className="flex items-center justify-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-[11px] text-zinc-400 transition-all hover:border-white/15 hover:text-white"
              >
                Сайт руу
                <ArrowUpRight className="size-3" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-1 rounded-lg border border-red-500/10 bg-red-500/[0.04] px-2 py-1.5 text-[11px] text-red-400/80 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="size-3" />
                Гарах
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
