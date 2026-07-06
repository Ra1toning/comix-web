'use client';

/**
 * Ctrl+K / Cmd+K — админы command palette.
 * Хуудас хооронд үсрэх, шуурхай үйлдэл хийх, комик нэрээр нь хайж
 * шууд засварлах хуудас руу очих боломжтой.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Images,
  Tags,
  Users,
  Plus,
  Search,
  Layers,
  CornerDownLeft,
  Loader2,
} from 'lucide-react';
import { getAllComics, Comic } from '@/lib/services/firebase-comic';

interface PaletteCommand {
  id: string;
  section: string;
  label: string;
  hint?: string;
  icon?: typeof Search;
  image?: string;
  keywords?: string;
  action: () => void;
}

interface AdminCommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function AdminCommandPalette({ open, onClose }: AdminCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const [comics, setComics] = useState<Comic[] | null>(null);
  const [loadingComics, setLoadingComics] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router]
  );

  // Комикуудыг зөвхөн palette анх нээгдэхэд нэг удаа татна.
  useEffect(() => {
    if (!open || comics !== null || loadingComics) return;
    setLoadingComics(true);
    getAllComics()
      .then(setComics)
      .catch(() => setComics([]))
      .finally(() => setLoadingComics(false));
  }, [open, comics, loadingComics]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlighted(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const commands = useMemo<PaletteCommand[]>(() => {
    const staticCommands: PaletteCommand[] = [
      { id: 'nav-dashboard', section: 'Хуудас', label: 'Хяналтын самбар', icon: LayoutDashboard, keywords: 'dashboard home', action: () => go('/admin') },
      { id: 'nav-comics', section: 'Хуудас', label: 'Комикууд', icon: BookOpen, keywords: 'comics manga', action: () => go('/admin/comics') },
      { id: 'nav-carousel', section: 'Хуудас', label: 'Нүүрний слайд', icon: Images, keywords: 'carousel slide', action: () => go('/admin/carousel') },
      { id: 'nav-genres', section: 'Хуудас', label: 'Жанрууд', icon: Tags, keywords: 'genres', action: () => go('/admin/genres') },
      { id: 'nav-users', section: 'Хуудас', label: 'Хэрэглэгчид', icon: Users, keywords: 'users lumio id', action: () => go('/admin/users') },
      { id: 'action-new-comic', section: 'Үйлдэл', label: 'Шинэ комик нэмэх', icon: Plus, keywords: 'new create add', action: () => go('/admin/comics/new') },
    ];

    const comicCommands: PaletteCommand[] = (comics || []).flatMap((comic) => [
      {
        id: `comic-${comic.id}`,
        section: 'Комикууд',
        label: comic.title,
        hint: comic.isPublished ? 'Нийтлэгдсэн · Засах' : 'Ноорог · Засах',
        image: comic.poster,
        keywords: comic.author || '',
        action: () => go(`/admin/comics/${comic.id}/edit`),
      },
      {
        id: `chapters-${comic.id}`,
        section: 'Комикууд',
        label: `${comic.title} — Бүлгүүд`,
        hint: `${comic.publishedChapters ?? 0}/${comic.totalChapters ?? 0} бүлэг`,
        icon: Layers,
        keywords: comic.title,
        action: () => go(`/admin/comics/${comic.id}/chapters`),
      },
    ]);

    return [...staticCommands, ...comicCommands];
  }, [comics, go]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      // Хайлтгүй үед комик бүрийг биш зөвхөн үндсэн командуудыг харуулна.
      return commands.filter((command) => command.section !== 'Комикууд');
    }
    return commands
      .filter((command) =>
        `${command.label} ${command.keywords || ''}`.toLowerCase().includes(term)
      )
      .slice(0, 12);
  }, [commands, query]);

  useEffect(() => setHighlighted(0), [query]);

  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlighted((current) => Math.min(current + 1, filtered.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlighted((current) => Math.max(current - 1, 0));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        filtered[highlighted]?.action();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, filtered, highlighted, onClose]);

  // Идэвхтэй мөрийг харагдах хэсэгт байлгана.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${highlighted}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  if (typeof document === 'undefined') return null;

  let lastSection = '';

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[130] flex items-start justify-center px-4 pt-[12vh]">
          <motion.button
            type="button"
            aria-label="Palette хаах"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Командын цонх"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d11]/95 shadow-[0_32px_90px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-4">
              {loadingComics ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-zinc-500" />
              ) : (
                <Search className="size-4 shrink-0 text-zinc-500" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Комик хайх, хуудас руу очих..."
                className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              />
              <kbd className="shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-500">
                ESC
              </kbd>
            </div>

            <div ref={listRef} className="max-h-[46vh] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-zinc-600">
                  {loadingComics ? 'Ачаалж байна...' : 'Илэрц олдсонгүй'}
                </p>
              ) : (
                filtered.map((command, index) => {
                  const showSection = command.section !== lastSection;
                  lastSection = command.section;
                  const active = index === highlighted;
                  const Icon = command.icon;

                  return (
                    <div key={command.id}>
                      {showSection && (
                        <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600 first:pt-1">
                          {command.section}
                        </p>
                      )}
                      <button
                        type="button"
                        data-index={index}
                        onClick={command.action}
                        onMouseEnter={() => setHighlighted(index)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                          active ? 'bg-white/[0.07]' : ''
                        }`}
                      >
                        {command.image ? (
                          <img
                            src={command.image}
                            alt=""
                            className="h-9 w-7 shrink-0 rounded-md border border-white/10 object-cover"
                          />
                        ) : Icon ? (
                          <span
                            className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                              active
                                ? 'bg-gradient-to-br from-pink-400/25 to-violet-500/20 text-pink-200'
                                : 'bg-white/[0.05] text-zinc-500'
                            }`}
                          >
                            <Icon className="size-3.5" />
                          </span>
                        ) : null}
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-[13px] ${
                              active ? 'text-white' : 'text-zinc-300'
                            }`}
                          >
                            {command.label}
                          </span>
                          {command.hint && (
                            <span className="block truncate text-[11px] text-zinc-600">
                              {command.hint}
                            </span>
                          )}
                        </span>
                        {active && (
                          <CornerDownLeft className="size-3.5 shrink-0 text-zinc-600" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-white/[0.07] px-4 py-2.5 text-[10px] text-zinc-600">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5">↑↓</kbd>
                шилжих
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5">↵</kbd>
                нээх
              </span>
              <span className="ml-auto text-zinc-700">Lumio Admin</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
