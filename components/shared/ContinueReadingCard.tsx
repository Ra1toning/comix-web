import { Card } from "@/components/ui/card"
import Link from "next/link"

export interface ContinueReadingProps {
  id: string | number
  title: string
  chapterId: string
  chapterNumber: number
  progress: number
  image?: string
}

export function ContinueReadingCard({ item }: { item: ContinueReadingProps }) {
  const progress = Math.min(100, Math.max(0, item.progress))

  return (
    <Link
      href={`/series/${item.id}/read?chapter=${item.chapterId}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
    >
      <Card className="group flex min-h-36 cursor-pointer gap-4 rounded-lg border-white/10 bg-[#0b0b0c] p-3 transition-colors hover:border-white/20 hover:bg-[#101011] sm:p-4">
        <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white/5 sm:w-24">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
            style={item.image ? { backgroundImage: `url('${item.image}')` } : undefined}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h3 className="mb-1 truncate text-base font-medium text-white transition-colors group-hover:text-pink-100 sm:text-lg">
            {item.title}
          </h3>
          <p className="mb-4 text-xs text-zinc-500 sm:text-sm">Бүлэг {item.chapterNumber}</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-pink-400 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-zinc-600">{Math.round(progress)}%</p>
        </div>
      </Card>
    </Link>
  )
}
