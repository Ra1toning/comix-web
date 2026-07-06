'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ExternalLink, Menu, Plus, Search } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { AdminCommandPalette } from './AdminCommandPalette';

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Хяналтын самбар',
  comics: 'Комикууд',
  new: 'Шинэ комик',
  edit: 'Засах',
  chapters: 'Бүлгүүд',
  carousel: 'Нүүрний слайд',
  genres: 'Жанрууд',
  users: 'Хэрэглэгчид',
};

/** /admin/comics/abc123/chapters → Хяналтын самбар / Комикууд / Бүлгүүд */
function useBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let href = '';

  for (const segment of segments) {
    href += `/${segment}`;
    const label = SEGMENT_LABELS[segment];
    // Динамик ID сегментүүдийг (комикийн id гэх мэт) breadcrumb-д оруулахгүй.
    if (label) crumbs.push({ label, href });
  }
  return crumbs;
}

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const pathname = usePathname();
  const crumbs = useBreadcrumbs(pathname);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Ctrl+K / Cmd+K — хаанаас ч command palette нээнэ.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((current) => !current);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <>
      <div className="sticky top-0 z-30 bg-gradient-to-b from-[#070709] via-[#070709]/90 to-transparent px-4 pb-4 pt-4 sm:px-6">
        <div className="mx-auto flex h-12 w-full max-w-[1240px] items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#0c0c10]/80 px-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:gap-3 sm:px-3">
          <button
            onClick={onMenuClick}
            aria-label="Цэс нээх"
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white md:hidden"
          >
            <Menu className="size-4.5" />
          </button>

          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <Fragment key={crumb.href}>
                  {index > 0 && <ChevronRight className="size-3.5 shrink-0 text-zinc-700" />}
                  {isLast ? (
                    <span className="truncate font-medium text-white">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="shrink-0 text-zinc-500 transition-colors hover:text-white"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </Fragment>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="group flex h-8 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 text-xs text-zinc-500 transition-all hover:border-white/20 hover:text-zinc-300 sm:w-52"
              aria-label="Хайлт нээх (Ctrl+K)"
            >
              <Search className="size-3.5" />
              <span className="hidden sm:block">Хайх, үсрэх...</span>
              <kbd className="ml-auto hidden rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-px font-sans text-[10px] text-zinc-500 sm:block">
                Ctrl K
              </kbd>
            </button>

            <Link
              href="/home"
              target="_blank"
              className="hidden items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-white lg:flex"
            >
              <ExternalLink className="size-3.5" />
              Сайт үзэх
            </Link>

            <Link
              href="/admin/comics/new"
              className="flex h-8 items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-400 via-fuchsia-500 to-violet-500 px-3 text-xs font-semibold text-white shadow-[0_4px_20px_rgba(217,70,239,0.35)] transition-all hover:shadow-[0_4px_28px_rgba(217,70,239,0.55)] hover:brightness-110"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:block">Комик нэмэх</span>
            </Link>
          </div>
        </div>
      </div>

      <AdminCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
