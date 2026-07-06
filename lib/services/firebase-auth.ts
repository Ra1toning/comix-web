import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  updateProfile,
  signOut,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

/**
 * Хэрэглэгчийн Firestore model.
 *
 * users/{uid}          — хэрэглэгчийн үндсэн бичлэг
 * counters/users       — { lastId } өсөх дугаарлалтын тоолуур (Lumio ID)
 *
 * subscription нь ирээдүйд QPay зэрэг төлбөрийн системтэй холбогдоход
 * бэлэн бүтэцтэй: төлбөр амжилттай болмогц plan/status/expiresAt-г
 * сервер талаас (эсвэл админ) шинэчилнэ. Хэрэглэгч өөрөө subscription-оо
 * өөрчлөх эрхгүй (firestore.rules-д хаасан).
 */

export type SubscriptionPlan = "free" | "plus";
export type SubscriptionStatus = "none" | "active" | "expired";

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startedAt: Timestamp | null;
  expiresAt: Timestamp | null;
}

export type UserRole = "user" | "admin";
export type AuthProviderId = "password" | "google.com";

export interface UserDocument {
  uid: string;
  /** Өсөх эрэмбэтэй, давхцахгүй эерэг тоон ID (Lumio ID). */
  lumioId: number | null;
  email: string | null;
  displayName: string;
  photoURL: string;
  role: UserRole;
  provider: AuthProviderId;
  emailVerified: boolean;
  subscription: UserSubscription;
  readerTheme: string;
  autoNextChapter: boolean;
  dataSaverMode: boolean;
  createdAt: unknown;
  updatedAt: unknown;
  lastLoginAt: unknown;
}

export const DEFAULT_SUBSCRIPTION: UserSubscription = {
  plan: "free",
  status: "none",
  startedAt: null,
  expiresAt: null,
};

export const DEFAULT_AVATAR = "/profile.jpg";

/** Login-оос ялгаж харуулахын тулд имэйл баталгаажаагүй үед шидэгдэнэ. */
export class EmailNotVerifiedError extends Error {
  code = "auth/email-not-verified";
  constructor() {
    super("Имэйл хаяг баталгаажаагүй байна.");
  }
}

const usersCounterRef = () => doc(db, "counters", "users");

/**
 * Имэйл доторх линкийг манай /auth/action хуудас руу чиглүүлнэ.
 * handleCodeInApp=true үед Firebase линк дээр дарсан хэрэглэгчийг oobCode-той
 * нь хамт энэ URL руу шилжүүлдэг тул Console-ийн "Customize action URL"
 * тохиргоо шаардлагагүй — dev (localhost) болон production дээр
 * window.location.origin-оос автоматаар зөв domain-ийг авна.
 */
const emailActionSettings = () =>
  typeof window !== "undefined"
    ? { url: `${window.location.origin}/auth/action`, handleCodeInApp: true }
    : undefined;

const errorCodeOf = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: string }).code)
    : "";

/**
 * Баталгаажуулах имэйлийг манай custom хуудас руу чиглүүлж илгээнэ.
 * Deploy хийсэн domain Firebase-ийн Authorized domains-д нэмэгдээгүй бол
 * (auth/unauthorized-continue-uri) имэйл огт илгээгдэхгүй орхихын оронд
 * Firebase-ийн стандарт хуудас руу чиглүүлээд ЗААВАЛ илгээнэ.
 */
const sendVerificationEmail = async (user: User) => {
  try {
    await sendEmailVerification(user, emailActionSettings());
  } catch (error) {
    if (errorCodeOf(error) === "auth/unauthorized-continue-uri") {
      console.warn(
        "Domain not in Firebase Authorized domains — falling back to default action URL."
      );
      await sendEmailVerification(user);
    } else {
      throw error;
    }
  }
};

const providerOf = (user: User): AuthProviderId =>
  user.providerData.some((item) => item.providerId === "google.com")
    ? "google.com"
    : "password";

const buildNewUserDoc = (user: User, lumioId: number, displayName?: string) => ({
  uid: user.uid,
  lumioId,
  email: user.email,
  displayName: displayName || user.displayName || user.email?.split("@")[0] || "Уншигч",
  photoURL: user.photoURL || DEFAULT_AVATAR,
  role: "user" as UserRole,
  provider: providerOf(user),
  emailVerified: user.emailVerified,
  subscription: DEFAULT_SUBSCRIPTION,
  readerTheme: "dark",
  autoNextChapter: true,
  dataSaverMode: false,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  lastLoginAt: serverTimestamp(),
});

/**
 * users/{uid} бичлэг байгаа эсэхийг шалгаад, байхгүй бол counters/users
 * тоолуурыг transaction дотор +1 хийж дараагийн Lumio ID-г онооно.
 * Хуучин (lumioId-гүй) бүртгэлд мөн дараагийн дугаарыг нөхөж өгнө.
 * Transaction тул хоёр хэрэглэгч зэрэг бүртгүүлсэн ч ID давхцахгүй.
 */
export const ensureUserDocument = async (
  user: User,
  displayName?: string
): Promise<UserDocument> => {
  const userRef = doc(db, "users", user.uid);

  const snap = await getDoc(userRef);
  const existing = snap.exists() ? snap.data() : null;
  if (existing && typeof existing.lumioId === "number") {
    // Имэйл шинээр баталгаажсан бол Firestore-т тусгана.
    if (existing.emailVerified === false && user.emailVerified) {
      updateDoc(userRef, {
        emailVerified: true,
        updatedAt: serverTimestamp(),
      }).catch(() => undefined);
    }
    return { ...(existing as Omit<UserDocument, "uid">), uid: user.uid };
  }

  return runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(usersCounterRef());
    const userSnap = await tx.get(userRef);
    const current = userSnap.exists() ? userSnap.data() : null;

    if (current && typeof current.lumioId === "number") {
      return { ...(current as Omit<UserDocument, "uid">), uid: user.uid };
    }

    const lastId = counterSnap.exists() ? Number(counterSnap.data().lastId) || 0 : 0;
    const nextId = lastId + 1;

    if (counterSnap.exists()) {
      tx.update(usersCounterRef(), { lastId: nextId, updatedAt: serverTimestamp() });
    } else {
      tx.set(usersCounterRef(), { lastId: nextId, updatedAt: serverTimestamp() });
    }

    if (!current) {
      const newDoc = buildNewUserDoc(user, nextId, displayName);
      tx.set(userRef, newDoc);
      return newDoc as unknown as UserDocument;
    }

    // Хуучин бүртгэл: зөвхөн дутуу талбарыг нөхнө (rules-ийн дагуу).
    tx.update(userRef, {
      lumioId: nextId,
      emailVerified: user.emailVerified,
      updatedAt: serverTimestamp(),
    });
    return {
      ...(current as Omit<UserDocument, "uid">),
      uid: user.uid,
      lumioId: nextId,
    };
  });
};

const touchLastLogin = (uid: string, emailVerified: boolean) =>
  updateDoc(doc(db, "users", uid), {
    lastLoginAt: serverTimestamp(),
    emailVerified,
    updatedAt: serverTimestamp(),
  }).catch(() => undefined);

/**
 * Имэйлээр бүртгүүлнэ: бүртгэл үүсгэж, Lumio ID оноож, баталгаажуулах
 * имэйл илгээгээд гаргана. Хэрэглэгч имэйлээ баталгаажуулж байж нэвтэрнэ —
 * ингэснээр хуурамч/бусдын имэйлээр олон бүртгэл үүсгэхээс сэргийлнэ.
 */
export const registerWithEmail = async (
  name: string,
  email: string,
  password: string
) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  try {
    await ensureUserDocument(credential.user, name);
  } catch (error) {
    console.error("Failed to create user document:", error);
  }
  await sendVerificationEmail(credential.user);
  await signOut(auth);
};

/**
 * Имэйлээр нэвтэрнэ. Имэйл баталгаажаагүй бол баталгаажуулах имэйлийг
 * дахин илгээгээд EmailNotVerifiedError шиднэ.
 */
export const loginWithEmail = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);

  if (!credential.user.emailVerified) {
    try {
      await sendVerificationEmail(credential.user);
    } catch {
      // too-many-requests байж болно — өмнөх имэйл нь хүчинтэй хэвээр.
    }
    await signOut(auth);
    throw new EmailNotVerifiedError();
  }

  const profile = await ensureUserDocument(credential.user);
  void touchLastLogin(credential.user.uid, credential.user.emailVerified);
  return { user: credential.user, profile };
};

/** Google-р нэвтэрнэ (шинэ хэрэглэгч бол шууд бүртгэж Lumio ID онооно). */
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await signInWithPopup(auth, provider);
  const profile = await ensureUserDocument(credential.user);
  void touchLastLogin(credential.user.uid, credential.user.emailVerified);
  return { user: credential.user, profile };
};

/** Нууц үг сэргээх имэйл илгээнэ (domain зөвшөөрөгдөөгүй бол стандарт хуудсаар). */
export const sendPasswordReset = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email, emailActionSettings());
  } catch (error) {
    if (errorCodeOf(error) === "auth/unauthorized-continue-uri") {
      await sendPasswordResetEmail(auth, email);
    } else {
      throw error;
    }
  }
};

/**
 * Нууц үг солино. Firebase нь саяхан нэвтэрсэн байхыг шаарддаг тул
 * одоогийн нууц үгээр дахин баталгаажуулна.
 */
export const changeUserPassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("Системд нэвтэрнэ үү.");

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

export const logoutUser = () => signOut(auth);

export const getUserData = async (uid: string) => {
  const docSnap = await getDoc(doc(db, "users", uid));
  return docSnap.exists() ? docSnap.data() : null;
};
