import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  DEFAULT_GENRES,
  normalizeComicStatus,
  normalizeComicType,
  normalizeGenreName,
  taxonomyId,
} from "@/lib/comic-taxonomy";
import { db } from "@/lib/firebase";

export interface TaxonomyMigrationResult {
  comicsUpdated: number;
  genresUpdated: number;
  genresDeleted: number;
}

const sameStringArray = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export async function migrateTaxonomyToMongolian(): Promise<TaxonomyMigrationResult> {
  let comicsUpdated = 0;
  let genresUpdated = 0;
  let genresDeleted = 0;

  const comicsSnapshot = await getDocs(collection(db, "comics"));

  for (const comic of comicsSnapshot.docs) {
    const data = comic.data();
    const genres = Array.isArray(data.genres) ? data.genres.map(normalizeGenreName) : [];
    const status = normalizeComicStatus(data.status);
    const type = normalizeComicType(data.type);

    if (
      data.status !== status ||
      data.type !== type ||
      !sameStringArray(Array.isArray(data.genres) ? data.genres : [], genres)
    ) {
      await updateDoc(comic.ref, {
        genres,
        status,
        type,
        updatedAt: serverTimestamp(),
      });
      comicsUpdated += 1;
    }
  }

  for (const name of DEFAULT_GENRES) {
    const id = taxonomyId(name);
    if (!id) continue;

    await setDoc(
      doc(db, "genres", id),
      { name, createdAt: serverTimestamp() },
      { merge: true }
    );
    genresUpdated += 1;
  }

  const genresSnapshot = await getDocs(collection(db, "genres"));

  for (const genre of genresSnapshot.docs) {
    const data = genre.data();
    const name = normalizeGenreName(String(data.name || ""));
    const nextId = taxonomyId(name);
    if (!name || !nextId) continue;

    if (data.name !== name || genre.id !== nextId) {
      await setDoc(
        doc(db, "genres", nextId),
        {
          ...data,
          name,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      genresUpdated += 1;

      if (genre.id !== nextId) {
        await deleteDoc(genre.ref);
        genresDeleted += 1;
      }
    }
  }

  return { comicsUpdated, genresUpdated, genresDeleted };
}

