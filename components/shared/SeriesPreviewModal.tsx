"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Flame, Star, X, Play, Plus, ThumbsUp, Info } from "lucide-react"
import { Comic } from "@/lib/services/firebase-comic"
import Link from "next/link"

export function SeriesPreviewModal({
  children,
  item
}: {
  children: React.ReactNode,
  item: Comic
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <div onClick={(e) => {
        e.preventDefault()
        setIsOpen(true)
      }}>
        {children}
      </div>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8">
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-300" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />

          <div
            className="relative bg-[#141414] border border-white/10 rounded-t-3xl sm:rounded-2xl w-full max-w-4xl h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 flex flex-col mt-auto sm:mt-0 custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.2) transparent'
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-[#18181b]/60 hover:bg-white/20 text-white transition-colors backdrop-blur-md border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>


            <div className="relative w-full h-[50vh] sm:h-[400px] shrink-0 bg-black">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 mix-blend-screen"
                style={{ backgroundImage: `url(${item.poster})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/80 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#141414]/30 via-transparent to-transparent" />

              <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 flex flex-col justify-end">
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg tracking-tight leading-[1.1] max-w-2xl">
                  {item.title}
                </h2>

                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <Link href={`/series/${item.id}`} className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button size="lg" className="rounded-md bg-white text-black hover:bg-zinc-200 h-10 sm:h-12 px-6 font-bold shadow-lg flex items-center gap-2 group transition-all text-sm sm:text-base">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black group-hover:scale-110 transition-transform" />
                      Унших
                    </Button>
                  </Link>
                  <Button variant="outline" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                    <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>
            </div>


            <div className="flex flex-col md:flex-row gap-8 p-6 sm:p-10 shrink-0">


              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold flex-wrap">
                  <span className="text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)] flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-green-400" />
                    {(Math.random() * (9.9 - 8.5) + 8.5).toFixed(1)} Сэтгэл ханамж
                  </span>
                  <span className="text-white/60hidden sm:inline">•</span>
                  <span className="text-white bg-white/10 px-2 py-0.5 rounded">{item.publishedChapters || 0} Бүлэг</span>
                  <span className="px-2 py-0.5 text-zinc-300 border border-zinc-600 rounded">
                    {item.status}
                  </span>
                  <span className="px-2 py-0.5 bg-red-600/20 text-red-500 border border-red-600/30 rounded font-bold tracking-wider backdrop-blur-sm">
                    +16
                  </span>
                </div>

                <p className="text-zinc-300 text-[13px] sm:text-base leading-relaxed font-normal whitespace-pre-wrap">
                  {item.description || "Одоогоор энэхүү бүтээлд тайлбар ороогүй байна."}
                </p>
              </div>


              <div className="w-full md:w-1/3 flex flex-col gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-zinc-500 mr-2">Төрөл:</span>
                  <span className="text-zinc-300 cursor-pointer group flex flex-wrap gap-1">
                    {item.genres?.map((genre, i) => (
                      <span key={i}>
                        <span className="hover:text-white transition-colors">{genre}</span>
                        {i < item.genres.length - 1 && <span className="text-zinc-600">, </span>}
                      </span>
                    )) || "Бүртгэгдээгүй"}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-500 mr-2">Хандсан:</span>
                  <span className="text-zinc-300">
                    {item.viewCount ? item.viewCount.toLocaleString() : '1,421'} хүн
                  </span>
                </div>

                <div className="mt-2 pt-4 border-t border-white/5">
                  <span className="text-zinc-500 flex items-center gap-1 mb-2 font-medium">
                    <Info className="w-4 h-4" />
                    <span>Санамж:</span>
                  </span>
                  <p className="text-zinc-500 text-xs leading-snug">
                    Та энэхүү цувралыг уншихын тулд нэвтэрсэн байх шаардлагатайг анхаарна уу.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  )
}
