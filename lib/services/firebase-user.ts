import { auth, db, storage } from "../firebase";
import { updateProfile, updatePassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";


export const updateUserProfile = async (uid: string, displayName: string, photoFile: File | null) => {
  const user = auth.currentUser;
  if (!user || user.uid !== uid) throw new Error("Зөвшөөрөлгүй үйлдэл (Unauthorized)");

  let photoURL = user.photoURL;


  if (photoFile) {
    if (!photoFile.type.startsWith("image/")) {
      throw new Error("Profile photo must be an image");
    }
    if (photoFile.size > 5 * 1024 * 1024) {
      throw new Error("Profile photo must be 5 MB or smaller");
    }
    const storageRef = ref(storage, `profiles/${uid}/avatar`);
    const snapshot = await uploadBytes(storageRef, photoFile);
    photoURL = await getDownloadURL(snapshot.ref);
  }


  if (displayName !== user.displayName || photoURL !== user.photoURL) {
    await updateProfile(user, {
      displayName: displayName || user.displayName,
      photoURL: photoURL || user.photoURL,
    });
  }


  const userDocRef = doc(db, "users", uid);
  await updateDoc(userDocRef, {
    displayName: displayName || user.displayName,
    ...(photoURL && { photoURL: photoURL }),
  });

  return { displayName, photoURL };
};


export const changePassword = async (newPassword: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Системд нэвтэрнэ үү");

  await updatePassword(user, newPassword);
};


export const getUserProfile = async (uid: string) => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

export const updateUserSettings = async (uid: string, settings: Record<string, unknown>) => {
  const userDocRef = doc(db, "users", uid);
  await updateDoc(userDocRef, settings);
};
