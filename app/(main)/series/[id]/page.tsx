"use client"

import { use, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowUpRight, Bookmark, Clock, Eye, Heart, Play, Search, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { Reveal } from "@/components/shared/Reveal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Chapter, Comic, getChapters, getComicById, incrementComicViewOnce } from "@/lib/services/firebase-comic"
import {
  getLibraryEntry,
  getLikeStatus,
  getReadingProgress,
  LibraryStatus,
  ReadingProgress,
  setLibraryStatus,
  toggleComicLike,
} from "@/lib/services/firebase-reading"
import { useAuth } from "@/lib/useAuth"

function timeAgo(value: any) {
  if (!value) return "саяхан"
  const date = value.toDate ? value.toDate() : new Date(value)
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days <= 0) return "өнөөдөр"
  if (days === 1) return "өчигдөр"
  return `${days} өдрийн өмнө`
}

function compact(value = 0) {
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

const libraryLabels: Record<LibraryStatus, string> = {
  saved: "Хадгалсан",
  continue: "Уншиж буй",
  completed: "Дуусгасан",
}

export default function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const [comic, setComic] = useState<Comic | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [libraryStatus, setLibraryStatusState] = useState<LibraryStatus | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<"desc" | "asc">("desc")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getComicById(id), getChapters(id)])
      .then(([comicData, chapterData]) => {
        setComic(comicData)
        setChapters(chapterData)
        setLikeCount(comicData?.likeCount || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!user || !comic) return
    Promise.all([
      getReadingProgress(user.uid, comic.id),
      getLibraryEntry(user.uid, comic.id),
      getLikeStatus(user.uid, comic.id),
    ]).then(([reading, entry, like]) => {
      setProgress(reading)
      setLibraryStatusState(entry?.status || null)
      setLiked(like)
    }).catch(console.error)

    const key = `viewed_${comic.id}`
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1")
      incrementComicViewOnce(user.uid, comic.id)
        .then((updated) => updated && setComic((current) => current ? { ...current, viewCount: (current.viewCount || 0) + 1 } : current))
        .catch(console.error)
    }
  }, [comic?.id, user])

  const visibleChapters = useMemo(() => [...chapters]
    .sort((a, b) => sort === "desc" ? b.chapterNumber - a.chapterNumber : a.chapterNumber - b.chapterNumber)
    .filter((chapter) => !query || `${chapter.chapterNumber} ${chapter.title || ""}`.toLowerCase().includes(query.toLowerCase())), [chapters, query, sort])

  const latest = chapters.reduce<Chapter | null>((current, chapter) => !current || chapter.chapterNumber > current.chapterNumber ? chapter : current, null)
  const readChapter = progress?.chapterId || latest?.id

  const save = async (status: LibraryStatus) => {
    if (!user || !comic) return
    await setLibraryStatus(user.uid, {
      comicId: comic.id,
      status,
      chapterId: progress?.chapterId,
      currentChapterNumber: progress?.chapterNumber,
      progressPercent: progress?.progressPercent,
    })
    setLibraryStatusState(status)
  }

  const toggleLike = async () => {
    if (!user || !comic) return
    const result = await toggleComicLike(user.uid, comic.id)
    setLiked(result.liked)
    setLikeCount((value) => Math.max(0, value + result.delta))
  }

  const share = async () => {
    if (navigator.share) await navigator.share({ title: comic?.title, url: window.location.href })
    else await navigator.clipboard.writeText(window.location.href)
  }

  if (loading) {
    return <div className="mx-auto grid max-w-[1400px] gap-10 px-4 sm:px-6 lg:grid-cols-[22rem_1fr] lg:px-12"><Skeleton className="aspect-2/3 rounded-none" /><div className="space-y-6"><Skeleton className="h-16 rounded-none" /><Skeleton className="h-32 rounded-none" /><Skeleton className="h-80 rounded-none" /></div></div>
  }

  if (!comic) return <EmptyState title="Бүтээл олдсонгүй" description="Энэ бүтээл устсан эсвэл нийтлэгдээгүй байна." />

  return (
    <div className="relative -mt-28">
      <div className="relative h-[470px] overflow-hidden border-b border-white/10">
        <img src={comic.bannerImage || comic.poster} alt="" className="size-full scale-[1.02] object-cover opacity-50" />
        <div className="absolute inset-0 bg-linear-to-t from-[#050505] via-[#050505]/55 to-black/45" />
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/15 to-black/35" />
      </div>

      <div className="relative mx-auto -mt-60 max-w-[1280px] px-4 sm:px-6 lg:px-10">
        <Link href="/series" className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-zinc-400 transition-colors hover:text-white">
          <ArrowLeft className="size-4" />Каталог руу буцах
        </Link>

        <div className="grid items-end gap-7 lg:grid-cols-[17rem_1fr] lg:gap-10">
          <Reveal>
            <div className="aspect-2/3 overflow-hidden border border-white/15 bg-zinc-900 shadow-[0_24px_80px_rgba(0,0,0,.55)]">
              <img src={comic.poster} alt={comic.title} className="size-full object-cover" />
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="pb-1 lg:pb-4">
              <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px]">
                <span className="border border-white/15 bg-black/30 px-3 py-1.5 text-white backdrop-blur-md">{comic.type}</span>
                <span className="flex items-center gap-2 text-emerald-300"><span className="size-1.5 bg-emerald-300" />{comic.status}</span>
                <span className="flex items-center gap-1.5 text-zinc-400"><Eye className="size-3.5" />{compact(comic.viewCount)}</span>
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-[1.06] text-white sm:text-5xl lg:text-6xl">{comic.title}</h1>
              {comic.author && <p className="mt-3 text-sm text-zinc-400">Зохиолч: <span className="text-zinc-200">{comic.author}</span></p>}
              <div className="mt-5 flex flex-wrap gap-2">
                {comic.genres.map((genre) => <span key={genre} className="border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur-md">{genre}</span>)}
              </div>
              <p className="mt-6 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">{comic.description}</p>
            </div>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-10 border-t border-white/10 pt-8 lg:grid-cols-[17rem_1fr]">
          <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
            <p className="mb-4 text-[10px] font-semibold uppercase text-zinc-600">Уншлагын үйлдэл</p>
            <Link href={readChapter ? `/series/${id}/read?chapter=${readChapter}` : "#"} className="block">
              <Button disabled={!readChapter} className="h-12 w-full rounded-none bg-white text-black hover:bg-zinc-200">
                <Play className="mr-2 size-4 fill-current" />{progress ? "Үргэлжлүүлэн унших" : "Уншиж эхлэх"}
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-12 w-full rounded-none border-white/15 bg-transparent">
                  <Bookmark className="mr-2 size-4" />{libraryStatus ? libraryLabels[libraryStatus] : "Сандаа хадгалах"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-none border-white/10 bg-[#090909] text-white">
                <DropdownMenuLabel>Сангийн төлөв</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => save("saved")}>Хадгалсан</DropdownMenuItem>
                <DropdownMenuItem onClick={() => save("continue")}>Уншиж буй</DropdownMenuItem>
                <DropdownMenuItem onClick={() => save("completed")}>Дуусгасан</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={toggleLike} disabled={!user} variant="ghost" className={`rounded-none border border-white/10 ${liked ? "text-pink-400" : "text-zinc-400"}`}><Heart className={`mr-2 size-4 ${liked ? "fill-current" : ""}`} />{compact(likeCount)}</Button>
              <Button onClick={share} variant="ghost" className="rounded-none border border-white/10 text-zinc-400"><Share2 className="mr-2 size-4" />Хуваалцах</Button>
            </div>
            {progress && (
              <div className="border border-white/10 p-4">
                <div className="mb-2 flex justify-between text-[10px] text-zinc-500"><span>Уншсан явц</span><span>{Math.round(progress.progressPercent || 0)}%</span></div>
                <div className="h-px bg-white/10"><div className="h-full bg-pink-400" style={{ width: `${progress.progressPercent || 0}%` }} /></div>
              </div>
            )}
          </aside>

          <main className="min-w-0">
            <Reveal>
              <section>
                <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div><div className="mb-3 h-px w-10 bg-pink-400" /><h2 className="text-2xl font-medium text-white sm:text-3xl">Бүлгүүд</h2><p className="mt-2 text-xs text-zinc-600">Нийт {chapters.length} бүлэг</p></div>
                  <div className="flex gap-2">
                    <label className="relative min-w-0 flex-1 sm:w-56"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Бүлэг хайх" className="w-full border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-3 text-sm text-white outline-none" /></label>
                    <Button onClick={() => setSort((value) => value === "desc" ? "asc" : "desc")} variant="outline" className="rounded-none border-white/10">{sort === "desc" ? "Шинэ" : "Хуучин"}</Button>
                  </div>
                </div>

                <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.035 } } }} className="overflow-hidden border border-white/10 bg-white/[0.015]">
                  {visibleChapters.map((chapter) => {
                    const resume = progress?.chapterId === chapter.id
                    return (
                      <motion.div key={chapter.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                        <Link href={`/series/${id}/read?chapter=${chapter.id}`} className="group relative flex items-center justify-between gap-4 border-b border-white/10 px-3 py-4 transition-colors last:border-0 hover:bg-white/[0.035] sm:px-4">
                          {resume && <span className="absolute inset-y-0 left-0 bg-pink-400/5" style={{ width: `${progress?.progressPercent || 0}%` }} />}
                          <div className="relative flex min-w-0 items-center gap-4">
                            <span className={`flex size-10 shrink-0 items-center justify-center border text-sm ${resume ? "border-pink-400/40 text-pink-300" : "border-white/10 text-zinc-500"}`}>{chapter.chapterNumber}</span>
                            <div className="min-w-0"><h3 className="truncate text-sm text-zinc-200 group-hover:text-white">{chapter.title || `Бүлэг ${chapter.chapterNumber}`}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-600"><Clock className="size-3" />{timeAgo(chapter.createdAt)}{resume && " · Үргэлжлүүлэх"}</p></div>
                          </div>
                          <ArrowUpRight className="size-4 shrink-0 text-zinc-700 transition-colors group-hover:text-pink-300" />
                        </Link>
                      </motion.div>
                    )
                  })}
                </motion.div>
                {!visibleChapters.length && <EmptyState title="Бүлэг олдсонгүй" description="Хайлтын үгээ өөрчлөөд үзээрэй." />}
              </section>
            </Reveal>
          </main>
        </div>
      </div>
    </div>
  )
}
