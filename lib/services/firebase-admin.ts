import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  Timestamp,
} from "firebase/firestore";
import { limit, orderBy } from "firebase/firestore";
import { UserRole, UserSubscription } from "./firebase-auth";
import { Comic, Chapter, ComicStatus, ComicType } from "./firebase-comic";
import {
  uploadComicPoster,
  uploadComicBanner,
  getOrCreateStorageFolder,
  deleteStorageFolder,
  deleteStorageFile,
  UploadedImage,
} from "./firebase-storage";
import { createStorageFolderName } from "@/lib/utils/imageConversion";


export const isCurrentUserAdmin = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() && userDoc.data()?.role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};


export interface AdminStats {
  totalComics: number;
  publishedComics: number;
  draftComics: number;
  totalChapters: number;
  publishedChapters: number;
  totalUsers: number;
  activeCarouselItems: number;
}

/**
 * Бүх тоог Firestore-ийн server-side count()-оор авна — collection бүхлээр
 * татахгүй тул admin dashboard хурдан ачаалагдаж, унших зардал хамгийн бага.
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  const comicsRef = collection(db, "comics");
  const chaptersRef = collection(db, "chapters");

  const [
    totalComics,
    publishedComics,
    totalChapters,
    publishedChapters,
    totalUsers,
    activeCarouselItems,
  ] = await Promise.all([
    getCountFromServer(comicsRef),
    getCountFromServer(query(comicsRef, where("isPublished", "==", true))),
    getCountFromServer(chaptersRef),
    getCountFromServer(query(chaptersRef, where("isPublished", "==", true))),
    getCountFromServer(collection(db, "users")),
    getCountFromServer(
      query(collection(db, "homepageCarousel"), where("isActive", "==", true))
    ),
  ]);

  const total = totalComics.data().count;
  const published = publishedComics.data().count;

  return {
    totalComics: total,
    publishedComics: published,
    draftComics: total - published,
    totalChapters: totalChapters.data().count,
    publishedChapters: publishedChapters.data().count,
    totalUsers: totalUsers.data().count,
    activeCarouselItems: activeCarouselItems.data().count,
  };
};


/** Dashboard-ын "Сүүлд нэмэгдсэн" хүснэгт — зөвхөн N бичлэг татна. */
export const getRecentComicsForAdmin = async (maxItems = 5): Promise<Comic[]> => {
  const q = query(
    collection(db, "comics"),
    orderBy("createdAt", "desc"),
    limit(maxItems)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Comic[];
};


export interface UserForAdmin {
  uid: string;
  email: string;
  displayName: string;
  /** Хуучин бүртгэлийн нэрийн талбар. */
  name?: string;
  /** Шинэ өсөх дугаарлалттай Lumio ID. Хуучин бүртгэлд байхгүй байж болно. */
  lumioId?: number | null;
  photoURL?: string;
  role?: UserRole;
  provider?: string;
  emailVerified?: boolean;
  subscription?: UserSubscription | null;
  createdAt?: Timestamp;
  lastLoginAt?: Timestamp;
}

/** Бүх хэрэглэгчийг Lumio ID-ийн өсөх эрэмбээр буцаана (ID-гүй нь хамгийн сүүлд). */
export const getAllUsersForAdmin = async (): Promise<UserForAdmin[]> => {
  const usersSnapshot = await getDocs(collection(db, "users"));
  const users = usersSnapshot.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data(),
  })) as UserForAdmin[];

  return users.sort((a, b) => {
    const aId = typeof a.lumioId === "number" ? a.lumioId : Number.POSITIVE_INFINITY;
    const bId = typeof b.lumioId === "number" ? b.lumioId : Number.POSITIVE_INFINITY;
    return aId - bId;
  });
};

/**
 * Хэрэглэгчийн эрхийг (subscription) сунгана. Одоо идэвхтэй эрхтэй бол
 * дуусах хугацаан дээр нь, дууссан/байхгүй бол өнөөдрөөс эхлэн нэмнэ.
 * Ирээдүйд QPay төлбөр амжилттай болмогц энэ логикоор сунгагдана.
 */
export const extendUserSubscription = async (
  uid: string,
  days: number
): Promise<UserSubscription> => {
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error("Сунгах хоногийн тоо 1-ээс дээш байх ёстой.");
  }

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("Хэрэглэгч олдсонгүй.");

  const current = snap.data().subscription as UserSubscription | undefined;
  const now = Date.now();
  const currentExpiry = current?.expiresAt?.toDate?.()?.getTime() ?? 0;
  const base = Math.max(now, currentExpiry);
  const expiresAt = Timestamp.fromMillis(base + days * 86400000);
  const startedAt =
    current?.status === "active" && current?.startedAt
      ? current.startedAt
      : Timestamp.fromMillis(now);

  const subscription: UserSubscription = {
    plan: "plus",
    status: "active",
    startedAt,
    expiresAt,
  };

  await updateDoc(userRef, {
    subscription,
    updatedAt: serverTimestamp(),
  });

  return subscription;
};


export interface CreateComicInput {
  title: string;
  description: string;
  posterFile?: File;
  bannerFile?: File;
  genres: string[];
  status: ComicStatus;
  type: ComicType;
  author?: string;
  isPublished: boolean;
}

export const createComic = async (data: CreateComicInput): Promise<string> => {
  try {

    const storageFolder = createStorageFolderName(data.title);


    if (!data.posterFile) {
      throw new Error("Poster image is required");
    }

    const posterUpload = await uploadComicPoster(data.posterFile, storageFolder);


    let bannerUpload: UploadedImage | null = null;
    if (data.bannerFile) {
      bannerUpload = await uploadComicBanner(data.bannerFile, storageFolder);
    }


    const comicsRef = collection(db, "comics");
    const newDocRef = doc(comicsRef);

    await setDoc(newDocRef, {
      title: data.title,
      description: data.description,
      poster: posterUpload.url,
      posterStoragePath: posterUpload.storagePath,
      bannerImage: bannerUpload?.url || null,
      bannerStoragePath: bannerUpload?.storagePath || null,
      storageFolder,
      genres: data.genres,
      status: data.status,
      type: data.type,
      author: data.author || null,
      totalChapters: 0,
      publishedChapters: 0,
      viewCount: 0,
      likeCount: 0,
      isPublished: data.isPublished,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newDocRef.id;
  } catch (error) {
    console.error("Error creating comic:", error);
    throw error;
  }
};

export interface UpdateComicInput {
  title?: string;
  description?: string;
  posterFile?: File;
  bannerFile?: File;
  removeBanner?: boolean;
  genres?: string[];
  status?: ComicStatus;
  type?: ComicType;
  author?: string;
  isPublished?: boolean;
}

export const updateComic = async (
  comicId: string,
  data: UpdateComicInput
): Promise<void> => {
  try {
    const comicRef = doc(db, "comics", comicId);
    const comicSnap = await getDoc(comicRef);

    if (!comicSnap.exists()) {
      throw new Error("Comic not found");
    }

    const comic = comicSnap.data() as Comic;
    const storageFolder = getOrCreateStorageFolder(comic);

    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };


    if (data.posterFile) {

      if (comic.posterStoragePath) {
        await deleteStorageFile(comic.posterStoragePath).catch(console.error);
      }

      const posterUpload = await uploadComicPoster(data.posterFile, storageFolder);
      updateData.poster = posterUpload.url;
      updateData.posterStoragePath = posterUpload.storagePath;
    }


    if (data.bannerFile) {

      if (comic.bannerStoragePath) {
        await deleteStorageFile(comic.bannerStoragePath).catch(console.error);
      }

      const bannerUpload = await uploadComicBanner(data.bannerFile, storageFolder);
      updateData.bannerImage = bannerUpload.url;
      updateData.bannerStoragePath = bannerUpload.storagePath;
    }


    if (data.removeBanner) {
      if (comic.bannerStoragePath) {
        await deleteStorageFile(comic.bannerStoragePath).catch(console.error);
      }
      updateData.bannerImage = null;
      updateData.bannerStoragePath = null;
    }


    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.genres !== undefined) updateData.genres = data.genres;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.author !== undefined) updateData.author = data.author;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;

    await updateDoc(comicRef, updateData);
  } catch (error) {
    console.error("Error updating comic:", error);
    throw error;
  }
};

export const deleteComic = async (comicId: string): Promise<void> => {
  try {

    const comicSnap = await getDoc(doc(db, "comics", comicId));
    if (!comicSnap.exists()) {
      throw new Error("Comic not found");
    }

    const comic = comicSnap.data() as Comic;
    const storageFolder = getOrCreateStorageFolder(comic);


    const chaptersQuery = query(
      collection(db, "chapters"),
      where("comicId", "==", comicId)
    );
    const chaptersSnapshot = await getDocs(chaptersQuery);

    for (const chapterDoc of chaptersSnapshot.docs) {
      const chapter = chapterDoc.data() as Chapter;

      if (chapter.pageStoragePaths && chapter.pageStoragePaths.length > 0) {
        await Promise.all(
          chapter.pageStoragePaths.map(path =>
            deleteStorageFile(path).catch(console.error)
          )
        );
      }
      await deleteDoc(chapterDoc.ref);
    }


    await deleteStorageFolder(`comics/${storageFolder}`).catch(console.error);


    await deleteDoc(doc(db, "comics", comicId));
  } catch (error) {
    console.error("Error deleting comic:", error);
    throw error;
  }
};


export interface CreateChapterInput {
  comicId: string;
  chapterNumber: number;
  title: string;
  pages: string[];
  isPublished: boolean;
}

export const createChapter = async (
  data: CreateChapterInput
): Promise<string> => {
  try {
    const chaptersRef = collection(db, "chapters");
    const newDocRef = doc(chaptersRef);

    await setDoc(newDocRef, {
      comicId: data.comicId,
      chapterNumber: data.chapterNumber,
      title: data.title,
      pages: data.pages,
      isPublished: data.isPublished,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });


    const comicRef = doc(db, "comics", data.comicId);
    const comicDoc = await getDoc(comicRef);

    if (comicDoc.exists()) {
      const currentTotal = comicDoc.data().totalChapters || 0;
      const currentPublished = comicDoc.data().publishedChapters || 0;

      await updateDoc(comicRef, {
        totalChapters: Math.max(currentTotal, data.chapterNumber),
        publishedChapters: data.isPublished
          ? currentPublished + 1
          : currentPublished,
        updatedAt: serverTimestamp(),
      });
    }

    return newDocRef.id;
  } catch (error) {
    console.error("Error creating chapter:", error);
    throw error;
  }
};

export interface UpdateChapterInput {
  chapterNumber?: number;
  title?: string;
  pages?: string[];
  isPublished?: boolean;
}

export const updateChapter = async (
  chapterId: string,
  data: UpdateChapterInput
): Promise<void> => {
  try {
    const chapterRef = doc(db, "chapters", chapterId);
    const chapterDoc = await getDoc(chapterRef);

    if (!chapterDoc.exists()) {
      throw new Error("Chapter not found");
    }

    const oldIsPublished = chapterDoc.data().isPublished;
    const newIsPublished = data.isPublished !== undefined ? data.isPublished : oldIsPublished;
    const comicId = chapterDoc.data().comicId;

    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (data.chapterNumber !== undefined) updateData.chapterNumber = data.chapterNumber;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.pages !== undefined) updateData.pages = data.pages;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;

    await updateDoc(chapterRef, updateData);


    if (oldIsPublished !== newIsPublished) {
      const comicRef = doc(db, "comics", comicId);
      if (newIsPublished) {

        await updateDoc(comicRef, {
          publishedChapters: increment(1),
          updatedAt: serverTimestamp(),
        });
      } else {

        await updateDoc(comicRef, {
          publishedChapters: increment(-1),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.error("Error updating chapter:", error);
    throw error;
  }
};

export const deleteChapter = async (chapterId: string): Promise<void> => {
  try {
    const chapterRef = doc(db, "chapters", chapterId);
    const chapterDoc = await getDoc(chapterRef);

    if (!chapterDoc.exists()) {
      throw new Error("Chapter not found");
    }

    const isPublished = chapterDoc.data().isPublished;
    const comicId = chapterDoc.data().comicId;


    await deleteDoc(chapterRef);


    if (isPublished) {
      const comicRef = doc(db, "comics", comicId);
      await updateDoc(comicRef, {
        publishedChapters: increment(-1),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error deleting chapter:", error);
    throw error;
  }
};
