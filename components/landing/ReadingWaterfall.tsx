"use client"

import { useMemo, useRef } from "react"
import Link from "next/link"
import { Bookmark, ChevronRight, Cloud, MousePointer2 } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { useAuthStore } from "@/lib/authStore"
import { Comic } from "@/lib/services/firebase-comic"
import { normalizeComicStatus } from "@/lib/comic-taxonomy"

const features = [
  {
    icon: MousePointer2,
    title: "Өөртөө тохируул",
    description: "Унших орчноо өөрт эвтэйхэн байдлаар тохируулж, дуртай бүтээлээ илүү тухтай уншаарай.",
  },
  {
    icon: Cloud,
    title: "Орхисон газраасаа үргэлжлүүл",
    description: "Хамгийн сүүлд уншиж байсан хэсгээсээ шууд үргэлжлүүлэн унших боломжтой.",
  },
  {
    icon: Bookmark,
    title: "Өөрийн сангаа байгуул",
    description: "Таалагдсан бүтээлүүдээ хадгалж, нэг цонхноос бүгдийг нь нэг дороос хянах боломжтой.",
  },
]

function WaterfallCard({
  comic,
  index,
  href,
}: {
  comic: Comic
  index: number
  href: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={href}
        className="group relative block aspect-[2/3] overflow-hidden rounded-lg border border-white/10 bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
      >
        {comic.poster ? (
          <img
            src={comic.poster}
            alt={comic.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-600">No cover</div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/5 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-95" />
        <div className="absolute inset-x-0 bottom-0 translate-y-4 p-4 transition-transform duration-500 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase text-white/60">
            <span>{comic.type}</span>
            <span className="h-1 w-1 rounded-full bg-pink-400" />
            <span>{comic.status}</span>
          </div>
          <h3 className="line-clamp-2 text-base font-semibold leading-tight text-white">{comic.title}</h3>
          <p className="mt-2 max-h-0 overflow-hidden text-xs text-white/60 opacity-0 transition-all duration-500 group-hover:max-h-8 group-hover:opacity-100 group-focus-visible:max-h-8 group-focus-visible:opacity-100">
            {comic.publishedChapters} бүлэг нийтлэгдсэн
          </p>
        </div>
      </Link>
    </motion.div>
  )
}

export function ReadingWaterfall({ comics }: { comics: Comic[] }) {
  const user = useAuthStore(state => state.user)
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const columnOneY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [80, -80])
  const columnTwoY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [140, -140])
  const columnThreeY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [40, -110])

  const showcaseComics = useMemo(() => comics.slice(0, 12), [comics])
  const columns = [
    showcaseComics.filter((_, index) => index % 3 === 0),
    showcaseComics.filter((_, index) => index % 3 === 1),
    showcaseComics.filter((_, index) => index % 3 === 2),
  ]
  const totalChapters = comics.reduce((sum, comic) => sum + (comic.publishedChapters || 0), 0)
  const ongoingCount = comics.filter(comic => normalizeComicStatus(comic.status) === "Идэвхтэй").length
  const waterfallHeight =
    showcaseComics.length <= 6
      ? "h-[600px] sm:h-[680px] lg:h-[740px]"
      : showcaseComics.length <= 9
        ? "h-[760px] sm:h-[860px] lg:h-[940px]"
        : "h-[820px] sm:h-[980px] lg:h-[1120px]"

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-y border-white/5 bg-[#050505] px-4 py-20 sm:px-8 sm:py-24 md:px-12 lg:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase text-pink-300">
              Уншихад илүү амархан
            </div>
            <h2 className="max-w-xl text-4xl font-semibold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Тав тухтай унших орон зайг мэдрээрэй
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-zinc-400 sm:text-lg">
              Дуртай бүтээлээ илүү хялбар, цэгцтэй, тухтай унших боломжийг бүрдүүлэхийн тулд бид дараах онцлогуудыг санал болгож байна.
            </p>
          </motion.div>

          <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-[40px_1fr] gap-4 py-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <Icon className="h-4 w-4 text-pink-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">{feature.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10">
            <div className="bg-[#080808] p-4">
              <p className="text-xl font-semibold text-white">{comics.length}</p>
              <p className="mt-1 text-[11px] text-zinc-500">бүтээл</p>
            </div>
            <div className="bg-[#080808] p-4">
              <p className="text-xl font-semibold text-white">{ongoingCount}</p>
              <p className="mt-1 text-[11px] text-zinc-500">үргэлжилж буй</p>
            </div>
            <div className="bg-[#080808] p-4">
              <p className="text-xl font-semibold text-white">{totalChapters}</p>
              <p className="mt-1 text-[11px] text-zinc-500">нийт бүлэг</p>
            </div>
          </div>

          <Link href="/register" className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white">
            Туршиж үзэх
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <div className={`relative overflow-hidden ${waterfallHeight}`}>
          <div className="absolute inset-x-0 top-0 z-10 h-28 bg-linear-to-b from-[#050505] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 z-10 h-36 bg-linear-to-t from-[#050505] to-transparent" />
          {showcaseComics.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[columnOneY, columnTwoY, columnThreeY].map((columnY, columnIndex) => (
                <motion.div
                  key={columnIndex}
                  style={{ y: columnY }}
                  className={`space-y-3 sm:space-y-4 ${columnIndex === 1 ? "pt-20 sm:pt-32" : ""}`}
                >
                  {columns[columnIndex].map((comic, index) => (
                    <WaterfallCard
                      key={comic.id}
                      comic={comic}
                      index={index + columnIndex}
                      href={user ? `/series/${comic.id}` : "/login"}
                    />
                  ))}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center border-y border-white/10 text-sm text-zinc-600">
              Каталог ачаалж байна
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
