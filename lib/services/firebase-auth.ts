import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
  updateProfile,
  signOut
} from "firebase/auth";
import { doc, getDoc, setDoc, runTransaction } from "firebase/firestore";


async function generateUniqueId(): Promise<string> {
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    const randomId = Math.floor(100000 + Math.random() * 900000).toString();
    const idDocRef = doc(db, "usedIds", randomId);

    try {
      await runTransaction(db, async (transaction) => {
        const idDoc = await transaction.get(idDocRef);
        if (idDoc.exists()) {
          throw new Error("ID exists");
        }
        transaction.set(idDocRef, { inUse: true, timestamp: new Date() });
      });
      return randomId;
    } catch (e) {
      continue;
    }
  }
  throw new Error("Could not generate a unique ID after several attempts");
}

export const registerUser = async (email: string, password: string, name: string) => {

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;


  await updateProfile(user, { displayName: name });


  const uniqueId = await generateUniqueId();

  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    displayName: name,
    uniqueId: uniqueId,
    photoURL: "/profile.jpg",
    createdAt: new Date(),
  });

  return user;
};

export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async () => {
  return signOut(auth);
};

export const changeUserPassword = async (newPassword: string) => {
  if (auth.currentUser) {
    return updatePassword(auth.currentUser, newPassword);
  }
  throw new Error("No user is logged in");
};

export const getUserData = async (uid: string) => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};
