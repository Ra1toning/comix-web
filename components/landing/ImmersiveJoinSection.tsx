"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Bookmark, Cloud, Library, Play } from "lucide-react"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion"
import { Button } from "@/components/ui/button"
import { Comic } from "@/lib/services/firebase-comic"
import { normalizeComicStatus } from "@/lib/comic-taxonomy"

export function ImmersiveJoinSection({ comics }: { comics: Comic[] }) {
  const reduceMotion = useReducedMotion()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const smoothX = useSpring(pointerX, { stiffness: 55, damping: 18 })
  const smoothY = useSpring(pointerY, { stiffness: 55, damping: 18 })
  const leftX = useTransform(smoothX, [-0.5, 0.5], reduceMotion ? [0, 0] : [-18, 18])
  const rightX = useTransform(smoothX, [-0.5, 0.5], reduceMotion ? [0, 0] : [18, -18])
  const figuresY = useTransform(smoothY, [-0.5, 0.5], reduceMotion ? [0, 0] : [-10, 10])

  const stats = useMemo(() => {
    const chapters = comics.reduce(
      (sum, comic) => sum + (comic.publishedChapters || 0),
      0
    )
    return {
      titles: comics.length,
      chapters,
      ongoing: comics.filter(comic => normalizeComicStatus(comic.status) === "Идэвхтэй").length,
    }
  }, [comics])

  return (
    <section
      className="relative min-h-[760px] overflow-hidden border-t border-white/5 bg-[#080808] px-4 py-24 sm:px-8 lg:flex lg:min-h-[820px] lg:items-center lg:py-32"
      onPointerMove={event => {
        const rect = event.currentTarget.getBoundingClientRect()
        pointerX.set((event.clientX - rect.left) / rect.width - 0.5)
        pointerY.set((event.clientY - rect.top) / rect.height - 0.5)
      }}
      onPointerLeave={() => {
        pointerX.set(0)
        pointerY.set(0)
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.65) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.65) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/15" />

      <motion.div
        style={{ x: leftX, y: figuresY }}
        className="pointer-events-none absolute bottom-0 left-[-16%] z-0 h-[58%] w-[68%] sm:left-[-10%] sm:h-[72%] sm:w-[52%] lg:left-[-3%] lg:h-[94%] lg:w-[39%]"
      >
        <Image
          src="/landing/left.png"
          alt=""
          fill
          sizes="(max-width: 768px) 68vw, 39vw"
          className="object-contain object-left-bottom opacity-75"
        />
      </motion.div>
      <motion.div
        style={{ x: rightX, y: figuresY }}
        className="pointer-events-none absolute bottom-0 right-[-18%] z-0 h-[60%] w-[70%] sm:right-[-11%] sm:h-[74%] sm:w-[54%] lg:right-[-3%] lg:h-[96%] lg:w-[40%]"
      >
        <Image
          src="/landing/right.png"
          alt=""
          fill
          sizes="(max-width: 768px) 70vw, 40vw"
          className="object-contain object-right-bottom opacity-75"
        />
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 z-[1] h-56 bg-linear-to-t from-[#080808] to-transparent" />
      <div className="absolute inset-y-0 left-0 z-[1] hidden w-[34%] bg-linear-to-r from-[#080808]/40 to-transparent lg:block" />
      <div className="absolute inset-y-0 right-0 z-[1] hidden w-[34%] bg-linear-to-l from-[#080808]/40 to-transparent lg:block" />

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >

          <h2 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
            Дараагийн түвшинд хүрэхэд бэлэн үү?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
            Бүртгэлээ үүсгээд дээрх боломжуудын хамт дуртай бүтээлээ илүү хялбар аргаар унших боломжийг мэдрээрэй.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/15 bg-white/15 text-left backdrop-blur-xl"
        >
          <div className="bg-black/55 p-4 sm:p-5">
            <p className="text-2xl font-semibold text-white">{stats.titles}</p>
            <p className="mt-1 text-[11px] text-zinc-400">бүтээл</p>
          </div>
          <div className="bg-black/55 p-4 sm:p-5">
            <p className="text-2xl font-semibold text-white">{stats.ongoing}</p>
            <p className="mt-1 text-[11px] text-zinc-400">үргэлжилж буй</p>
          </div>
          <div className="bg-black/55 p-4 sm:p-5">
            <p className="text-2xl font-semibold text-white">{stats.chapters}</p>
            <p className="mt-1 text-[11px] text-zinc-400">нийт бүлэг</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-5 grid max-w-2xl gap-2 text-left sm:grid-cols-3"
        >

        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="mt-9 flex flex-wrap justify-center gap-3"
        >
          <Link href="/register">
            <Button
              size="lg"
              className="h-12 bg-white px-8 text-black hover:bg-zinc-200"
            >
              <Library className="mr-2 h-4 w-4" />
              Үнэгүй эхлэх
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-white/20 bg-black/35 px-8 text-white backdrop-blur-xl hover:bg-white/10"
            >
              Нэвтрэх
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
