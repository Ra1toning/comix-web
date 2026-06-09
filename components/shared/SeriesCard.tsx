import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

export interface SeriesProps {
  id: string | number
  title: string
  tags: string[]
  ch: number
  imageUrl?: string
}

export function SeriesCard({ series }: { series: SeriesProps }) {
  return (
    <Link href={`/series/${series.id}`} className="group block">
      <div
        className="relative aspect-2/3 overflow-hidden border border-white/10 bg-zinc-900 bg-cover bg-center transition-all duration-700 group-hover:-translate-y-1 group-hover:border-white/25"
        style={series.imageUrl ? { backgroundImage: `url('${series.imageUrl}')` } : undefined}
      >
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/5 to-transparent opacity-70 transition-opacity duration-700 group-hover:opacity-100" />
        <div className="absolute right-3 top-3 bg-black/65 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur-md">
          CH. {series.ch}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="mb-2 flex items-end justify-between gap-3">
            <h3 className="line-clamp-2 text-lg font-medium leading-tight text-white">{series.title}</h3>
            <ArrowUpRight className="size-4 shrink-0 text-zinc-500 transition-colors group-hover:text-pink-300" />
          </div>
          <div className="flex gap-2 overflow-hidden text-[10px] text-zinc-400">
            {series.tags.map(tag => (
              <span key={tag} className="border border-white/10 bg-black/30 px-2 py-1 backdrop-blur-sm">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
