"use client"

import { useCallback, useEffect, useState } from "react"
import { Download, Plus, Tag, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
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
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="border-b border-white/10 pb-6">
        <p className="mb-2 text-xs font-semibold uppercase text-pink-400">Контентын ангилал</p>
        <h1 className="text-3xl font-semibold text-white">Жанрын удирдлага</h1>
        <p className="mt-2 text-sm text-zinc-500">Энд байгаа жанрууд комик бүртгэх хэсэг болон каталогийн шүүлтүүрт харагдана.</p>
      </header>

      <div className="flex flex-col gap-3 border border-white/10 bg-white/[0.02] p-5 sm:flex-row">
        <Input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && create()} placeholder="Шинэ жанрын нэр" className="rounded-none border-white/10 bg-black/30" />
        <Button onClick={create} disabled={busy || !name.trim()} className="rounded-none bg-white text-black hover:bg-zinc-200">
          <Plus className="mr-2 size-4" />Нэмэх
        </Button>
        <Button onClick={importExisting} disabled={busy} variant="outline" className="rounded-none border-white/10">
          <Download className="mr-2 size-4" />Комикуудаас импортлох
        </Button>
      </div>

      {message && <p className="text-sm text-pink-300">{message}</p>}

      <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
        {genres.map((genre) => (
          <div key={genre.id} className="flex items-center justify-between bg-[#0b0b0c] px-4 py-4">
            <span className="flex items-center gap-3 text-sm text-white"><Tag className="size-4 text-pink-400" />{genre.name}</span>
            <Button onClick={() => setDeleteTarget(genre)} disabled={busy} variant="ghost" size="icon" className="rounded-none text-zinc-600 hover:bg-red-500/10 hover:text-red-400">
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {!genres.length && <p className="col-span-full bg-[#0b0b0c] p-8 text-center text-sm text-zinc-500">Жанр алга. Одоо байгаа комикуудаас импортлоорой.</p>}
      </div>

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
  )
}
