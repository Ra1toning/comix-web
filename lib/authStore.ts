'use client';

import { create } from 'zustand';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SESSION_IDLE_LIMIT_MS = 30 * 60 * 1000;
const SESSION_CHECK_INTERVAL_MS = 60 * 1000;
const LAST_ACTIVE_KEY = "auth_last_active";
let sessionIntervalId: number | null = null;
let lastWriteAt = 0;

const touchLastActive = () => {
  const now = Date.now();
  if (now - lastWriteAt < 5000) return;
  lastWriteAt = now;
  localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
};

const isSessionExpired = () => {
  const last = Number(localStorage.getItem(LAST_ACTIVE_KEY) || 0);
  if (!last) return false;
  return Date.now() - last > SESSION_IDLE_LIMIT_MS;
};

const ensureSessionMonitor = () => {
  if (sessionIntervalId) return;
  sessionIntervalId = window.setInterval(async () => {
    if (!auth.currentUser) return;
    if (isSessionExpired()) {
      await firebaseSignOut(auth);
      useAuthStore.getState().setUser(null);
    }
  }, SESSION_CHECK_INTERVAL_MS);
};

interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL?: string | null;
  uniqueId?: string | null;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    await firebaseSignOut(auth);
    set({ user: null });
  },
}));


if (typeof window !== 'undefined') {
  const activityEvents: Array<keyof WindowEventMap> = [
    "mousemove",
    "keydown",
    "click",
    "scroll",
    "touchstart",
  ];
  activityEvents.forEach((eventName) => {
    window.addEventListener(eventName, touchLastActive, { passive: true });
  });

  onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    useAuthStore.getState().setLoading(true);
    if (firebaseUser) {
      if (isSessionExpired()) {
        await firebaseSignOut(auth);
        useAuthStore.getState().setUser(null);
        useAuthStore.getState().setLoading(false);
        return;
      }


      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      let name = firebaseUser.displayName;
      let photoURL = firebaseUser.photoURL;
      let uniqueId: string | null = null;
      if (userDoc.exists()) {
        const data = userDoc.data();
        name = data.displayName || data.name || name;
        photoURL = data.photoURL || photoURL;
        uniqueId = data.uniqueId || null;
      }

      touchLastActive();
      ensureSessionMonitor();

      useAuthStore.getState().setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: name,
        photoURL: photoURL || "/profile.jpg",
        uniqueId: uniqueId,
      });
    } else {
      useAuthStore.getState().setUser(null);
    }
    useAuthStore.getState().setLoading(false);
  });
}
