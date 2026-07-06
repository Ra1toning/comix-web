'use client';

import { create } from 'zustand';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase';
import {
  ensureUserDocument,
  DEFAULT_AVATAR,
  UserSubscription,
  UserRole,
} from './services/firebase-auth';

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
  /** Өсөх эрэмбэтэй тоон Lumio ID. */
  lumioId?: number | null;
  role?: UserRole;
  subscription?: UserSubscription | null;
  provider?: "password" | "google.com";
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

const isPasswordProvider = (firebaseUser: User) =>
  firebaseUser.providerData.every((item) => item.providerId === "password");

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

      // Имэйл баталгаажаагүй бол нэвтэрсэнд тооцохгүй. signOut хийхгүй —
      // бүртгэлийн урсгал (verification имэйл илгээх) дуусаагүй байж болно.
      if (isPasswordProvider(firebaseUser) && !firebaseUser.emailVerified) {
        useAuthStore.getState().setUser(null);
        useAuthStore.getState().setLoading(false);
        return;
      }

      let name = firebaseUser.displayName;
      let photoURL = firebaseUser.photoURL;
      let lumioId: number | null = null;
      let role: UserRole = "user";
      let subscription: UserSubscription | null = null;

      try {
        // Бичлэг байхгүй/lumioId-гүй бол энд автоматаар үүсгэж дугаарлана.
        const profile = await ensureUserDocument(firebaseUser);
        name = profile.displayName || name;
        photoURL = profile.photoURL || photoURL;
        lumioId = typeof profile.lumioId === "number" ? profile.lumioId : null;
        role = profile.role || "user";
        subscription = profile.subscription || null;
      } catch (error) {
        console.error("Failed to load user profile:", error);
      }

      touchLastActive();
      ensureSessionMonitor();

      useAuthStore.getState().setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name,
        photoURL: photoURL || DEFAULT_AVATAR,
        lumioId,
        role,
        subscription,
        provider: isPasswordProvider(firebaseUser) ? "password" : "google.com",
      });
    } else {
      useAuthStore.getState().setUser(null);
    }
    useAuthStore.getState().setLoading(false);
  });
}
