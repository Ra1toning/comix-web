"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SeriesFilterSidebar } from "@/components/shared/SeriesFilterSidebar"
import { CatalogSeriesCard, CatalogSeriesProps } from "@/components/shared/CatalogSeriesCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { Reveal } from "@/components/shared/Reveal"
import { getAllComics, Comic } from "@/lib/services/firebase-comic"
import { getGenres } from "@/lib/services/firebase-genres"
import { COMIC_STATUSES, COMIC_TYPES } from "@/lib/comic-taxonomy"

const TYPES = COMIC_TYPES.map((label) => ({ id: label, label }))
const STATUSES = COMIC_STATUSES.map((label) => ({ id: label, label }))

function toDate(value: any) {
  if (value instanceof Date) return value
  if (value?.toDate) return value.toDate()
  return new Date(value || 0)
}

function timeAgo(value: any) {
  const days = Math.floor((Date.now() - toDate(value).getTime()) / 86400000)
  if (days <= 0) return "өнөөдөр"
  if (days === 1) return "өчигдөр"
  if (days < 7) return `${days} өдрийн өмнө`
  if (days < 30) return `${Math.floor(days / 7)} долоо хоногийн өмнө`
  return `${Math.floor(days / 30)} сарын өмнө`
}

export default function SeriesListPage() {
  const [comics, setComics] = useState<Comic[]>([])
  const [genreOptions, setGenreOptions] = useState<{ id: string; label: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [types, setTypes] = useState<string[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState("newest")
  const [page, setPage] = useState(1)
  const perPage = 20

  useEffect(() => {
    Promise.all([getAllComics(), getGenres()])
      .then(([comicItems, managedGenres]) => {
        setComics(comicItems)
        const names = managedGenres.length
          ? managedGenres.map((genre) => genre.name)
          : Array.from(new Set(comicItems.flatMap((comic) => comic.genres || []))).sort()
        setGenreOptions(names.map((name) => ({ id: name, label: name })))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const items = useMemo(() => {
    const mapped = comics.map((comic) => ({
      id: comic.id,
      title: comic.title,
      chapter: comic.publishedChapters,
      timeAgo: timeAgo(comic.createdAt),
      imageUrl: comic.poster,
      badge: (comic.createdAt && (Date.now() - toDate(comic.createdAt).getTime()) / 86400000 <= 3 ? "NEW" : comic.viewCount && comic.viewCount > 2000000 ? "HOT" : null) as "NEW" | "HOT" | null,
      viewCount: comic.viewCount || 0,
      likeCount: comic.likeCount || 0,
      status: comic.status || "",
      type: comic.type || "",
      genres: comic.genres || [],
      createdAt: comic.createdAt,
    }))
    return mapped
      .filter((item) => !query || item.title.toLowerCase().includes(query.toLowerCase()))
      .filter((item) => !types.length || types.includes(item.type))
      .filter((item) => !genres.length || genres.some((genre) => item.genres.some((value) => value.toLowerCase() === genre.toLowerCase())))
      .filter((item) => !statuses.length || statuses.includes(item.status))
      .sort((a, b) => sort === "popular"
        ? b.viewCount - a.viewCount
        : sort === "rating"
          ? b.likeCount - a.likeCount
          : toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
  }, [comics, genres, query, sort, statuses, types])

  useEffect(() => setPage(1), [genres, query, sort, statuses, types])

  const toggle = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])

  const pages = Math.ceil(items.length / perPage)
  const visible = items.slice((page - 1) * perPage, page * perPage) as CatalogSeriesProps[]

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
      <Reveal>
        <header className="mb-10 border-b border-white/10 pb-8 sm:mb-14 sm:pb-12">
          <p className="mb-4 text-xs font-semibold uppercase text-pink-400">Каталог</p>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <h1 className="max-w-3xl text-4xl font-semibold text-white sm:text-6xl">Өнөөдөр юу уншмаар байна?</h1>
            <p className="max-w-sm text-sm leading-6 text-zinc-500">Төрөл, жанр, төлвөөр шүүж өөрийн хэмнэлд тохирох бүтээлээ сонгоорой.</p>
          </div>
        </header>
      </Reveal>

      <div className="flex flex-col gap-8 lg:flex-row">
        <SeriesFilterSidebar
          types={TYPES}
          genres={genreOptions}
          statuses={STATUSES}
          selectedTypes={types}
          selectedGenres={genres}
          selectedStatuses={statuses}
          onTypeChange={(id) => toggle(id, setTypes)}
          onGenreToggle={(id) => toggle(id, setGenres)}
          onStatusChange={(id) => toggle(id, setStatuses)}
          onSearch={setQuery}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-7 flex items-center justify-between border-b border-white/10 pb-4">
            <p className="text-sm text-zinc-500"><span className="text-white">{items.length}</span> бүтээл</p>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="border border-white/10 bg-[#080808] px-3 py-2 text-sm text-white outline-none">
              <option value="newest">Шинэ нь эхэндээ</option>
              <option value="popular">Олны анхааралд</option>
              <option value="rating">Өндөр үнэлгээтэй</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => <Skeleton key={index} className="aspect-2/3 rounded-none" />)}
            </div>
          ) : visible.length ? (
            <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.045 } } }} className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 xl:grid-cols-5">
              {visible.map((item) => (
                <motion.div key={item.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.5 }}>
                  <CatalogSeriesCard item={item} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyState title="Бүтээл олдсонгүй" description="Шүүлтүүрээ өөрчлөөд дахин хайгаарай." />
          )}

          {pages > 1 && (
            <div className="mt-14 flex justify-center gap-2 border-t border-white/10 pt-8">
              {Array.from({ length: Math.min(pages, 5) }, (_, index) => index + 1).map((number) => (
                <Button key={number} onClick={() => setPage(number)} variant="outline" className={`size-10 rounded-none p-0 ${page === number ? "border-white bg-white text-black" : "border-white/10 bg-transparent text-zinc-400"}`}>
                  {number}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
