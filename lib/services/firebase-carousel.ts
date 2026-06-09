import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { Comic } from "./firebase-comic";
import {
  deleteStorageFile,
  getOrCreateStorageFolder,
  uploadCarouselImage,
} from "./firebase-storage";
import { normalizeComicStatus, normalizeComicType, normalizeGenreName } from "@/lib/comic-taxonomy";

export interface CarouselItem {
  id: string;
  comicId: string;
  titleOverride?: string;
  descriptionOverride?: string;
  bannerImageOverride?: string;
  bannerImageStoragePath?: string;
  badgeText?: string;
  order: number;
  isActive: boolean;
  startDate?: Timestamp | null;
  endDate?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CarouselItemWithComic extends CarouselItem {
  comic?: Comic;
}

const normalizeCarouselComic = (id: string, data: any): Comic => ({
  id,
  ...data,
  genres: Array.isArray(data.genres) ? data.genres.map(normalizeGenreName) : [],
  status: normalizeComicStatus(data.status),
  type: normalizeComicType(data.type),
});


export const getHomepageCarouselItems = async (): Promise<
  CarouselItemWithComic[]
> => {
  try {
    const carouselQuery = query(
      collection(db, "homepageCarousel"),
      where("isActive", "==", true),
      orderBy("order", "asc"),
      orderBy("createdAt", "desc")
    );

    const carouselSnapshot = await getDocs(carouselQuery);
    const items: CarouselItemWithComic[] = [];
    const now = new Date();

    for (const carouselDoc of carouselSnapshot.docs) {
      const item = carouselDoc.data() as Omit<CarouselItem, "id">;
      const startDate = item.startDate
        ? (item.startDate as Timestamp).toDate()
        : null;
      const endDate = item.endDate
        ? (item.endDate as Timestamp).toDate()
        : null;


      if (startDate && now < startDate) continue;
      if (endDate && now > endDate) continue;


      const comicDoc = await getDoc(doc(db, "comics", item.comicId));
      if (!comicDoc.exists()) continue;

      const comic = normalizeCarouselComic(comicDoc.id, comicDoc.data());


      if (!comic.isPublished) continue;

      items.push({
        id: carouselDoc.id,
        ...item,
        comic,
      } as CarouselItemWithComic);
    }


    if (items.length === 0) {
      return getFallbackCarouselItems();
    }

    return items;
  } catch (error) {
    console.error("Error getting homepage carousel items:", error);
    return getFallbackCarouselItems();
  }
};


const getFallbackCarouselItems = async (): Promise<
  CarouselItemWithComic[]
> => {
  try {

    const comicsQuery = query(
      collection(db, "comics"),
      where("isPublished", "==", true),
      orderBy("viewCount", "desc")
    );

    const comicsSnapshot = await getDocs(comicsQuery);
    const items: CarouselItemWithComic[] = [];

    for (const comicDoc of comicsSnapshot.docs.slice(0, 5)) {
      const comic = normalizeCarouselComic(comicDoc.id, comicDoc.data());
      items.push({
        id: `fallback-${comicDoc.id}`,
        comicId: comicDoc.id,
        order: items.length,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        comic,
      } as CarouselItemWithComic);
    }

    return items;
  } catch (error) {
    console.error("Error getting fallback carousel items:", error);
    return [];
  }
};


export const getAdminCarouselItems = async (): Promise<
  CarouselItemWithComic[]
> => {
  try {
    const carouselQuery = query(
      collection(db, "homepageCarousel"),
      orderBy("order", "asc"),
      orderBy("createdAt", "desc")
    );

    const carouselSnapshot = await getDocs(carouselQuery);
    const items: CarouselItemWithComic[] = [];

    for (const carouselDoc of carouselSnapshot.docs) {
      const item = carouselDoc.data() as Omit<CarouselItem, "id">;


      const comicDoc = await getDoc(doc(db, "comics", item.comicId));
      if (!comicDoc.exists()) continue;

      const comic = normalizeCarouselComic(comicDoc.id, comicDoc.data());

      items.push({
        id: carouselDoc.id,
        ...item,
        comic,
      } as CarouselItemWithComic);
    }

    return items;
  } catch (error) {
    console.error("Error getting admin carousel items:", error);
    return [];
  }
};


export interface CreateCarouselItemInput {
  comicId: string;
  titleOverride?: string;
  descriptionOverride?: string;
  imageFile?: File;
  imageUrl?: string;
  badgeText?: string;
  order: number;
  isActive: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}

export const createCarouselItem = async (
  data: CreateCarouselItemInput
): Promise<string> => {
  try {
    const carouselRef = collection(db, "homepageCarousel");
    const newDocRef = doc(carouselRef);

    const comicSnap = await getDoc(doc(db, "comics", data.comicId));
    if (!comicSnap.exists()) {
      throw new Error("Selected manga was not found");
    }

    let imageUpload = null;
    if (data.imageFile) {
      const comic = normalizeCarouselComic(comicSnap.id, comicSnap.data());
      imageUpload = await uploadCarouselImage(
        data.imageFile,
        getOrCreateStorageFolder(comic),
        newDocRef.id
      );
    }

    await setDoc(newDocRef, {
      comicId: data.comicId,
      titleOverride: data.titleOverride || null,
      descriptionOverride: data.descriptionOverride || null,
      bannerImageOverride: imageUpload?.url || data.imageUrl?.trim() || null,
      bannerImageStoragePath: imageUpload?.storagePath || null,
      badgeText: data.badgeText || null,
      order: data.order,
      isActive: data.isActive,
      startDate: data.startDate ? Timestamp.fromDate(data.startDate) : null,
      endDate: data.endDate ? Timestamp.fromDate(data.endDate) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newDocRef.id;
  } catch (error) {
    console.error("Error creating carousel item:", error);
    throw error;
  }
};


export interface UpdateCarouselItemInput {
  comicId?: string;
  titleOverride?: string;
  descriptionOverride?: string;
  imageFile?: File;
  imageUrl?: string;
  removeImageOverride?: boolean;
  badgeText?: string;
  order?: number;
  isActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}

export const updateCarouselItem = async (
  itemId: string,
  data: UpdateCarouselItemInput
): Promise<void> => {
  try {
    const itemRef = doc(db, "homepageCarousel", itemId);
    const itemSnap = await getDoc(itemRef);
    if (!itemSnap.exists()) {
      throw new Error("Carousel item not found");
    }
    const currentItem = itemSnap.data() as CarouselItem;
    const updateData: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (data.comicId !== undefined) updateData.comicId = data.comicId;
    if (data.titleOverride !== undefined) updateData.titleOverride = data.titleOverride;
    if (data.descriptionOverride !== undefined) updateData.descriptionOverride = data.descriptionOverride;
    if (data.imageFile) {
      const comicId = data.comicId || currentItem.comicId;
      const comicSnap = await getDoc(doc(db, "comics", comicId));
      if (!comicSnap.exists()) {
        throw new Error("Selected manga was not found");
      }
      const comic = normalizeCarouselComic(comicSnap.id, comicSnap.data());
      const imageUpload = await uploadCarouselImage(
        data.imageFile,
        getOrCreateStorageFolder(comic),
        itemId
      );
      if (
        currentItem.bannerImageStoragePath &&
        currentItem.bannerImageStoragePath !== imageUpload.storagePath
      ) {
        await deleteStorageFile(currentItem.bannerImageStoragePath).catch(console.error);
      }
      updateData.bannerImageOverride = imageUpload.url;
      updateData.bannerImageStoragePath = imageUpload.storagePath;
    } else if (data.imageUrl !== undefined) {
      if (currentItem.bannerImageStoragePath) {
        await deleteStorageFile(currentItem.bannerImageStoragePath).catch(console.error);
      }
      updateData.bannerImageOverride = data.imageUrl.trim() || null;
      updateData.bannerImageStoragePath = null;
    } else if (data.removeImageOverride) {
      if (currentItem.bannerImageStoragePath) {
        await deleteStorageFile(currentItem.bannerImageStoragePath).catch(console.error);
      }
      updateData.bannerImageOverride = null;
      updateData.bannerImageStoragePath = null;
    }
    if (data.badgeText !== undefined) updateData.badgeText = data.badgeText;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate
        ? Timestamp.fromDate(data.startDate)
        : null;
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate
        ? Timestamp.fromDate(data.endDate)
        : null;
    }

    await updateDoc(itemRef, updateData);
  } catch (error) {
    console.error("Error updating carousel item:", error);
    throw error;
  }
};


export const deleteCarouselItem = async (itemId: string): Promise<void> => {
  try {
    const itemRef = doc(db, "homepageCarousel", itemId);
    const itemSnap = await getDoc(itemRef);
    if (itemSnap.exists()) {
      const item = itemSnap.data() as CarouselItem;
      if (item.bannerImageStoragePath) {
        await deleteStorageFile(item.bannerImageStoragePath).catch(console.error);
      }
    }
    await deleteDoc(itemRef);
  } catch (error) {
    console.error("Error deleting carousel item:", error);
    throw error;
  }
};


export const toggleCarouselItemActive = async (
  itemId: string,
  isActive: boolean
): Promise<void> => {
  try {
    const itemRef = doc(db, "homepageCarousel", itemId);
    await updateDoc(itemRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error toggling carousel item active status:", error);
    throw error;
  }
};
