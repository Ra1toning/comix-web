import { db } from "../firebase";
import {
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getComicByIdSafe, Comic } from "./firebase-comic";

export interface ReadingProgress {
  comicId: string;
  chapterId: string;
  chapterNumber: number;
  page: number;
  totalPages: number;
  progressPercent: number;
  updatedAt?: unknown;
}

const getChapterProgressId = (comicId: string, chapterId: string) =>
  `${comicId}__${chapterId}`;

export interface LibraryEntry {
  comicId: string;
  status: "continue" | "saved" | "completed";
  chapterId?: string;
  currentChapterNumber?: number;
  progressPercent?: number;
  updatedAt?: unknown;
}

export type LibraryStatus = LibraryEntry["status"];

export interface ContinueReadingItem {
  progress: ReadingProgress;
  comic: Comic;
}

export interface LibraryItem {
  entry: LibraryEntry;
  comic: Comic;
}

const toPercent = (page: number, totalPages: number) => {
  if (!totalPages) return 0;
  const raw = Math.round((page / totalPages) * 100);
  return Math.max(0, Math.min(100, raw));
};

export const saveReadingProgress = async (uid: string, data: Omit<ReadingProgress, "progressPercent">) => {
  const progressPercent = toPercent(data.page, data.totalPages);
  const progressRef = doc(db, "users", uid, "readingProgress", data.comicId);
  const chapterProgressRef = doc(
    db,
    "users",
    uid,
    "chapterProgress",
    getChapterProgressId(data.comicId, data.chapterId)
  );
  const progressPayload = {
    ...data,
    progressPercent,
    updatedAt: serverTimestamp(),
  };

  await setDoc(
    progressRef,
    progressPayload,
    { merge: true }
  );
  await setDoc(chapterProgressRef, progressPayload, { merge: true });

  const libraryRef = doc(db, "users", uid, "library", data.comicId);
  await setDoc(
    libraryRef,
    {
      comicId: data.comicId,
      status: "continue",
      chapterId: data.chapterId,
      currentChapterNumber: data.chapterNumber,
      progressPercent,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const getReadingProgress = async (uid: string, comicId: string) => {
  const docRef = doc(db, "users", uid, "readingProgress", comicId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists()
    ? ({ comicId: docSnap.id, ...docSnap.data() } as ReadingProgress)
    : null;
};

export const getChapterReadingProgress = async (
  uid: string,
  comicId: string,
  chapterId: string
) => {
  const docRef = doc(
    db,
    "users",
    uid,
    "chapterProgress",
    getChapterProgressId(comicId, chapterId)
  );
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as ReadingProgress) : null;
};

export const getLibraryEntry = async (uid: string, comicId: string) => {
  const docRef = doc(db, "users", uid, "library", comicId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists()
    ? ({ comicId: docSnap.id, ...docSnap.data() } as LibraryEntry)
    : null;
};

export const setLibraryStatus = async (
  uid: string,
  data: {
    comicId: string;
    status: LibraryStatus;
    chapterId?: string;
    currentChapterNumber?: number;
    progressPercent?: number;
  }
) => {
  const libraryRef = doc(db, "users", uid, "library", data.comicId);
  const payload: Record<string, unknown> = {
    comicId: data.comicId,
    status: data.status,
    updatedAt: serverTimestamp(),
  };

  if (data.chapterId !== undefined) payload.chapterId = data.chapterId;
  if (data.currentChapterNumber !== undefined) payload.currentChapterNumber = data.currentChapterNumber;
  if (data.progressPercent !== undefined) payload.progressPercent = data.progressPercent;

  await setDoc(
    libraryRef,
    payload,
    { merge: true }
  );
};

export const removeLibraryEntry = async (uid: string, comicId: string) => {
  const libraryRef = doc(db, "users", uid, "library", comicId);
  await deleteDoc(libraryRef);
};

export const getLikeStatus = async (uid: string, comicId: string) => {
  const docRef = doc(db, "users", uid, "likes", comicId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
};

export const toggleComicLike = async (uid: string, comicId: string) => {
  const likeRef = doc(db, "users", uid, "likes", comicId);
  const likeSnap = await getDoc(likeRef);
  const comicRef = doc(db, "comics", comicId);

  if (likeSnap.exists()) {
    await deleteDoc(likeRef);
    try {
      await updateDoc(comicRef, { likeCount: increment(-1) });
    } catch {

    }
    return { liked: false, delta: -1 };
  }

  await setDoc(likeRef, { comicId, createdAt: serverTimestamp() });
  try {
    await updateDoc(comicRef, { likeCount: increment(1) });
  } catch {

  }
  return { liked: true, delta: 1 };
};

export const getContinueReading = async (uid: string, maxItems = 6) => {
  const q = query(
    collection(db, "users", uid, "readingProgress"),
    orderBy("updatedAt", "desc"),
    limit(maxItems)
  );
  const snapshot = await getDocs(q);
  const progressList = snapshot.docs.map((docItem) => ({
    comicId: docItem.id,
    ...docItem.data(),
  })) as ReadingProgress[];

  const comics = await Promise.all(
    progressList.map((progress) => getComicByIdSafe(progress.comicId))
  );

  return progressList
    .map((progress, index) => {
      const comic = comics[index];
      return comic ? ({ progress, comic } as ContinueReadingItem) : null;
    })
    .filter((item): item is ContinueReadingItem => item !== null);
};

export const getUserLibrary = async (uid: string) => {
  const q = query(collection(db, "users", uid, "library"), orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  const entries = snapshot.docs.map((docItem) => ({
    comicId: docItem.id,
    ...docItem.data(),
  })) as LibraryEntry[];

  const comics = await Promise.all(
    entries.map((entry) => getComicByIdSafe(entry.comicId))
  );

  return entries
    .map((entry, index) => {
      const comic = comics[index];
      return comic ? ({ entry, comic } as LibraryItem) : null;
    })
    .filter((item): item is LibraryItem => item !== null);
};
