import { db } from "../firebase"
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import { DEFAULT_GENRES, normalizeGenreName, taxonomyId } from "@/lib/comic-taxonomy"

export interface Genre {
  id: string
  name: string
  createdAt?: unknown
}

const normalizeGenre = normalizeGenreName
const genreId = taxonomyId

export async function getGenres(): Promise<Genre[]> {
  const snapshot = await getDocs(query(collection(db, "genres"), orderBy("name", "asc")))
  const names = new Map<string, Genre>()
  snapshot.docs.forEach((item) => {
    const data = item.data() as Genre
    const name = normalizeGenre(data.name || "")
    if (name) names.set(name.toLowerCase(), { ...data, id: item.id, name })
  })
  return Array.from(names.values()).sort((a, b) => a.name.localeCompare(b.name, "mn"))
}

export async function addGenre(name: string): Promise<void> {
  const normalized = normalizeGenre(name)
  if (!normalized) throw new Error("Жанрын нэр оруулна уу.")
  const id = genreId(normalized)
  if (!id) throw new Error("Жанрын нэр буруу байна.")
  await setDoc(doc(db, "genres", id), {
    name: normalized,
    createdAt: serverTimestamp(),
  }, { merge: true })
}

export async function deleteGenre(id: string, name: string): Promise<void> {
  const comics = await getDocs(collection(db, "comics"))
  await Promise.all(comics.docs.map((comic) => {
    const genres = (comic.data().genres || []) as string[]
    const nextGenres = genres.filter((genre) => normalizeGenre(genre).toLowerCase() !== normalizeGenre(name).toLowerCase())
    return nextGenres.length === genres.length ? Promise.resolve() : updateDoc(comic.ref, { genres: nextGenres })
  }))
  await deleteDoc(doc(db, "genres", id))
}

export async function importGenresFromComics(): Promise<number> {
  const comics = await getDocs(collection(db, "comics"))
  const names = new Set<string>()
  comics.docs.forEach((comic) => {
    ((comic.data().genres || []) as string[]).forEach((name) => {
      const normalized = normalizeGenre(name)
      if (normalized) names.add(normalized)
    })
  })
  await Promise.all(Array.from(names).map(addGenre))
  return names.size
}

export async function ensureDefaultGenres(): Promise<void> {
  await Promise.all(DEFAULT_GENRES.map(addGenre))
  await importGenresFromComics()
}
