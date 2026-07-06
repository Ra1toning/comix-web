'use client';

/**
 * Админ хэсгийн нэгдсэн UI жижиг хэсгүүд — бүх хуудас ижил хэв
 * загвартай байхын тулд эндээс л авч хэрэглэнэ.
 */

import { useEffect, useRef, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Тоог 0-ээс зөөлөн гүйлгэж харуулна (ease-out cubic). */
function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (from === value) {
      setDisplay(value);
      return;
    }
    let frame: number;
    const start = performance.now();
    const duration = 750;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

/** Хуудасны стандарт толгой: гарчиг, тайлбар, баруун талд үйлдлүүд. */
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="h-5 w-1 rounded-full bg-gradient-to-b from-pink-400 to-violet-500 shadow-[0_0_12px_rgba(236,72,153,0.5)]" />
          <h1 className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-xl font-semibold tracking-tight text-transparent sm:text-2xl">
            {title}
          </h1>
        </div>
        {description && (
          <p className="mt-1.5 pl-4 text-[13px] leading-5 text-zinc-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Контентын үндсэн glass хавтан. */
export function AdminPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.08] bg-white/[0.025] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl',
        className
      )}
    >
      {children}
    </div>
  );
}

/** Хавтангийн доторх гарчигтай толгой мөр. */
export function AdminPanelHeader({
  title,
  hint,
  actions,
}: {
  title: string;
  hint?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {hint && <span className="text-xs text-zinc-600">{hint}</span>}
      </div>
      {actions}
    </div>
  );
}

const TILE_TONES = {
  default: {
    icon: 'from-zinc-400/30 to-zinc-600/20 text-zinc-200',
    orb: 'bg-zinc-400/[0.06]',
  },
  pink: {
    icon: 'from-pink-400/35 to-fuchsia-600/25 text-pink-200',
    orb: 'bg-pink-400/[0.09]',
  },
  emerald: {
    icon: 'from-emerald-400/35 to-teal-600/25 text-emerald-200',
    orb: 'bg-emerald-400/[0.08]',
  },
  amber: {
    icon: 'from-amber-400/35 to-orange-600/25 text-amber-200',
    orb: 'bg-amber-400/[0.08]',
  },
  sky: {
    icon: 'from-sky-400/35 to-blue-600/25 text-sky-200',
    orb: 'bg-sky-400/[0.08]',
  },
} as const;

export type StatTone = keyof typeof TILE_TONES;

/** Статистикийн нүд — gradient icon, гүйдэг тоо, буланд туяа. */
export function AdminStatTile({
  label,
  value,
  icon: Icon,
  tone = 'default',
  loading = false,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: StatTone;
  loading?: boolean;
}) {
  const tones = TILE_TONES[tone];
  return (
    <AdminPanel className="group relative overflow-hidden p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.15]">
      <span
        aria-hidden
        className={cn(
          'absolute -right-8 -top-8 size-28 rounded-full opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100',
          tones.orb
        )}
      />
      <div className="relative flex items-center gap-3.5">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br',
            tones.icon
          )}
        >
          <Icon className="size-[18px]" />
        </span>
        <div className="min-w-0">
          {loading ? (
            <Skeleton className="h-7 w-14 rounded-md" />
          ) : (
            <p className="text-[22px] font-semibold leading-7 tracking-tight text-white tabular-nums">
              {typeof value === 'number' ? <CountUp value={value} /> : value}
            </p>
          )}
          <p className="truncate text-xs text-zinc-500">{label}</p>
        </div>
      </div>
    </AdminPanel>
  );
}

/** Хүснэгтийн стандарт загвар — thead/tbody-г нэг маягаар харуулна. */
export function AdminTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm [&_tbody_td]:px-5 [&_tbody_td]:py-3 [&_tbody_tr]:border-t [&_tbody_tr]:border-white/[0.05] [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-white/[0.03] [&_th]:whitespace-nowrap [&_th]:px-5 [&_th]:py-3 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-zinc-500">
        {children}
      </table>
    </div>
  );
}

/** Төлвийн жижиг гэрэлтдэг чип. */
export function StatusChip({
  tone,
  children,
}: {
  tone: 'emerald' | 'amber' | 'sky' | 'pink' | 'zinc';
  children: React.ReactNode;
}) {
  const tones = {
    emerald: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25 shadow-[0_0_14px_rgba(52,211,153,0.12)]',
    amber: 'bg-amber-400/10 text-amber-300 border-amber-400/25 shadow-[0_0_14px_rgba(251,191,36,0.10)]',
    sky: 'bg-sky-400/10 text-sky-300 border-sky-400/25 shadow-[0_0_14px_rgba(56,189,248,0.10)]',
    pink: 'bg-pink-400/10 text-pink-300 border-pink-400/25 shadow-[0_0_14px_rgba(244,114,182,0.12)]',
    zinc: 'bg-white/[0.05] text-zinc-400 border-white/10',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        tones[tone]
      )}
    >
      <span className="size-1 rounded-full bg-current" />
      {children}
    </span>
  );
}

/** Хуудас нээгдэхэд зөөлөн blur-ээс тодрох хөдөлгөөн. */
export function AdminPageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
