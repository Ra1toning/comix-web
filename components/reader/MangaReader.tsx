"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  List,
  Maximize,
  PanelsTopLeft,
  Rows3,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { saveReadingProgress } from "@/lib/services/firebase-reading"

export type ReadingMode = "ltr" | "vertical"

const DATA_SAVER_KEY = "reader_data_saver"

interface Chapter {
  id: string
  title: string
}

interface MangaReaderProps {
  seriesId: string
  chapterId: string
  chapterNumber?: number
  title: string
  pages: string[]
  chapters: Chapter[]
  userId?: string
  resumePage?: number
}

export function MangaReader({
  seriesId,
  chapterId,
  chapterNumber,
  title,
  pages,
  chapters,
  userId,
  resumePage,
}: MangaReaderProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [readerReady, setReaderReady] = useState(false)
  const [mode, setMode] = useState<ReadingMode>("vertical")
  const [showUI, setShowUI] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [dataSaverEnabled, setDataSaverEnabled] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<number | null>(null)
  const scrollFrameRef = useRef<number | null>(null)
  const wheelLockRef = useRef(false)
  const initialRestorePageRef = useRef<number | null>(null)
  const modeRef = useRef<ReadingMode>("vertical")

  const renderPages = useMemo(() => {
    if (!dataSaverEnabled) return pages
    const connection = (navigator as any).connection
    const slowConnection =
      Boolean(connection?.saveData) ||
      ["slow-2g", "2g", "3g"].includes(connection?.effectiveType || "")
    if (!slowConnection) return pages

    return pages.map((src) => {
      try {
        const url = new URL(src)
        if (url.hostname.includes("images.unsplash.com")) {
          url.searchParams.set("auto", "format")
          url.searchParams.set("fit", "max")
          url.searchParams.set("w", "1080")
          url.searchParams.set("q", "60")
        }
        return url.toString()
      } catch {
        return src
      }
    })
  }, [dataSaverEnabled, pages])

  const totalPages = renderPages.length
  const currentChapterIndex = useMemo(
    () => chapters.findIndex((chapter) => chapter.id === chapterId),
    [chapters, chapterId]
  )

  const scrollToPage = useCallback(
    (page: number) => {
      const target = Math.max(1, Math.min(page, pages.length || 1))
      setCurrentPage((current) => (current === target ? current : target))
      if (mode === "vertical") {
        scrollViewportRef.current
          ?.querySelector(`img[data-page="${target}"]`)
          ?.scrollIntoView({ behavior: "auto", block: "start" })
      }
    },
    [mode, pages.length]
  )

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    const stored = localStorage.getItem(DATA_SAVER_KEY)
    if (stored !== null) setDataSaverEnabled(stored === "1")
  }, [])

  useEffect(() => {
    const savedMode = localStorage.getItem("reader_mode") as ReadingMode
    if (savedMode && savedMode !== modeRef.current) setMode(savedMode)

    const savedPage = Number(localStorage.getItem(`reader_${seriesId}_${chapterId}_page`))
    const requestedPage = !userId && Number.isFinite(savedPage) && savedPage > 0
      ? savedPage
      : resumePage ?? 1
    const target = Math.max(1, Math.min(requestedPage, pages.length || 1))
    const activeMode = savedMode || modeRef.current

    setCurrentPage(target)
    initialRestorePageRef.current = target > 1 ? target : null
    scrollViewportRef.current?.scrollTo({ top: 0, behavior: "auto" })
    setReaderReady(true)

    if (target > 1 && activeMode === "vertical") {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        scrollViewportRef.current
          ?.querySelector(`img[data-page="${target}"]`)
          ?.scrollIntoView({ behavior: "auto", block: "start" })
      }))
    }
    localStorage.setItem(`last_read_chapter_${seriesId}`, chapterId)
  }, [chapterId, pages.length, resumePage, seriesId, userId])

  useEffect(() => {
    localStorage.setItem("reader_mode", mode)
    localStorage.setItem(`reader_${seriesId}_${chapterId}_page`, String(currentPage))
  }, [chapterId, currentPage, mode, seriesId])

  useEffect(() => {
    if (!readerReady || !userId || !seriesId || !chapterId || !pages.length) return
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      saveReadingProgress(userId, {
        comicId: seriesId,
        chapterId,
        chapterNumber: chapterNumber ?? 0,
        page: currentPage,
        totalPages,
      }).catch((error) => console.error("Failed to save progress:", error))
    }, 700)
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    }
  }, [chapterId, chapterNumber, currentPage, pages.length, readerReady, seriesId, totalPages, userId])

  const goToNextChapter = useCallback(() => {
    if (currentChapterIndex > 0) {
      router.push(`/series/${seriesId}/read?chapter=${chapters[currentChapterIndex - 1].id}`)
    }
  }, [chapters, currentChapterIndex, router, seriesId])

  const goToPrevChapter = useCallback(() => {
    if (currentChapterIndex < chapters.length - 1) {
      router.push(`/series/${seriesId}/read?chapter=${chapters[currentChapterIndex + 1].id}`)
    }
  }, [chapters, currentChapterIndex, router, seriesId])

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) scrollToPage(currentPage + 1)
    else goToNextChapter()
  }, [currentPage, goToNextChapter, scrollToPage, totalPages])

  const prevPage = useCallback(() => {
    if (currentPage > 1) scrollToPage(currentPage - 1)
    else goToPrevChapter()
  }, [currentPage, goToPrevChapter, scrollToPage])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (mode === "vertical") return
      if (event.key === "ArrowLeft") prevPage()
      if (event.key === "ArrowRight") nextPage()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [mode, nextPage, prevPage])

  useEffect(() => {
    if (mode !== "vertical") return
    const viewport = scrollViewportRef.current
    if (!viewport) return

    const updateVisiblePage = () => {
      scrollFrameRef.current = null
      const viewportRect = viewport.getBoundingClientRect()
      const center = viewportRect.top + viewportRect.height / 2
      let closestPage = currentPage
      let closestDistance = Number.POSITIVE_INFINITY

      viewport.querySelectorAll<HTMLImageElement>(".reader-page").forEach((element) => {
        const rect = element.getBoundingClientRect()
        const distance = center < rect.top
          ? rect.top - center
          : center > rect.bottom
            ? center - rect.bottom
            : 0
        if (distance < closestDistance) {
          closestDistance = distance
          closestPage = Number(element.dataset.page) || 1
        }
      })
      setCurrentPage((current) => current === closestPage ? current : closestPage)
    }

    const handleScroll = () => {
      if (scrollFrameRef.current !== null) return
      scrollFrameRef.current = requestAnimationFrame(updateVisiblePage)
    }
    viewport.addEventListener("scroll", handleScroll, { passive: true })
    updateVisiblePage()
    return () => {
      viewport.removeEventListener("scroll", handleScroll)
      if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current)
    }
  }, [mode, renderPages])

  const handleReaderWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (mode === "vertical" || Math.abs(event.deltaY) < 20 || wheelLockRef.current) return
    event.preventDefault()
    wheelLockRef.current = true
    if (event.deltaY > 0) nextPage()
    else prevPage()
    window.setTimeout(() => { wheelLockRef.current = false }, 140)
  }, [mode, nextPage, prevPage])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().catch(console.error)
    else document.exitFullscreen()
  }

  const chapterTitle = chapters.find((chapter) => chapter.id === chapterId)?.title || `Бүлэг ${chapterNumber || ""}`
  const progressValue = totalPages > 1 ? ((currentPage - 1) / (totalPages - 1)) * 100 : 100
  const atStart = currentChapterIndex === chapters.length - 1 && currentPage === 1
  const atEnd = currentChapterIndex === 0 && currentPage === totalPages

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] flex size-full items-center justify-center overflow-hidden bg-[#030303] font-sans">
      <header className={`absolute inset-x-0 top-0 z-50 border-b border-white/10 bg-black/80 px-3 py-3 backdrop-blur-xl transition-transform duration-300 sm:px-5 ${showUI ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={`/series/${seriesId}`}>
              <Button variant="ghost" size="icon" className="size-10 rounded-none border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white" title="Буцах">
                <ArrowLeft className="size-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-medium text-white sm:text-base">{title}</h1>
              <p className="mt-0.5 truncate text-xs text-cyan-300">{chapterTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden border border-white/10 px-3 py-2 text-xs text-zinc-400 sm:block">{currentPage} / {totalPages}</span>
            <Button variant="ghost" size="icon" className="hidden size-10 rounded-none border border-white/10 text-zinc-300 hover:bg-white/10 sm:flex" onClick={toggleFullscreen} title="Бүтэн дэлгэц">
              <Maximize className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-10 rounded-none border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-cyan-300" onClick={(event) => { event.stopPropagation(); setShowMenu((value) => !value) }} title="Бүлгүүд">
              {showMenu ? <X className="size-5" /> : <List className="size-5" />}
            </Button>
          </div>
        </div>
      </header>

      {showMenu && (
        <aside className="absolute inset-y-0 right-0 z-[60] flex w-[min(88vw,340px)] flex-col border-l border-white/10 bg-[#080808]/98 pt-17 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="text-xs font-semibold uppercase text-zinc-500">Бүх бүлэг</p>
            <p className="mt-1 text-xs text-zinc-700">{chapters.length} бүлэг</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {chapters.map((chapter) => (
              <Link key={chapter.id} href={`/series/${seriesId}/read?chapter=${chapter.id}`} onClick={() => setShowMenu(false)} className={`block border px-4 py-3 text-sm transition-colors ${chapter.id === chapterId ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200" : "border-transparent text-zinc-400 hover:bg-white/5 hover:text-white"}`}>
                {chapter.title}
              </Link>
            ))}
          </div>
        </aside>
      )}

      <div ref={scrollViewportRef} className={`size-full ${mode === "vertical" ? "overflow-y-auto overflow-x-hidden overscroll-contain pb-32" : "flex items-center justify-center"}`} onClick={() => { setShowUI((value) => !value); setShowMenu(false) }} onWheel={handleReaderWheel}>
        {mode === "vertical" ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
            {currentChapterIndex < chapters.length - 1 && (
              <button onClick={(event) => { event.stopPropagation(); goToPrevChapter() }} className="mt-16 flex w-full items-center justify-center gap-2 py-10 text-xs font-semibold uppercase text-zinc-600 transition-colors hover:text-white">
                <ChevronLeft className="size-4" /> Өмнөх бүлэг
              </button>
            )}
            {renderPages.map((src, index) => (
              <img
                key={index}
                data-page={index + 1}
                src={src}
                alt={`Хуудас ${index + 1}`}
                className="reader-page w-full select-none object-contain"
                loading="lazy"
                draggable={false}
                onLoad={() => {
                  if (mode === "vertical" && initialRestorePageRef.current === index + 1) {
                    scrollViewportRef.current?.querySelector(`img[data-page="${index + 1}"]`)?.scrollIntoView({ behavior: "auto", block: "start" })
                    initialRestorePageRef.current = null
                  }
                }}
                onContextMenu={(event) => event.preventDefault()}
                style={{ userSelect: "none", WebkitTouchCallout: "none" } as React.CSSProperties}
              />
            ))}
            {currentChapterIndex > 0 ? (
              <button onClick={(event) => { event.stopPropagation(); goToNextChapter() }} className="flex w-full items-center justify-center gap-2 py-24 text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-100">
                Дараагийн бүлэг <ChevronRight className="size-4" />
              </button>
            ) : (
              <div className="w-full py-24 text-center text-sm text-zinc-600">Шинэ бүлэг хараахан гараагүй байна.</div>
            )}
          </div>
        ) : (
          <img src={renderPages[currentPage - 1]} alt={`Хуудас ${currentPage}`} className="max-h-screen max-w-full select-none object-contain" draggable={false} onContextMenu={(event) => event.preventDefault()} style={{ userSelect: "none", WebkitTouchCallout: "none" } as React.CSSProperties} />
        )}
      </div>

      {mode !== "vertical" && (
        <>
          <button className="absolute inset-y-1/4 left-0 z-40 w-[38%] cursor-w-resize" onClick={(event) => { event.stopPropagation(); prevPage() }} aria-label="Өмнөх хуудас" />
          <button className="absolute inset-y-1/4 right-0 z-40 w-[38%] cursor-e-resize" onClick={(event) => { event.stopPropagation(); nextPage() }} aria-label="Дараагийн хуудас" />
        </>
      )}

      <footer className={`absolute inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/85 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-transform duration-300 sm:px-5 ${showUI ? "translate-y-0" : "translate-y-full"}`}>
        <div className="mx-auto max-w-3xl">
          <div className="mb-3 flex items-center gap-3">
            <span className="w-7 text-right text-xs text-zinc-500">{currentPage}</span>
            <input
              type="range"
              min={1}
              max={Math.max(totalPages, 1)}
              value={currentPage}
              onChange={(event) => scrollToPage(Number(event.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:bg-cyan-200"
              style={{ background: `linear-gradient(to right, #a5f3fc ${progressValue}%, rgba(255,255,255,.16) ${progressValue}%)` }}
            />
            <span className="w-7 text-xs text-zinc-500">{totalPages}</span>
          </div>
          <div className="grid grid-cols-[44px_1fr_44px] items-center gap-3">
            <Button variant="ghost" size="icon" className="size-11 rounded-none border border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/10" onClick={(event) => { event.stopPropagation(); prevPage() }} disabled={atStart} title="Өмнөх">
              <ChevronLeft className="size-5" />
            </Button>
            <div className="mx-auto grid grid-cols-2 border border-white/10 bg-[#090909] p-1">
              <button onClick={(event) => { event.stopPropagation(); setMode("vertical") }} className={`flex h-9 items-center gap-2 px-4 text-xs transition-colors ${mode === "vertical" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}>
                <Rows3 className="size-4" /> Босоо
              </button>
              <button onClick={(event) => { event.stopPropagation(); setMode("ltr") }} className={`flex h-9 items-center gap-2 px-4 text-xs transition-colors ${mode === "ltr" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}>
                <PanelsTopLeft className="size-4" /> Хуудас
              </button>
            </div>
            <Button variant="ghost" size="icon" className="size-11 rounded-none border border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/10" onClick={(event) => { event.stopPropagation(); nextPage() }} disabled={atEnd} title="Дараах">
              <ChevronRight className="size-5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
