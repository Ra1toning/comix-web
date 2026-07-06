"use client"

import { useCallback, useEffect, useState } from "react"
import { Download, Plus, Tag, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import {
  AdminPageHeader,
  AdminPageTransition,
  AdminPanel,
  AdminPanelHeader,
} from "@/components/admin/AdminUI"
import { addGenre, deleteGenre, ensureDefaultGenres, Genre, getGenres, importGenresFromComics } from "@/lib/services/firebase-genres"

export default function AdminGenresPage() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Genre | null>(null)

  const load = useCallback(async () => setGenres(await getGenres()), [])
  useEffect(() => {
    ensureDefaultGenres()
      .then(load)
      .catch(console.error)
  }, [load])

  const create = async () => {
    setBusy(true)
    setMessage("")
    try {
      await addGenre(name)
      setName("")
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Жанр нэмэхэд алдаа гарлаа.")
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteGenre(deleteTarget.id, deleteTarget.name)
      await load()
      setDeleteTarget(null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Жанр устгаж чадсангүй.")
      setDeleteTarget(null)
    } finally {
      setBusy(false)
    }
  }

  const importExisting = async () => {
    setBusy(true)
    try {
      const count = await importGenresFromComics()
      setMessage(`${count} жанрыг бүтээлүүдээс импортлолоо.`)
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminPageTransition>
      <div className="space-y-5">
        <AdminPageHeader
          title="Жанрууд"
          description="Энд байгаа жанрууд комик бүртгэх форм болон каталогийн шүүлтүүрт харагдана."
        />

        <AdminPanel className="p-3">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && create()}
              placeholder="Шинэ жанрын нэр"
              className="h-9 flex-1 rounded-lg border-white/10 bg-white/[0.03] text-[13px]"
            />
            <Button size="sm" onClick={create} disabled={busy || !name.trim()} className="gap-1.5">
              <Plus className="size-4" />
              Нэмэх
            </Button>
            <Button
              size="sm"
              onClick={importExisting}
              disabled={busy}
              variant="outline"
              className="gap-1.5 border-white/10"
            >
              <Download className="size-4" />
              Комикуудаас импортлох
            </Button>
          </div>
        </AdminPanel>

        {message && (
          <p className="rounded-xl border border-pink-400/20 bg-pink-400/10 p-3 text-sm text-pink-200">
            {message}
          </p>
        )}

        <AdminPanel>
          <AdminPanelHeader title="Бүртгэлтэй жанрууд" hint={`${genres.length} жанр`} />
          {genres.length ? (
            <div className="grid gap-1.5 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {genres.map((genre) => (
                <div
                  key={genre.id}
                  className="group flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] py-1.5 pl-3.5 pr-1.5 transition-colors hover:border-white/15"
                >
                  <span className="flex items-center gap-2.5 text-[13px] text-zinc-200">
                    <Tag className="size-3.5 text-pink-300/80" />
                    {genre.name}
                  </span>
                  <Button
                    onClick={() => setDeleteTarget(genre)}
                    disabled={busy}
                    variant="ghost"
                    size="icon"
                    title="Жанр устгах"
                    className="size-7 text-zinc-700 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-10 text-center text-sm text-zinc-500">
              Жанр алга. Одоо байгаа комикуудаас импортлоорой.
            </p>
          )}
        </AdminPanel>

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Жанр устгах"
          description={`"${deleteTarget?.name || ''}" жанр бүх комикоос хасагдаж, жагсаалтаас бүр мөсөн устна.`}
          loading={busy}
          onConfirm={remove}
          onOpenChange={(open) => {
            if (!open && !busy) setDeleteTarget(null)
          }}
        />
      </div>
    </AdminPageTransition>
  )
}
