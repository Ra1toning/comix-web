"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SeriesCard } from "@/components/shared/SeriesCard"
import { Comic } from "@/lib/services/firebase-comic"

export function SeasonalReleasesSlider({ comics }: { comics: Comic[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)
  const [paused, setPaused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const reduceMotion = useReducedMotion()

  const metrics = useCallback(() => {
    const track = trackRef.current
    const card = track?.firstElementChild as HTMLElement | null
    if (!track || !card) return null
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 20
    return { track, step: card.offsetWidth + gap }
  }, [])

  const update = useCallback(() => {
    const value = metrics()
    if (!value) return
    const { track, step } = value
    setCanLeft(track.scrollLeft > 4)
    setCanRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 4)
    setActiveIndex(Math.round(track.scrollLeft / step))
  }, [metrics])

  const move = useCallback((direction: -1 | 1) => {
    const value = metrics()
    if (!value) return
    value.track.scrollBy({ left: direction * value.step, behavior: "smooth" })
  }, [metrics])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    update()
    track.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(track)
    return () => {
      track.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [comics.length, update])

  useEffect(() => {
    if (paused || reduceMotion || comics.length < 2) return
    const timer = window.setInterval(() => {
      const track = trackRef.current
      if (!track) return
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 8) {
        track.scrollTo({ left: 0, behavior: "smooth" })
      } else {
        move(1)
      }
    }, 4000)
    return () => window.clearInterval(timer)
  }, [comics.length, move, paused, reduceMotion])

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div
        ref={trackRef}
        className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-5 scroll-smooth sm:gap-5"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {comics.map((comic) => (
          <div key={comic.id} className="w-[72vw] max-w-[270px] shrink-0 snap-start sm:w-[240px] lg:w-[270px]">
            <SeriesCard
              series={{
                id: comic.id,
                title: comic.title,
                tags: comic.genres.slice(0, 2),
                ch: comic.publishedChapters,
                imageUrl: comic.poster,
              }}
            />
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" size="icon" onClick={() => move(-1)} disabled={!canLeft} title="Өмнөх" className="absolute -left-4 top-[44%] z-10 hidden -translate-y-1/2 rounded-none border border-white/15 bg-black/85 text-white backdrop-blur-md hover:bg-white hover:text-black md:inline-flex">
        <ChevronLeft className="size-5" />
      </Button>
      <Button type="button" variant="secondary" size="icon" onClick={() => move(1)} disabled={!canRight} title="Дараах" className="absolute -right-4 top-[44%] z-10 hidden -translate-y-1/2 rounded-none border border-white/15 bg-black/85 text-white backdrop-blur-md hover:bg-white hover:text-black md:inline-flex">
        <ChevronRight className="size-5" />
      </Button>

      <div className="flex items-center gap-1.5">
        {comics.slice(0, 8).map((comic, index) => (
          <span key={comic.id} className={`h-px transition-all duration-500 ${index === activeIndex ? "w-8 bg-pink-400" : "w-3 bg-white/20"}`} />
        ))}
        <span className="ml-3 text-[10px] uppercase text-zinc-600">{paused ? "түр зогссон" : "автомат"}</span>
      </div>
    </div>
  )
}
