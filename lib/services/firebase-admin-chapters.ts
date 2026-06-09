

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { Chapter } from './firebase-comic';
import { deleteStorageFiles } from './firebase-storage';

export interface ChapterCreateData {
  chapterNumber: number;
  title: string;
  pages: string[];
  pageStoragePaths: string[];
  isPublished?: boolean;
}

export interface ChapterUpdateData {
  chapterNumber?: number;
  title?: string;
  pages?: string[];
  pageStoragePaths?: string[];
  isPublished?: boolean;
}

export interface PageChange {
  action: 'add' | 'remove' | 'replace' | 'reorder';
  pageIndex?: number;
  newUrl?: string;
  newPath?: string;
}


export const getChaptersByComicId = async (comicId: string): Promise<Chapter[]> => {
  const q = query(
    collection(db, 'chapters'),
    where('comicId', '==', comicId),
    orderBy('chapterNumber', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chapter[];
};


export const getNextChapterNumber = async (comicId: string): Promise<number> => {
  const chapters = await getChaptersByComicId(comicId);
  if (chapters.length === 0) return 1;
  return Math.max(...chapters.map(c => c.chapterNumber)) + 1;
};


export const chapterNumberExists = async (
  comicId: string,
  chapterNumber: number,
  excludeChapterId?: string
): Promise<boolean> => {
  const q = query(
    collection(db, 'chapters'),
    where('comicId', '==', comicId),
    where('chapterNumber', '==', chapterNumber)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.some(chapterDoc => chapterDoc.id !== excludeChapterId);
};


export const createChapter = async (
  comicId: string,
  data: ChapterCreateData
): Promise<Chapter> => {

  const exists = await chapterNumberExists(comicId, data.chapterNumber);
  if (exists) {
    throw new Error(`Chapter ${data.chapterNumber} already exists for this comic`);
  }


  const chapterRef = await addDoc(collection(db, 'chapters'), {
    comicId,
    chapterNumber: data.chapterNumber,
    title: data.title,
    pages: data.pages,
    pageStoragePaths: data.pageStoragePaths || [],
    pageCount: data.pages.length,
    isPublished: data.isPublished || false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });


  await recalculateComicChapterStats(comicId);


  const chapterSnap = await getDoc(chapterRef);
  return {
    id: chapterSnap.id,
    ...chapterSnap.data(),
  } as Chapter;
};







export const updateChapter = async (
  chapterId: string,
  data: ChapterUpdateData
): Promise<Chapter> => {
  const chapterRef = doc(db, 'chapters', chapterId);
  const chapterSnap = await getDoc(chapterRef);

  if (!chapterSnap.exists()) {
    throw new Error('Chapter not found');
  }

  const currentChapter = chapterSnap.data() as Chapter;


  await updateDoc(chapterRef, {
    ...(data.chapterNumber !== undefined && { chapterNumber: data.chapterNumber }),
    ...(data.title !== undefined && { title: data.title }),
    ...(data.pages !== undefined && { pages: data.pages }),
    ...(data.pageStoragePaths !== undefined && { pageStoragePaths: data.pageStoragePaths }),
    ...(data.pages && { pageCount: data.pages.length }),
    ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
    updatedAt: serverTimestamp(),
  });


  await recalculateComicChapterStats(currentChapter.comicId);


  const updated = await getDoc(chapterRef);
  return {
    id: updated.id,
    ...updated.data(),
  } as Chapter;
};





export const deleteChapter = async (chapterId: string): Promise<void> => {
  const chapterRef = doc(db, 'chapters', chapterId);
  const chapterSnap = await getDoc(chapterRef);

  if (!chapterSnap.exists()) {
    throw new Error('Chapter not found');
  }

  const chapter = chapterSnap.data() as Chapter;


  if (chapter.pageStoragePaths && chapter.pageStoragePaths.length > 0) {
    await deleteStorageFiles(chapter.pageStoragePaths);
  }


  await deleteDoc(chapterRef);


  await recalculateComicChapterStats(chapter.comicId);
};






export const updateChapterPages = async (
  chapterId: string,
  pages: string[],
  pageStoragePaths?: string[]
): Promise<void> => {
  const chapterRef = doc(db, 'chapters', chapterId);
  const chapterSnap = await getDoc(chapterRef);

  if (!chapterSnap.exists()) {
    throw new Error('Chapter not found');
  }

  await updateDoc(chapterRef, {
    pages,
    pageStoragePaths: pageStoragePaths || [],
    pageCount: pages.length,
    updatedAt: serverTimestamp(),
  });
};





export const recalculateComicChapterStats = async (comicId: string): Promise<void> => {
  const chapters = await getChaptersByComicId(comicId);

  const totalChapters = chapters.length;
  const publishedChapters = chapters.filter(c => c.isPublished).length;

  const comicRef = doc(db, 'comics', comicId);
  await updateDoc(comicRef, {
    totalChapters,
    publishedChapters,
    updatedAt: serverTimestamp(),
  });
};





export const publishChapter = async (chapterId: string): Promise<void> => {
  const chapterRef = doc(db, 'chapters', chapterId);
  const chapterSnap = await getDoc(chapterRef);

  if (!chapterSnap.exists()) {
    throw new Error('Chapter not found');
  }

  const chapter = chapterSnap.data() as Chapter;

  await updateDoc(chapterRef, {
    isPublished: true,
    updatedAt: serverTimestamp(),
  });


  await recalculateComicChapterStats(chapter.comicId);
};





export const unpublishChapter = async (chapterId: string): Promise<void> => {
  const chapterRef = doc(db, 'chapters', chapterId);
  const chapterSnap = await getDoc(chapterRef);

  if (!chapterSnap.exists()) {
    throw new Error('Chapter not found');
  }

  const chapter = chapterSnap.data() as Chapter;

  await updateDoc(chapterRef, {
    isPublished: false,
    updatedAt: serverTimestamp(),
  });


  await recalculateComicChapterStats(chapter.comicId);
};






export const getTotalPagesForComic = async (comicId: string): Promise<number> => {
  const chapters = await getChaptersByComicId(comicId);
  return chapters.reduce((sum, chapter) => sum + (chapter.pages?.length || 0), 0);
};
