"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { useAuthStore } from "@/lib/authStore"
import { Comic } from "@/lib/services/firebase-comic"

function CatalogCard({ comic, href }: { comic: Comic; href: string }) {
  return (
    <Link
      href={href}
      className="group block w-[170px] shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 sm:w-[210px] lg:w-[240px]"
    >
        <span className="relative block aspect-[2/3] overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
          {comic.poster && (
            <img
              src={comic.poster}
              alt={comic.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
              loading="lazy"
            />
          )}
          <span className="absolute inset-0 bg-linear-to-t from-black via-black/5 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-95" />
          <span className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase text-white/70 backdrop-blur-md">
            {comic.type}
          </span>
          <span className="absolute inset-x-0 bottom-0 translate-y-3 p-4 transition-transform duration-500 group-hover:translate-y-0">
            <strong className="line-clamp-2 block text-sm font-semibold text-white sm:text-base">
              {comic.title}
            </strong>
            <span className="mt-2 block max-h-0 overflow-hidden text-xs text-white/55 opacity-0 transition-all duration-500 group-hover:max-h-5 group-hover:opacity-100">
              {comic.publishedChapters} бүлэг · {comic.status}
            </span>
          </span>
        </span>
    </Link>
  )
}

export function CatalogMarquee({ comics }: { comics: Comic[] }) {
  const user = useAuthStore(state => state.user)
  const reduceMotion = useReducedMotion()
  const items = useMemo(() => comics.slice(0, 12), [comics])
  const repeatedItems = useMemo(
    () => (items.length > 0 ? [...items, ...items] : []),
    [items]
  )
  const duration = Math.max(28, items.length * 5)

  return (
    <section className="overflow-hidden border-b border-white/5 bg-[#050505] pb-20 pt-7 sm:pb-24 sm:pt-9">
      <div className="mx-auto mb-9 flex max-w-7xl items-end justify-between gap-6 px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold uppercase text-pink-300">
            Өнөөдөр
          </p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
            Шинээр нэмэгдсэн
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Өөрт илүү таалагдах бүтээлийг олж уншмаар байна уу?
          </p>
        </motion.div>
        <Link
          href="/login"
          className="group hidden items-center gap-2 text-sm font-semibold text-white/60 transition-colors hover:text-white sm:flex"
        >
          Илүү ихийг
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="group/marquee relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-[#050505] to-transparent sm:w-32" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-[#050505] to-transparent sm:w-32" />

          <div className="overflow-hidden">
            <div
              className={`flex w-max gap-4 px-2 sm:gap-5 ${
                reduceMotion ? "" : "landing-catalog-marquee"
              }`}
              style={
                {
                  "--marquee-duration": `${duration}s`,
                } as React.CSSProperties
              }
            >
              {repeatedItems.map((comic, index) => (
                <CatalogCard
                  key={`${comic.id}-${index}`}
                  comic={comic}
                  href={user ? `/series/${comic.id}` : "/login"}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex h-72 max-w-7xl items-center justify-center border-y border-white/10 text-sm text-zinc-600">
          Каталог ачаалж байна
        </div>
      )}
    </section>
  )
}
