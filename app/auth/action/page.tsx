"use client";

/**
 * Firebase Auth-ийн имэйл үйлдлүүдийн custom хуудас.
 * Firebase Console → Authentication → Templates → "Customize action URL"
 * хэсэгт https://<domain>/auth/action гэж тохируулснаар имэйл доторх линк
 * энэ хуудас руу чиглэж, Lumio-ийн дизайнтай баталгаажуулалт харагдана.
 *
 * mode=verifyEmail   — имэйл баталгаажуулах
 * mode=resetPassword — шинэ нууц үг тохируулах
 * mode=recoverEmail  — имэйл буцаан сэргээх
 */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  MailCheck,
  KeyRound,
  Loader2,
  AlertTriangle,
  Flame,
  CheckCircle2,
} from "lucide-react";

type ActionState =
  | { status: "working" }
  | { status: "verified" }
  | { status: "reset-form"; email: string }
  | { status: "reset-done" }
  | { status: "recovered" }
  | { status: "error"; message: string };

const errorMessageFor = (code: string) => {
  switch (code) {
    case "auth/expired-action-code":
      return "Холбоосын хугацаа дууссан байна. Дахин шинэ холбоос авна уу.";
    case "auth/invalid-action-code":
      return "Холбоос буруу эсвэл аль хэдийн ашиглагдсан байна.";
    case "auth/user-disabled":
      return "Энэ бүртгэл түр хаагдсан байна.";
    case "auth/user-not-found":
      return "Бүртгэл олдсонгүй.";
    case "auth/weak-password":
      return "Нууц үг хэт сул байна. 6-с доошгүй тэмдэгт ашиглана уу.";
    default:
      return "Алдаа гарлаа. Холбоос хүчингүй болсон байж магадгүй.";
  }
};

const codeOf = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: string }).code)
    : "";

function AuthActionContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode") || "";

  const [state, setState] = useState<ActionState>({ status: "working" });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!oobCode || !mode) {
      setState({ status: "error", message: "Холбоос дутуу байна. Имэйл доторх холбоосыг бүтнээр нь нээнэ үү." });
      return;
    }

    if (mode === "verifyEmail") {
      applyActionCode(auth, oobCode)
        .then(() => setState({ status: "verified" }))
        .catch((error) => setState({ status: "error", message: errorMessageFor(codeOf(error)) }));
    } else if (mode === "resetPassword") {
      verifyPasswordResetCode(auth, oobCode)
        .then((email) => setState({ status: "reset-form", email }))
        .catch((error) => setState({ status: "error", message: errorMessageFor(codeOf(error)) }));
    } else if (mode === "recoverEmail") {
      applyActionCode(auth, oobCode)
        .then(() => setState({ status: "recovered" }))
        .catch((error) => setState({ status: "error", message: errorMessageFor(codeOf(error)) }));
    } else {
      setState({ status: "error", message: "Танигдахгүй үйлдэл байна." });
    }
  }, [mode, oobCode]);

  const handleResetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 6) {
      setFormError("Нууц үг 6-с доошгүй тэмдэгттэй байх ёстой.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Нууц үг таарахгүй байна.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setState({ status: "reset-done" });
    } catch (error) {
      setFormError(errorMessageFor(codeOf(error)));
    } finally {
      setSubmitting(false);
    }
  };

  const primaryLink = (
    <Link
      href="/login"
      className="mt-10 flex h-14 w-full items-center justify-center rounded-full bg-zinc-300 text-lg font-medium text-black transition-colors hover:bg-white"
    >
      Нэвтрэх
    </Link>
  );

  if (state.status === "working") {
    return (
      <div className="flex flex-col items-center text-center">
        <Loader2 className="size-8 animate-spin text-zinc-500" />
        <p className="mt-6 text-sm font-light text-zinc-500">Шалгаж байна...</p>
      </div>
    );
  }

  if (state.status === "verified") {
    return (
      <div className="flex w-full flex-col items-center text-center">
        <div className="mb-8 flex size-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
          <MailCheck className="size-9 text-emerald-300" />
        </div>
        <h1 className="text-3xl font-medium text-white">Имэйл баталгаажлаа</h1>
        <p className="mt-4 text-sm font-light leading-6 text-zinc-400">
          Таны бүртгэл амжилттай баталгаажлаа. Одоо нэвтэрч Lumio-г бүрэн ашиглах боломжтой.
        </p>
        {primaryLink}
      </div>
    );
  }

  if (state.status === "reset-form") {
    return (
      <div className="flex w-full flex-col">
        <div className="mb-8 flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <KeyRound className="size-6 text-zinc-300" />
        </div>
        <h1 className="text-3xl font-medium text-white">Шинэ нууц үг</h1>
        <p className="mt-3 text-sm font-light leading-6 text-zinc-400">
          <span className="text-white">{state.email}</span> бүртгэлд шинэ нууц үг тохируулна.
        </p>

        <form onSubmit={handleResetSubmit} className="mt-8 space-y-4">
          <Input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full h-14 bg-transparent border-white/10 hover:border-white/30 text-white placeholder:text-zinc-500 text-base rounded-[1.25rem] px-5 focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/30 transition-all font-light"
            placeholder="Шинэ нууц үг (6+ тэмдэгт)"
          />
          <Input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full h-14 bg-transparent border-white/10 hover:border-white/30 text-white placeholder:text-zinc-500 text-base rounded-[1.25rem] px-5 focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/30 transition-all font-light"
            placeholder="Нууц үг давтах"
          />

          {formError && (
            <p className="px-2 text-sm font-medium text-red-400/90">{formError}</p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="mt-2 h-14 w-full rounded-full bg-zinc-300 text-lg font-medium text-black transition-colors hover:bg-white disabled:opacity-70"
          >
            {submitting ? <Loader2 className="size-5 animate-spin" /> : "Нууц үг солих"}
          </Button>
        </form>
      </div>
    );
  }

  if (state.status === "reset-done") {
    return (
      <div className="flex w-full flex-col items-center text-center">
        <div className="mb-8 flex size-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
          <CheckCircle2 className="size-9 text-emerald-300" />
        </div>
        <h1 className="text-3xl font-medium text-white">Нууц үг солигдлоо</h1>
        <p className="mt-4 text-sm font-light leading-6 text-zinc-400">
          Шинэ нууц үгээрээ нэвтэрч орно уу.
        </p>
        {primaryLink}
      </div>
    );
  }

  if (state.status === "recovered") {
    return (
      <div className="flex w-full flex-col items-center text-center">
        <div className="mb-8 flex size-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
          <CheckCircle2 className="size-9 text-emerald-300" />
        </div>
        <h1 className="text-3xl font-medium text-white">Имэйл сэргээгдлээ</h1>
        <p className="mt-4 text-sm font-light leading-6 text-zinc-400">
          Таны имэйл хаяг өмнөх төлөвтөө буцлаа. Аюулгүй байдлын үүднээс нууц үгээ солихыг зөвлөж байна.
        </p>
        {primaryLink}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center text-center">
      <div className="mb-8 flex size-20 items-center justify-center rounded-full border border-red-400/30 bg-red-400/10">
        <AlertTriangle className="size-9 text-red-300" />
      </div>
      <h1 className="text-3xl font-medium text-white">Холбоос хүчингүй</h1>
      <p className="mt-4 text-sm font-light leading-6 text-zinc-400">{state.message}</p>
      {primaryLink}
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] p-6 font-sans selection:bg-white/20">
      <div className="w-full max-w-[440px]">
        <Link href="/" className="mb-12 flex items-center justify-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Flame className="size-4 text-pink-300" />
          </span>
          <span className="text-xl font-medium tracking-wide text-white">Lumio</span>
        </Link>

        <Suspense
          fallback={
            <div className="flex justify-center">
              <Loader2 className="size-8 animate-spin text-zinc-500" />
            </div>
          }
        >
          <AuthActionContent />
        </Suspense>
      </div>
    </div>
  );
}
