"use client"

import { useEffect, useId, useRef } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, X } from "lucide-react"

import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Устгах",
  cancelLabel = "Цуцлах",
  loading = false,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const frame = window.requestAnimationFrame(() => cancelRef.current?.focus())

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        event.preventDefault()
        onOpenChange(false)
        return
      }
      if (event.key !== "Tab" || !dialogRef.current) return

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
      previousFocus?.focus()
    }
  }, [loading, onOpenChange, open])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Харилцах цонх хаах"
        className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-sm"
        onClick={() => !loading && onOpenChange(false)}
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full border border-white/10 bg-[#0b0b0c] p-5 shadow-2xl sm:max-w-md sm:rounded-lg sm:p-6"
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={loading}
          aria-label="Хаах"
          className="absolute right-4 top-4 flex size-8 items-center justify-center text-zinc-500 transition-colors hover:text-white disabled:opacity-40"
        >
          <X className="size-4" />
        </button>

        <div className="flex size-10 items-center justify-center rounded-md border border-red-500/20 bg-red-500/10 text-red-400">
          <AlertTriangle className="size-5" />
        </div>
        <h2 id={titleId} className="mt-5 pr-8 text-xl font-semibold text-white">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-zinc-400">
          {description}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="border-white/10"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="bg-red-500 text-white hover:bg-red-400"
          >
            {loading ? "Устгаж байна..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
