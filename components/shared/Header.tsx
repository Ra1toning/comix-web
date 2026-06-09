"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  Bookmark,
  Flame,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  Settings,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { useAuthStore } from "@/lib/authStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NAV_ITEMS = [
  { href: "/home", icon: LayoutGrid, label: "Нүүр" },
  { href: "/series", icon: Search, label: "Каталог" },
  { href: "/profile", icon: Bookmark, label: "Миний сан" },
]

export function Header() {
  const pathname = usePathname()
  const { user, loading, logout } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => setMobileMenuOpen(false), [pathname])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-500 ${
        scrolled
          ? "border-white/10 bg-black/80 backdrop-blur-xl"
          : "border-transparent bg-linear-to-b from-black/85 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-12">
        <Link href="/home" className="group flex items-center gap-3">
          <span className="flex size-9 items-center justify-center border border-white/15 bg-white/[0.04] transition-colors group-hover:border-pink-400/60">
            <Flame className="size-4.5 text-pink-400" />
          </span>
          <span className="text-lg font-semibold text-white">Lumio</span>
        </Link>

        <nav className="hidden items-center gap-1 border border-white/10 bg-black/35 p-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex h-10 items-center gap-2 px-4 text-sm transition-colors ${
                  active ? "text-white" : "text-zinc-500 hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="main-nav-active"
                    className="absolute inset-0 bg-white/10"
                    transition={{ type: "spring", stiffness: 360, damping: 32 }}
                  />
                )}
                <Icon className={`relative z-10 size-4 ${active ? "text-pink-400" : ""}`} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="hidden border border-pink-400/30 bg-pink-400/10 px-3 py-2 text-xs font-semibold text-pink-300 transition-colors hover:bg-pink-400/15 sm:block"
          >
            PREMIUM
          </Link>

          {!loading && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden size-10 rounded-none border border-white/10 hover:bg-white/10 sm:flex">
                  <UserAvatar
                    src={user.photoURL}
                    alt={user.name || "Avatar"}
                    className="size-7 object-cover"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-none border-white/10 bg-[#090909] p-2 text-zinc-300">
                <DropdownMenuLabel>
                  <p className="truncate text-sm text-white">{user.name || "Хэрэглэгч"}</p>
                  <p className="mt-1 truncate text-xs font-normal text-zinc-500">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild className="rounded-none focus:bg-white/10 focus:text-white">
                  <Link href="/profile"><Bookmark className="mr-2 size-4" />Миний сан</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-none focus:bg-white/10 focus:text-white">
                  <Link href="/settings"><Settings className="mr-2 size-4" />Тохиргоо</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={logout} className="rounded-none text-red-400 focus:bg-red-500/10 focus:text-red-300">
                  <LogOut className="mr-2 size-4" />Гарах
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="size-10 rounded-none border border-white/10 text-zinc-300 md:hidden"
            aria-label="Цэс"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ height: mobileMenuOpen ? "auto" : 0, opacity: mobileMenuOpen ? 1 : 0 }}
        className="overflow-hidden border-t border-white/10 bg-black/95 md:hidden"
      >
        <nav className="space-y-1 px-4 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 border px-4 py-3 text-sm ${
                  active ? "border-pink-400/30 bg-pink-400/10 text-white" : "border-transparent text-zinc-400"
                }`}
              >
                <Icon className="size-4" />{item.label}
              </Link>
            )
          })}
          {user && (
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
              <Link href="/settings" className="flex items-center justify-center gap-2 border border-white/10 px-3 py-3 text-sm text-zinc-300">
                <Settings className="size-4" />Тохиргоо
              </Link>
              <button onClick={logout} className="flex items-center justify-center gap-2 border border-red-500/20 bg-red-500/5 px-3 py-3 text-sm text-red-400">
                <LogOut className="size-4" />Гарах
              </button>
            </div>
          )}
        </nav>
      </motion.div>
    </header>
  )
}
