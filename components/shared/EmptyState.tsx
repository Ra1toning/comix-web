import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  title: string
  description?: string
  className?: string
  imageClassName?: string
}

export function EmptyState({ title, description, className, imageClassName }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 text-center text-zinc-400", className)}>
      <img
        src="/errorImage.png"
        alt="Empty"
        className={cn("w-48 h-auto opacity-80", imageClassName)}
      />
      <div className="space-y-1">
        <p className="text-base text-white">{title}</p>
        {description && <p className="text-sm">{description}</p>}
      </div>
    </div>
  )
}
