import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export interface CatalogSeriesProps {
  id: string | number
  title: string
  chapter: number
  timeAgo: string
  imageUrl?: string
  badge?: "NEW" | "HOT" | null
}

export function CatalogSeriesCard({ item }: { item: CatalogSeriesProps }) {
  return (
    <Link href={`/series/${item.id}`} className="group cursor-pointer block">
      <div
        className="relative aspect-2/3 rounded-2xl overflow-hidden bg-white/5 bg-cover bg-center border border-white/4 group-hover:border-white/20 transition-all duration-500 mb-4"
        style={item.imageUrl ? { backgroundImage: `url('${item.imageUrl}')` } : undefined}
      >
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {item.badge && (
          <div className="absolute top-2 right-2 flex gap-1">
            <Badge className="bg-black/60 text-white backdrop-blur-md border-0 text-[10px] px-2 py-0.5 rounded-md pointer-events-none">
              {item.badge}
            </Badge>
          </div>
        )}

        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-lg shadow-lg leading-none pt-0.5">
            +
          </div>
        </div>
      </div>

      <h3 className="font-medium text-white text-base leading-tight mb-1 group-hover:text-pink-100 transition-colors line-clamp-2">
        {item.title}
      </h3>

      <div className="flex items-center justify-between text-xs font-light mt-2">
        <span className="text-zinc-500">Бүлэг {item.chapter}</span>
        <span className="text-zinc-500">{item.timeAgo}</span>
      </div>
    </Link>
  )
}
