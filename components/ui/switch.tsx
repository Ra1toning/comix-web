"use client"

import { cn } from "@/lib/utils"

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  "aria-label"?: string
  className?: string
}

/** Жижиг toggle switch — хүснэгт доторх шуурхай төлөв солиход зориулав. */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/40 disabled:cursor-not-allowed disabled:opacity-40",
        checked
          ? "border-emerald-400/50 bg-emerald-400/90"
          : "border-white/15 bg-white/[0.06]",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block size-4 rounded-full shadow-sm transition-transform duration-200",
          checked ? "translate-x-[19px] bg-zinc-950" : "translate-x-[3px] bg-zinc-400"
        )}
      />
    </button>
  )
}
