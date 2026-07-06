import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, updateDoc, increment, setDoc, serverTimestamp } from "firebase/firestore";
import {
  ComicStatus,
  ComicType,
  normalizeComicStatus,
  normalizeComicType,
  normalizeGenreName,
} from "@/lib/comic-taxonomy";

export type { ComicStatus, ComicType };


export interface Comic {
  id: string;
  title: string;
  description: string;
  poster: string;
  posterStoragePath?: string;
  bannerImage?: string;
  bannerStoragePath?: string;
  storageFolder?: string;
  genres: string[];
  status: ComicStatus;
  type: ComicType;
  author?: string;
  totalChapters: number;
  publishedChapters: number;
  viewCount: number;
  likeCount?: number;
  isPublished?: boolean;
  createdAt: any;
  updatedAt?: any;
}

export interface Chapter {
  id: string;
  comicId: string;
  chapterNumber: number;
  title: string;
  pages: string[];
  pageStoragePaths?: string[];
  pageCount?: number;
  isPublished?: boolean;
  createdAt: any;
  updatedAt?: any;
}

const normalizeComicDoc = (id: string, data: any): Comic => ({
  id,
  ...data,
  genres: Array.isArray(data.genres) ? data.genres.map(normalizeGenreName) : [],
  status: normalizeComicStatus(data.status),
  type: normalizeComicType(data.type),
});


/** Админд зориулсан — ноорог комикуудыг мөн буцаана. */
export const getAllComics = async () => {
  const q = query(collection(db, "comics"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => normalizeComicDoc(doc.id, doc.data()));
};

/** Нийтийн хуудсуудад зориулсан — зөвхөн нийтлэгдсэн комикууд. */
export const getPublishedComics = async () => {
  const q = query(
    collection(db, "comics"),
    where("isPublished", "==", true),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => normalizeComicDoc(doc.id, doc.data()));
};


export const getComicById = async (comicId: string) => {
  const docRef = doc(db, "comics", comicId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? normalizeComicDoc(docSnap.id, docSnap.data()) : null;
};

/** getComicById-ийн алдаа залгидаг хувилбар — нийтлэгдээгүй комикт хандахад
 * Firestore rules permission-denied шидэх тул жагсаалт бүхэлдээ унахаас сэргийлнэ. */
export const getComicByIdSafe = async (comicId: string) => {
  try {
    return await getComicById(comicId);
  } catch {
    return null;
  }
};


/** Админд зориулсан — ноорог бүлгүүдийг мөн буцаана. */
export const getChapters = async (comicId: string) => {
  const q = query(
    collection(db, "chapters"),
    where("comicId", "==", comicId),
    orderBy("chapterNumber", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chapter[];
};

/** Уншигчдад зориулсан — зөвхөн нийтлэгдсэн бүлгүүд. */
export const getPublishedChapters = async (comicId: string) => {
  const q = query(
    collection(db, "chapters"),
    where("comicId", "==", comicId),
    where("isPublished", "==", true),
    orderBy("chapterNumber", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chapter[];
};


export const getChapterDetails = async (chapterId: string) => {
  const docRef = doc(db, "chapters", chapterId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Chapter : null;
};


/** Нүүр хуудасны "Сүүлд нэмэгдсэн" — зөвхөн нийтлэгдсэн бүлгүүд. */
export const getLatestChapters = async (maxItems = 6) => {
  const q = query(
    collection(db, "chapters"),
    where("isPublished", "==", true),
    orderBy("createdAt", "desc"),
    limit(maxItems)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chapter[];
};

export const incrementComicViewOnce = async (uid: string, comicId: string) => {
  const viewRef = doc(db, "users", uid, "views", comicId);
  const viewSnap = await getDoc(viewRef);

  if (viewSnap.exists()) {
    return false;
  }

  await setDoc(viewRef, {
    comicId,
    createdAt: serverTimestamp(),
  });

  const docRef = doc(db, "comics", comicId);
  await updateDoc(docRef, { viewCount: increment(1) });
  return true;
};
