import Link from "next/link"
import { ArrowUpRight, Check } from "lucide-react"

export interface ProfileLibraryCardProps {
  id: string
  title: string
  image: string
  status: "Уншиж буй" | "Дуусгасан" | "Хадгалсан"
  progress?: number
  currentChapter?: number
  totalChapters?: number
  chapterId?: string
}

export function ProfileLibraryCard({ item, activeTab }: { item: ProfileLibraryCardProps; activeTab: string }) {
  const href = activeTab === "continue" && item.chapterId ? `/series/${item.id}/read?chapter=${item.chapterId}` : `/series/${item.id}`
  return (
    <Link href={href} className="group block">
      <div className="relative mb-3 aspect-2/3 overflow-hidden border border-white/10 bg-zinc-900">
        <img src={item.image} alt={item.title} className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-80" />
        <span className="absolute right-3 top-3 flex size-8 items-center justify-center bg-black/65 text-white backdrop-blur-md">
          {activeTab === "completed" ? <Check className="size-4" /> : <ArrowUpRight className="size-4" />}
        </span>
        <div className="absolute inset-x-3 bottom-3">
          {activeTab === "continue" && (
            <div className="h-1 bg-white/20"><div className="h-full bg-pink-400" style={{ width: `${item.progress || 0}%` }} /></div>
          )}
          <p className="mt-2 text-xs font-medium text-white">Бүлэг {item.currentChapter || 1}</p>
        </div>
      </div>
      <h3 className="truncate text-sm font-medium text-white transition-colors group-hover:text-pink-300">{item.title}</h3>
      {item.totalChapters !== undefined && <p className="mt-1 text-xs text-zinc-600">Нийт {item.totalChapters} бүлэг</p>}
    </Link>
  )
}
