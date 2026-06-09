"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Flame } from "lucide-react"
import Link from "next/link"
import { getHomepageCarouselItems, CarouselItemWithComic } from "@/lib/services/firebase-carousel"
import { Skeleton } from "@/components/ui/skeleton"

export function FeaturedCarousel() {
  const [items, setItems] = useState<CarouselItemWithComic[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getHomepageCarouselItems()
        setItems(data)
      } catch (error) {
        console.error("Error fetching carousel items:", error)
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [])


  useEffect(() => {
    if (items.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [items.length])

  const moveSlide = (direction: number) => {
    setCurrentIndex((current) => (current + direction + items.length) % items.length)
  }

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX.current === null) return
    const distance = clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(distance) < 50) return
    moveSlide(distance < 0 ? 1 : -1)
  }

  if (loading) {
    return (
      <section className="relative mb-10 h-[440px] overflow-hidden rounded-lg border border-white/10 bg-white/2 p-5 sm:mb-16 sm:h-[500px] sm:p-8 md:p-14">
        <Skeleton className="w-full h-full" />
      </section>
    )
  }

  if (items.length === 0) {
    return null
  }

  const current = items[currentIndex]
  return (
    <section
      className="group relative mb-10 flex h-[440px] touch-pan-y items-end overflow-hidden rounded-lg border border-white/10 bg-white/2 p-5 sm:mb-16 sm:h-[500px] sm:items-center sm:p-8 md:p-14"
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null
      }}
      onTouchCancel={() => {
        touchStartX.current = null
      }}
      onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
    >

      {items.map((item, index) => {
        const img = item.bannerImageOverride || item.comic?.bannerImage || item.comic?.poster || ""
        return (
          <div
            key={item.id}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-[1500ms] ease-in-out ${
              index === currentIndex
                ? "opacity-100 scale-100"
                : "opacity-0 scale-105 pointer-events-none"
            }`}
            style={{ backgroundImage: `url('${img}')` }}
          />
        )
      })}


      <div className="absolute inset-0 z-10 bg-linear-to-t from-black via-black/35 to-black/5 sm:bg-linear-to-r sm:from-[#020202] sm:via-[#020202]/75 sm:to-transparent" />


      <div className="relative z-20 w-full max-w-2xl px-0 pb-5 sm:px-2 sm:pb-0">
        <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 font-medium tracking-wide px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-4 sm:mb-6 pointer-events-none text-[10px] sm:text-xs">
          <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2 inline" />
          {current.badgeText || "Featured"}
        </Badge>

        <div className="relative mb-2 h-16 overflow-hidden sm:mb-4 sm:h-32">
          {items.map((item, index) => (
            <h1
              key={item.id}
              className={`absolute top-0 line-clamp-2 w-full pr-4 text-2xl font-medium leading-tight text-white transition-all duration-[1000ms] sm:line-clamp-none sm:pr-0 sm:text-4xl md:text-6xl ${
                index === currentIndex
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              {item.titleOverride || item.comic?.title}
            </h1>
          ))}
        </div>

        <div className="relative mb-5 h-[66px] w-full overflow-hidden pr-4 sm:mb-10 sm:h-[84px] sm:pr-0">
          {items.map((item, index) => (
            <p
              key={item.id}
              className={`absolute top-0 line-clamp-3 max-w-xl text-sm font-light leading-relaxed text-zinc-200 transition-all delay-100 duration-[1000ms] sm:line-clamp-none sm:text-lg sm:text-zinc-400 ${
                index === currentIndex
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              {item.descriptionOverride || item.comic?.description}
            </p>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 sm:gap-4">
          {current.comic && (
            <>
              <Link href={`/series/${current.comic.id}`}>
                <Button className="rounded-full bg-white text-black hover:bg-zinc-200 hover:scale-105 transition-all duration-500 px-6 sm:px-8 h-10 sm:h-12 font-medium text-sm sm:text-base">
                  Уншиж эхлэх
                </Button>
              </Link>
              <Link href={`/series/${current.comic.id}`}>
                <Button variant="outline" className="rounded-full bg-white/3 border-white/10 hover:bg-white/10 hover:text-white transition-all duration-500 px-6 sm:px-8 h-10 sm:h-12 font-medium text-sm sm:text-base">
                  Дэлгэрэнгүй
                </Button>
              </Link>
            </>
          )}
        </div>


        <div className="absolute bottom-0 left-0 flex gap-2 sm:bottom-[-2rem] sm:left-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentIndex ? "w-8 bg-pink-500" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
