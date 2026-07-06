"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Bell, CreditCard, LogOut, Monitor, Moon, Shield, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/shared/Reveal"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { useAuthStore } from "@/lib/authStore"
import { changeUserPassword } from "@/lib/services/firebase-auth"
import { authErrorMessage } from "@/lib/auth-errors"
import { getUserProfile, updateUserProfile, updateUserSettings } from "@/lib/services/firebase-user"

type TabId = "account" | "preferences" | "notifications" | "billing"
const tabs = [
  { id: "account" as const, label: "Бүртгэл", icon: Shield },
  { id: "preferences" as const, label: "Уншлагын тохиргоо", icon: Monitor },
  { id: "notifications" as const, label: "Мэдэгдэл", icon: Bell },
  { id: "billing" as const, label: "Төлбөр", icon: CreditCard },
]

const fieldClass = "box-border block w-full min-w-0 max-w-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-pink-400/40"

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout } = useAuthStore()
  const [tab, setTab] = useState<TabId>("account")
  const [displayName, setDisplayName] = useState("")
  const [photoPreview, setPhotoPreview] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [lumioId, setLumioId] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const [autoNext, setAutoNext] = useState(true)
  const ready = useRef(false)

  useEffect(() => {
    const requested = searchParams.get("tab") as TabId | null
    if (requested && tabs.some((item) => item.id === requested)) setTab(requested)
  }, [searchParams])

  useEffect(() => {
    if (!user) return
    getUserProfile(user.uid).then((profile) => {
      setDisplayName(profile?.displayName || user.name || "")
      setPhotoPreview(profile?.photoURL || user.photoURL || "/profile.jpg")
      const id = profile?.lumioId ?? user.lumioId
      setLumioId(typeof id === "number" ? `#${id}` : "")
      setAutoNext(typeof profile?.autoNextChapter === "boolean" ? profile.autoNextChapter : true)
      ready.current = true
    }).catch(console.error)
  }, [user])

  useEffect(() => {
    if (!ready.current || !user) return
    updateUserSettings(user.uid, { readerTheme: "dark", autoNextChapter: autoNext, dataSaverMode: false }).catch(console.error)
  }, [autoNext, user])

  const handlePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const canChangePassword = user?.provider !== "google.com"

  const saveAccount = async () => {
    if (!user) return
    if (newPassword) {
      if (newPassword.length < 6) {
        setMessage("Шинэ нууц үг 6-с доошгүй тэмдэгттэй байх ёстой.")
        return
      }
      if (newPassword !== confirmPassword) {
        setMessage("Шинэ нууц үг таарахгүй байна.")
        return
      }
      if (!currentPassword) {
        setMessage("Нууц үг солихын тулд одоогийн нууц үгээ оруулна уу.")
        return
      }
    }
    setSaving(true)
    setMessage("")
    try {
      await updateUserProfile(user.uid, displayName, photoFile)
      if (newPassword) await changeUserPassword(currentPassword, newPassword)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPhotoFile(null)
      setMessage("Өөрчлөлтийг хадгаллаа.")
    } catch (error) {
      console.error(error)
      setMessage(authErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const signOut = async () => {
    await logout()
    router.push("/")
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
      <Reveal>
        <header className="mb-10 border-b border-white/10 pb-8">
          <p className="mb-4 text-xs font-semibold uppercase text-pink-400">Хувийн орон зай</p>
          <h1 className="text-4xl font-semibold text-white sm:text-6xl">Тохиргоо</h1>
        </header>
      </Reveal>

      <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
        <aside>
          <nav className="flex gap-1 overflow-x-auto border-b border-white/10 pb-3 scrollbar-hide lg:sticky lg:top-24 lg:flex-col lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-3 border px-4 py-3 text-left text-sm transition-colors ${tab === id ? "border-pink-400/30 bg-pink-400/10 text-white" : "border-transparent text-zinc-500 hover:text-white"}`}>
                <Icon className="size-4" />{label}
              </button>
            ))}
            <button onClick={signOut} className="mt-0 flex shrink-0 items-center gap-3 border border-red-500/20 px-4 py-3 text-left text-sm text-red-400 lg:mt-5">
              <LogOut className="size-4" />Гарах
            </button>
          </nav>
        </aside>

        <motion.section key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="min-w-0 max-w-full overflow-hidden">
          {tab === "account" && (
            <div className="max-w-3xl space-y-8">
              <div>
                <h2 className="text-2xl font-medium text-white">Бүртгэлийн мэдээлэл</h2>
                <p className="mt-2 text-sm text-zinc-500">Нэр, зураг болон нууц үгээ удирдана.</p>
              </div>

              <div className="flex flex-col gap-5 border-y border-white/10 py-6 sm:flex-row sm:items-center">
                <div className="relative size-20 overflow-hidden border border-white/15 bg-zinc-900">
                  <UserAvatar src={photoPreview} alt="Avatar" className="size-full object-cover" />
                  <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/65 opacity-0 transition-opacity hover:opacity-100">
                    <Upload className="size-5" /><input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                  </label>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg text-white">{displayName || "Хэрэглэгч"}</p>
                  <p className="truncate text-sm text-zinc-500">{user?.email}</p>
                </div>
                <div className="border border-pink-400/25 bg-pink-400/[0.06] px-4 py-3">
                  <p className="text-[10px] uppercase text-zinc-500">Lumio ID</p>
                  <p className="mt-1 font-mono text-base font-semibold tracking-wide text-pink-200">{lumioId || "—"}</p>
                </div>
              </div>

              <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                <label className="min-w-0 space-y-2 text-xs uppercase text-zinc-600">Дэлгэцийн нэр<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={fieldClass} /></label>
                <label className="min-w-0 space-y-2 text-xs uppercase text-zinc-600">Имэйл<input value={user?.email || ""} readOnly className={`${fieldClass} text-zinc-500`} /></label>
              </div>

              {canChangePassword ? (
                <div className="space-y-5 border-t border-white/10 pt-6">
                  <div>
                    <h3 className="text-lg font-medium text-white">Нууц үг солих</h3>
                    <p className="mt-1 text-xs text-zinc-600">Аюулгүй байдлын үүднээс одоогийн нууц үгээ оруулна.</p>
                  </div>
                  <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                    <label className="min-w-0 space-y-2 text-xs uppercase text-zinc-600 sm:col-span-2">Одоогийн нууц үг<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={`${fieldClass} sm:max-w-[calc(50%-0.625rem)]`} placeholder="••••••••" autoComplete="current-password" /></label>
                    <label className="min-w-0 space-y-2 text-xs uppercase text-zinc-600">Шинэ нууц үг<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={fieldClass} placeholder="••••••••" autoComplete="new-password" /></label>
                    <label className="min-w-0 space-y-2 text-xs uppercase text-zinc-600">Шинэ нууц үг баталгаажуулах<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={fieldClass} placeholder="••••••••" autoComplete="new-password" /></label>
                  </div>
                </div>
              ) : (
                <p className="border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-zinc-500">
                  Та Google бүртгэлээрээ нэвтэрдэг тул нууц үг энд солигдохгүй — Google бүртгэлийнхээ тохиргоог ашиглаарай.
                </p>
              )}
              {message && <p className="text-sm text-pink-300">{message}</p>}
              <Button onClick={saveAccount} disabled={saving} className="rounded-none bg-white px-6 text-black hover:bg-zinc-200">{saving ? "Хадгалж байна..." : "Хадгалах"}</Button>
            </div>
          )}

          {tab === "preferences" && (
            <div className="max-w-3xl space-y-8">
              <div><h2 className="text-2xl font-medium text-white">Уншлагын тохиргоо</h2><p className="mt-2 text-sm text-zinc-500">Унших үеийн үндсэн үйлдлүүдээ тохируулна.</p></div>
              <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10">
                <div className="bg-[#080808] p-5"><Moon className="mb-4 size-6 text-pink-300" /><p className="text-sm text-white">Dark mode</p><p className="mt-1 text-xs text-zinc-600">Идэвхтэй</p></div>
                <div className="bg-[#080808] p-5 opacity-50"><Monitor className="mb-4 size-6" /><p className="text-sm text-white">System theme</p><p className="mt-1 text-xs text-zinc-600">Тун удахгүй</p></div>
              </div>
              <div className="flex items-center justify-between gap-5 border-y border-white/10 py-5">
                <div><p className="text-sm text-white">Дараагийн бүлэгт автоматаар шилжих</p><p className="mt-1 text-xs text-zinc-600">Бүлэг дуусмагц дараагийн бүлгийг нээнэ.</p></div>
                <button onClick={() => setAutoNext((value) => !value)} className={`relative h-6 w-11 shrink-0 border transition-colors ${autoNext ? "border-pink-400 bg-pink-400" : "border-white/15 bg-zinc-900"}`}><span className={`absolute top-1 size-3.5 bg-white transition-all ${autoNext ? "left-6" : "left-1"}`} /></button>
              </div>
            </div>
          )}

          {(tab === "notifications" || tab === "billing") && (
            <div className="flex min-h-72 max-w-3xl flex-col items-center justify-center border border-white/10 text-center">
              {tab === "notifications" ? <Bell className="mb-4 size-9 text-zinc-700" /> : <CreditCard className="mb-4 size-9 text-zinc-700" />}
              <h2 className="text-xl text-white">Тун удахгүй</h2>
              <p className="mt-2 text-sm text-zinc-600">Энэ хэсэг хөгжүүлэгдэж байна.</p>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  )
}
