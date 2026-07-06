"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Flame, Play } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { CatalogMarquee } from "@/components/landing/CatalogMarquee"
import { ImmersiveJoinSection } from "@/components/landing/ImmersiveJoinSection"
import { ReadingWaterfall } from "@/components/landing/ReadingWaterfall"
import { useAuthStore } from "@/lib/authStore"
import { Comic, getPublishedComics } from "@/lib/services/firebase-comic"

export default function LandingPage() {
  const [comics, setComics] = useState<Comic[]>([])
  const { user, loading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    getPublishedComics()
      .then(setComics)
      .catch(error => console.error("Failed to load landing catalog:", error))
  }, [])

  useEffect(() => {
    if (!loading && user) router.replace("/home")
  }, [loading, user, router])

  if (!loading && user) return null

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] text-white selection:bg-pink-400/25">
      <nav className="absolute inset-x-0 top-0 z-50 border-b border-white/10 bg-black/10 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-4 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 sm:size-9">
              <Flame className="h-4 w-4 text-pink-300" />
            </span>
            <span className="text-base font-semibold sm:text-lg">Lumio</span>
          </Link>
          <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-2">
            <Link href="/login">
              <Button variant="ghost" className="h-9 px-2 text-xs text-white/70 hover:text-white sm:h-10 sm:px-4 sm:text-sm">
                Нэвтрэх
              </Button>
            </Link>
            <Link href="/register">
              <Button className="h-9 px-3 text-xs text-black hover:bg-zinc-200 sm:h-10 sm:px-4 sm:text-sm">
                Бүртгүүлэх
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative flex min-h-[56dvh] items-end overflow-hidden pb-8 pt-24 sm:min-h-[60dvh] sm:pb-10 sm:pt-28">
        <Image
          src="/background1.jpg"
          alt="Lumio manga collection"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-linear-to-r from-[#050505] via-[#050505]/80 to-[#050505]/15" />
        <div className="absolute inset-0 bg-linear-to-t from-[#050505] via-transparent to-black/40" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0 max-w-2xl"
          >
            <h1 className="text-5xl font-semibold leading-none sm:text-6xl md:text-7xl lg:text-8xl">
              Lumio
            </h1>
            <p className="mt-4 max-w-full break-words text-sm leading-6 text-white/65 sm:max-w-xl sm:text-lg sm:leading-7">
              Дуртай цувралдаа зарцуулах цагаа илүү тухтай өнгөрөөгөөрэй. Хүссэн цувралаа хаанаас хэзээ ч өөрийн хэмнэлээр унших танд зориулсан орчинг бид бүрдүүлэв.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-12 bg-white px-7 text-black hover:bg-zinc-200"
                >
                  <Play className="mr-2 h-4 w-4 fill-current" />
                  Уншиж эхлэх
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/20 bg-black/20 px-7 text-white backdrop-blur-md hover:bg-white/10"
                >
                    Бүтээлүүд
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <CatalogMarquee comics={comics} />
      <ReadingWaterfall comics={comics} />
      <ImmersiveJoinSection comics={comics} />

      <footer className="border-t border-white/10 px-4 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-white">
            <Flame className="h-4 w-4 text-pink-300" />
            <span className="font-semibold">Lumio</span>
          </div>
          <p>© {new Date().getFullYear()} Lumio. Бүх эрх хуулиар хамгаалагдсан.</p>
          <div className="flex gap-5">
            <Link href="/login" className="transition-colors hover:text-white">
              Нэвтрэх
            </Link>
            <Link href="/register" className="transition-colors hover:text-white">
              Бүртгүүлэх
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
