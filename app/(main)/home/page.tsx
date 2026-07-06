"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, History, Zap } from "lucide-react"

import { FeaturedCarousel } from "@/components/shared/FeaturedCarousel"
import { SeasonalReleasesSlider } from "@/components/shared/SeasonalReleasesSlider"
import { ContinueReadingCard, ContinueReadingProps } from "@/components/shared/ContinueReadingCard"
import { LatestReleaseRow, LatestReleaseProps } from "@/components/shared/LatestReleaseRow"
import { EmptyState } from "@/components/shared/EmptyState"
import { Reveal } from "@/components/shared/Reveal"
import { Skeleton } from "@/components/ui/skeleton"
import { getPublishedComics, getComicByIdSafe, getLatestChapters, Comic } from "@/lib/services/firebase-comic"
import { getContinueReading } from "@/lib/services/firebase-reading"
import { useAuth } from "@/lib/useAuth"
import { normalizeComicStatus } from "@/lib/comic-taxonomy"

type LatestItem = Omit<LatestReleaseProps, "id"> & {
  id: string
  comicId: string
  chapterId: string
}

function timeAgo(value: any) {
  if (!value) return "саяхан"
  const date = value.toDate ? value.toDate() : new Date(value)
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days <= 0) return "өнөөдөр"
  if (days === 1) return "өчигдөр"
  if (days < 7) return `${days} өдрийн өмнө`
  if (days < 30) return `${Math.floor(days / 7)} долоо хоногийн өмнө`
  return `${Math.floor(days / 30)} сарын өмнө`
}

const SectionTitle = ({
  icon,
  children,
  action,
}: {
  icon?: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
}) => (
  <div className="mb-8 flex items-end justify-between gap-4">
    <div>
      <div className="mb-3 h-px w-10 bg-pink-400" />
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-2xl font-medium text-white sm:text-3xl">{children}</h2>
      </div>
    </div>
    {action}
  </div>
)

export default function HomePage() {
  const { user } = useAuth()
  const [seasonal, setSeasonal] = useState<Comic[]>([])
  const [latest, setLatest] = useState<LatestItem[]>([])
  const [continueItems, setContinueItems] = useState<ContinueReadingProps[]>([])
  const [loadingSeasonal, setLoadingSeasonal] = useState(true)
  const [loadingLatest, setLoadingLatest] = useState(true)
  const [loadingContinue, setLoadingContinue] = useState(true)

  useEffect(() => {
    getPublishedComics()
      .then((items) => setSeasonal(items.filter((comic) => normalizeComicStatus(comic.status) === "Идэвхтэй")))
      .catch(console.error)
      .finally(() => setLoadingSeasonal(false))

    getLatestChapters(6)
      .then(async (chapters) => {
        const comics = await Promise.all(chapters.map((chapter) => getComicByIdSafe(chapter.comicId)))
        setLatest(chapters.flatMap((chapter, index) => {
          const comic = comics[index]
          return comic && comic.isPublished !== false ? [{
            id: chapter.id,
            title: comic.title,
            chapter: chapter.chapterNumber,
            timeAgo: timeAgo(chapter.createdAt),
            tags: comic.genres || [],
            imageUrl: comic.poster,
            comicId: comic.id,
            chapterId: chapter.id,
          }] : []
        }))
      })
      .catch(console.error)
      .finally(() => setLoadingLatest(false))
  }, [])

  useEffect(() => {
    if (!user) {
      setContinueItems([])
      setLoadingContinue(false)
      return
    }
    setLoadingContinue(true)
    getContinueReading(user.uid, 6)
      .then((items) => setContinueItems(items.map(({ progress, comic }) => ({
        id: comic.id,
        title: comic.title,
        chapterId: progress.chapterId,
        chapterNumber: progress.chapterNumber || comic.publishedChapters,
        progress: progress.progressPercent || 0,
        image: comic.poster,
      }))))
      .catch(console.error)
      .finally(() => setLoadingContinue(false))
  }, [user])

  return (
    <div className="mx-auto max-w-[1400px] space-y-16 px-4 sm:px-6 lg:space-y-24 lg:px-12">
      <Reveal><FeaturedCarousel /></Reveal>

      {(loadingContinue || continueItems.length > 0) && (
        <Reveal>
          <section className="border-t border-white/10 pt-8">
            <SectionTitle icon={<History className="size-5 text-zinc-500" />}>Үргэлжлүүлэн унших</SectionTitle>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 scrollbar-hide sm:gap-5">
              {loadingContinue
                ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40 min-w-[82vw] rounded-lg sm:min-w-[320px]" />)
                : continueItems.map((item) => (
                    <div key={item.id} className="min-w-[82vw] snap-start sm:min-w-[340px]">
                      <ContinueReadingCard item={item} />
                    </div>
                  ))}
            </div>
          </section>
        </Reveal>
      )}

      <Reveal>
        <section className="border-t border-white/10 pt-8">
          <SectionTitle
            icon={<Zap className="size-5 text-pink-400" />}
            action={
              <Link href="/series?tab=airing" className="group flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-white">
                БҮГД <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            }
          >
            Улирлын гаргалтууд
          </SectionTitle>
          {loadingSeasonal ? (
            <div className="flex gap-5 overflow-hidden">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="aspect-2/3 min-w-[230px] rounded-none" />)}
            </div>
          ) : seasonal.length ? (
            <SeasonalReleasesSlider comics={seasonal} />
          ) : (
            <EmptyState title="Одоогоор бүтээл алга" description="Үргэлжилж буй бүтээл нэмэгдэхэд энд харагдана." />
          )}
        </section>
      </Reveal>

      <Reveal>
        <section className="border-t border-white/10 pt-8">
          <SectionTitle>Сүүлд нэмэгдсэн бүлгүүд</SectionTitle>
          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10">
            {loadingLatest
              ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-none" />)
              : latest.map((item) => (
                  <Link key={item.id} href={`/series/${item.comicId}/read?chapter=${item.chapterId}`} className="bg-[#080808]">
                    <LatestReleaseRow item={item} />
                  </Link>
                ))}
          </div>
          {!loadingLatest && !latest.length && <EmptyState title="Шинэ бүлэг алга" description="Шинэ бүлгүүд нэмэгдэхэд энд харагдана." />}
        </section>
      </Reveal>
    </div>
  )
}
