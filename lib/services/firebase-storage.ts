

import { storage } from '@/lib/firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { convertImageToWebp, createStorageFolderName } from '@/lib/utils/imageConversion';
import { Comic } from './firebase-comic';

export interface UploadedImage {
  url: string;
  storagePath: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

type ProgressCallback = (progress: UploadProgress) => void;


export const uploadComicPoster = async (
  file: File,
  storageFolder: string,
  onProgress?: ProgressCallback
): Promise<UploadedImage> => {

  const webpBlob = await convertImageToWebp(file, {
    quality: 0.9,
    maxWidth: 900,
  });


  const storagePath = `comics/${storageFolder}/poster.webp`;
  const fileRef = ref(storage, storagePath);


  const webpFile = new File([webpBlob], 'poster.webp', { type: 'image/webp' });


  const snapshot = await uploadBytes(fileRef, webpFile);


  if (onProgress) {
    onProgress({ loaded: 100, total: 100, percentage: 100 });
  }


  const url = await getDownloadURL(snapshot.ref);

  return { url, storagePath };
};








export const uploadComicBanner = async (
  file: File,
  storageFolder: string,
  onProgress?: ProgressCallback
): Promise<UploadedImage> => {

  const webpBlob = await convertImageToWebp(file, {
    quality: 0.9,
    maxWidth: 1920,
  });

  const storagePath = `comics/${storageFolder}/banner.webp`;
  const fileRef = ref(storage, storagePath);

  const webpFile = new File([webpBlob], 'banner.webp', { type: 'image/webp' });
  const snapshot = await uploadBytes(fileRef, webpFile);

  if (onProgress) {
    onProgress({ loaded: 100, total: 100, percentage: 100 });
  }

  const url = await getDownloadURL(snapshot.ref);

  return { url, storagePath };
};

export const uploadCarouselImage = async (
  file: File,
  storageFolder: string,
  carouselItemId: string
): Promise<UploadedImage> => {
  const webpBlob = await convertImageToWebp(file, {
    quality: 0.85,
    maxWidth: 1920,
    maxHeight: 1080,
  });
  const storagePath = `comics/${storageFolder}/carousel-${carouselItemId}.webp`;
  const fileRef = ref(storage, storagePath);
  const webpFile = new File([webpBlob], `carousel-${carouselItemId}.webp`, {
    type: 'image/webp',
  });
  const snapshot = await uploadBytes(fileRef, webpFile);
  const url = await getDownloadURL(snapshot.ref);

  return { url, storagePath };
};









export const uploadChapterPages = async (
  files: File[],
  storageFolder: string,
  chapterNumber: number,
  onProgress?: (index: number, progress: UploadProgress) => void
): Promise<UploadedImage[]> => {
  const uploadedImages: UploadedImage[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const pageIndex = i + 1;

    try {

      const webpBlob = await convertImageToWebp(file, {
        quality: 0.85,

        maxWidth: 1600,
      });


      const paddedIndex = String(pageIndex).padStart(3, '0');
      const storagePath = `comics/${storageFolder}/chapter-${chapterNumber}/page-${paddedIndex}.webp`;
      const fileRef = ref(storage, storagePath);


      const webpFile = new File([webpBlob], `page-${paddedIndex}.webp`, {
        type: 'image/webp',
      });
      const snapshot = await uploadBytes(fileRef, webpFile);


      if (onProgress) {
        onProgress(i, {
          loaded: i + 1,
          total: files.length,
          percentage: Math.round(((i + 1) / files.length) * 100),
        });
      }


      const url = await getDownloadURL(snapshot.ref);
      uploadedImages.push({ url, storagePath });
    } catch (error) {
      console.error(`Failed to upload page ${pageIndex}:`, error);
      throw new Error(`Failed to upload page ${pageIndex}: ${(error as Error).message}`);
    }
  }

  return uploadedImages;
};









export const uploadChapterPage = async (
  file: File,
  storageFolder: string,
  chapterNumber: number,
  pageIndex: number
): Promise<UploadedImage> => {
  const webpBlob = await convertImageToWebp(file, {
    quality: 0.85,
    maxWidth: 1600,
  });

  const paddedIndex = String(pageIndex).padStart(3, '0');
  const storagePath = `comics/${storageFolder}/chapter-${chapterNumber}/page-${paddedIndex}.webp`;
  const fileRef = ref(storage, storagePath);

  const webpFile = new File([webpBlob], `page-${paddedIndex}.webp`, {
    type: 'image/webp',
  });

  const snapshot = await uploadBytes(fileRef, webpFile);
  const url = await getDownloadURL(snapshot.ref);

  return { url, storagePath };
};






export const deleteStorageFile = async (storagePath: string): Promise<boolean> => {
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
    return true;
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      return false;
    }
    console.error(`Failed to delete ${storagePath}:`, error);
    throw error;
  }
};






export const deleteStorageFiles = async (storagePaths: string[]) => {
  const results = {
    successful: [] as string[],
    failed: [] as { path: string; error: string }[],
  };

  for (const path of storagePaths) {
    try {
      await deleteStorageFile(path);
      results.successful.push(path);
    } catch (error) {
      results.failed.push({
        path,
        error: (error as Error).message,
      });
    }
  }

  return results;
};





export const deleteStorageFolder = async (folderPath: string): Promise<void> => {
  const folderRef = ref(storage, folderPath);

  try {

    const result = await listAll(folderRef);


    for (const file of result.items) {
      await deleteObject(file);
    }


    for (const subfolder of result.prefixes) {
      await deleteStorageFolder(subfolder.fullPath);
    }
  } catch (error: any) {
    if (error.code !== 'storage/not-found') {
      console.error(`Error deleting folder ${folderPath}:`, error);
      throw error;
    }
  }
};






export const getOrCreateStorageFolder = (comic: Partial<Comic>): string => {

  if ((comic as any).storageFolder) {
    return (comic as any).storageFolder;
  }


  if (comic.poster) {
    const extracted = extractStorageFolderFromUrl(comic.poster);
    if (extracted) return extracted;
  }
  if (comic.bannerImage) {
    const extracted = extractStorageFolderFromUrl(comic.bannerImage);
    if (extracted) return extracted;
  }


  if ((comic as any).id) {
    return (comic as any).id;
  }


  return createStorageFolderName(comic.title || 'untitled');
};






export const extractStorageFolderFromUrl = (url: string): string | null => {



  try {
    const pathMatch = url.match(/\/o\/([^?]+)/);
    if (!pathMatch) return null;

    const fullPath = decodeURIComponent(pathMatch[1]);

    const folderMatch = fullPath.match(/comics\/([^\/]+)\//);
    return folderMatch ? folderMatch[1] : null;
  } catch (error) {
    return null;
  }
};
