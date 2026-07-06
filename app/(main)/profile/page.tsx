"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Bookmark, Check, History } from "lucide-react"

import { ProfileSidebar, UserProfileProps } from "@/components/shared/ProfileSidebar"
import { ProfileLibraryCard, ProfileLibraryCardProps } from "@/components/shared/ProfileLibraryCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { Reveal } from "@/components/shared/Reveal"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/useAuth"
import { getUserProfile } from "@/lib/services/firebase-user"
import { getUserLibrary } from "@/lib/services/firebase-reading"

type Tab = "continue" | "saved" | "completed"
const TABS: { id: Tab; label: string; icon: typeof History }[] = [
  { id: "continue", label: "Уншиж буй", icon: History },
  { id: "saved", label: "Хадгалсан", icon: Bookmark },
  { id: "completed", label: "Дуусгасан", icon: Check },
]

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<Tab>("continue")
  const [items, setItems] = useState<ProfileLibraryCardProps[]>([])
  const [loadingLibrary, setLoadingLibrary] = useState(true)
  const [profile, setProfile] = useState<UserProfileProps>({
    name: "Уншигч",
    avatar: "/profile.jpg",
    isOnline: true,
    subscription: { type: "FREE" },
  })

  useEffect(() => {
    if (!user) {
      setLoadingLibrary(false)
      return
    }

    getUserProfile(user.uid).then((data) => {
      const sub = data?.subscription
      const expiresAt = sub?.expiresAt?.toDate?.() as Date | undefined
      const active = sub?.status === "active" && expiresAt && expiresAt.getTime() > Date.now()
      setProfile({
        name: data?.displayName || user.displayName || `Уншигч ${user.uid.slice(0, 4)}`,
        avatar: data?.photoURL || user.photoURL || "/profile.jpg",
        isOnline: true,
        subscription: active
          ? { type: String(sub.plan || "PLUS").toUpperCase(), daysLeft: Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) }
          : { type: "FREE" },
        lumioId: typeof data?.lumioId === "number" ? data.lumioId : null,
      })
    }).catch(console.error)

    getUserLibrary(user.uid)
      .then((library) => setItems(library.map(({ entry, comic }) => ({
        id: comic.id,
        title: comic.title,
        image: comic.poster,
        status: entry.status === "continue" ? "Уншиж буй" : entry.status === "completed" ? "Дуусгасан" : "Хадгалсан",
        progress: entry.progressPercent,
        currentChapter: entry.currentChapterNumber || comic.publishedChapters,
        totalChapters: comic.totalChapters || comic.publishedChapters,
        chapterId: entry.chapterId,
      }))))
      .catch(console.error)
      .finally(() => setLoadingLibrary(false))
  }, [user])

  if (loading || loadingLibrary) {
    return (
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 sm:px-6 lg:grid-cols-[18rem_1fr] lg:px-12">
        <Skeleton className="h-64 rounded-none" />
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="aspect-2/3 rounded-none" />)}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-3xl text-white">Сангаа үзэхийн тулд нэвтэрнэ үү.</h1>
        <Link href="/login" className="mt-8 inline-block border border-white/15 px-5 py-3 text-sm text-white">Нэвтрэх</Link>
      </div>
    )
  }

  const status = tab === "continue" ? "Уншиж буй" : tab === "completed" ? "Дуусгасан" : "Хадгалсан"
  const visible = items.filter((item) => item.status === status)

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
      <Reveal>
        <header className="mb-10 border-b border-white/10 pb-8 sm:mb-14">
          <p className="mb-4 text-xs font-semibold uppercase text-pink-400">Хувийн орон зай</p>
          <h1 className="text-4xl font-semibold text-white sm:text-6xl">Миний сан</h1>
        </header>
      </Reveal>

      <div className="grid gap-12 lg:grid-cols-[18rem_1fr]">
        <ProfileSidebar profile={profile} />
        <div className="min-w-0">
          <div className="mb-8 flex overflow-x-auto border-b border-white/10 scrollbar-hide">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={`relative flex shrink-0 items-center gap-2 px-4 py-4 text-sm transition-colors ${tab === id ? "text-white" : "text-zinc-600 hover:text-zinc-300"}`}>
                <Icon className="size-4" />{label}
                {tab === id && <motion.span layoutId="library-tab" className="absolute inset-x-0 bottom-0 h-px bg-pink-400" />}
              </button>
            ))}
            <span className="ml-auto self-center pl-6 text-xs text-zinc-600">{visible.length} бүтээл</span>
          </div>

          {visible.length ? (
            <motion.div key={tab} initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((item) => (
                <motion.div key={item.id} variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.45 }}>
                  <ProfileLibraryCard item={item} activeTab={tab} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyState title="Энд одоогоор хоосон байна" description="Каталогоос бүтээл сонгож өөрийн сангаа бүрдүүлээрэй." />
          )}
        </div>
      </div>
    </div>
  )
}
