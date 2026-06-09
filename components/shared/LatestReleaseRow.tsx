import { Badge } from "@/components/ui/badge"

export interface LatestReleaseProps {
  id: string | number
  title: string
  chapter: number
  timeAgo: string
  tags: string[]
  imageUrl?: string
}

export function LatestReleaseRow({ item }: { item: LatestReleaseProps }) {
  return (
    <div className="group flex items-center justify-between p-4 bg-white/1 hover:bg-white/3 border border-transparent hover:border-white/5 rounded-2xl transition-all duration-500 cursor-pointer relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500/0 via-pink-500/0 to-transparent w-[200px] group-hover:from-pink-500/5 group-hover:via-pink-500/5 transition-colors duration-700 pointer-events-none" />
      <div className="flex items-center gap-4 sm:gap-4 sm:gap-6 relative z-10">
        <div className="w-12 h-16 rounded-xl bg-white/5 overflow-hidden border border-white/5 shadow-2xl group-hover:scale-105 transition-transform relative">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={item.imageUrl ? { backgroundImage: `url('${item.imageUrl}')` } : undefined}
          />
        </div>
        <div>
          <h3 className="font-medium text-white text-lg group-hover:text-pink-100 transition-colors">
            {item.title}
          </h3>
          <div className="flex gap-3 text-zinc-500 text-sm mt-1 font-light">
            <span className="text-zinc-300">Chapter {item.chapter}</span>
            <span>•</span>
            <span>{item.timeAgo}</span>
          </div>
        </div>
      </div>
      <div className="hidden sm:flex items-center relative z-10">
        {item.tags.map(tag => (
          <Badge key={tag} variant="secondary" className="bg-white/5 hover:bg-white/10 text-zinc-400 rounded-full font-light border-0 transition-colors ml-2">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}
