"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Flame } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { UserAvatar } from "@/components/shared/UserAvatar"

export interface UserProfileProps {
  name: string
  avatar: string
  isOnline: boolean
  subscription: { type: string; daysLeft?: number }
  lumioId?: number | null
}

export function ProfileSidebar({ profile }: { profile: UserProfileProps }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <div className="sticky top-24 border-t border-white/15 pt-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative size-20 shrink-0 overflow-hidden border border-white/15 bg-zinc-900">
            {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
            <UserAvatar
              src={profile.avatar}
              alt={profile.name}
              onLoad={() => setLoaded(true)}
              className={`size-full object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
            />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-medium text-white">{profile.name}</h2>
            {typeof profile.lumioId === "number" && (
              <p className="mt-1 font-mono text-xs font-semibold tracking-wide text-pink-300">#{profile.lumioId}</p>
            )}
            <p className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
              <span className="size-1.5 bg-emerald-400" /> Идэвхтэй
            </p>
          </div>
        </div>

        <div className="border-y border-white/10 py-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase text-zinc-600">Гишүүнчлэл</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-pink-300">
              {profile.subscription.type === "PREMIUM" && <Flame className="size-3" />}
              {profile.subscription.type}
            </span>
          </div>
          {profile.subscription.daysLeft !== undefined && (
            <p className="mt-3 text-xs leading-5 text-zinc-500">{profile.subscription.daysLeft} хоногийн эрх үлдсэн.</p>
          )}
        </div>

        <Link href="/settings?tab=account#account-section" className="mt-5 flex items-center justify-between text-sm text-zinc-400 transition-colors hover:text-white">
          Профайл засах <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </aside>
  )
}
