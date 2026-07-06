"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendPasswordReset } from "@/lib/services/firebase-auth";
import { authErrorMessage } from "@/lib/auth-errors";
import Link from "next/link";
import { Loader2, ArrowLeft, ArrowRight, MailCheck } from "lucide-react";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      // user-not-found үед ч амжилттай мэт харуулж имэйл байгаа эсэхийг задруулахгүй.
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (code === "auth/user-not-found") {
        setSent(true);
      } else {
        setError(authErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] flex font-sans selection:bg-white/20">

      <div className="hidden lg:flex w-1/2 relative bg-[#0a0a0a] overflow-hidden border-r border-white/5">
        <Image
          src="/landing/left.png"
          alt="Hero background cover"
          fill
          className="object-cover opacity-80"
        />

        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

        <Link href="/" className="absolute top-10 left-10 flex items-center gap-2 z-10 transition-opacity hover:opacity-80">
          <span className="text-white font-medium text-xl md:text-2xl tracking-wide flex items-center gap-2 drop-shadow-md">
            Lumio
          </span>
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent opacity-60" />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-20 relative">
        {sent ? (
          <div className="w-full max-w-[460px] flex flex-col items-center text-center">
            <div className="mb-8 flex size-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10">
              <MailCheck className="size-9 text-emerald-300" />
            </div>
            <h1 className="text-3xl font-medium text-white">Имэйлээ шалгана уу</h1>
            <p className="mt-4 text-sm font-light leading-6 text-zinc-400">
              Хэрэв <span className="text-white">{email}</span> хаяг бүртгэлтэй бол нууц үг
              сэргээх холбоос илгээгдсэн. Холбоос дээр дарж шинэ нууц үгээ тохируулаарай.
            </p>
            <p className="mt-3 text-xs font-light text-zinc-600">
              Имэйл ирээгүй бол spam хавтсаа шалгаарай.
            </p>
            <Link
              href="/login"
              className="mt-10 flex h-14 w-full items-center justify-center rounded-full bg-zinc-300 text-lg font-medium text-black transition-colors hover:bg-white"
            >
              Нэвтрэх хуудас руу буцах
            </Link>
          </div>
        ) : (
          <div className="w-full max-w-[460px] flex flex-col">

            <h1 className="text-3xl sm:text-4xl md:text-[2.5rem] font-medium text-white leading-tight mb-6 sm:text-left text-center">
              Нууц үг сэргээх
            </h1>
            <p className="mb-12 text-sm font-light leading-6 text-zinc-500">
              Бүртгэлтэй имэйл хаягаа оруулбал нууц үг сэргээх холбоос илгээнэ.
            </p>

            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <Link href="/login" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="text-zinc-500 text-sm font-light flex items-center gap-3">
                Нууц үгээ санав уу?
                <Link href="/login" className="px-4 py-1.5 rounded-full border border-white/10 bg-white border-transparent text-black font-medium hover:bg-zinc-200 transition-colors">
                  Нэвтрэх
                </Link>
              </div>
            </div>

            <form onSubmit={handleReset} className="space-y-4">

              <div className="w-full relative group">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 sm:h-[60px] bg-transparent border-white/10 hover:border-white/30 text-white placeholder:text-zinc-500 text-base rounded-[1.25rem] px-5 focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/30 transition-all font-light"
                  placeholder="Имэйл хаяг"
                />
              </div>

              {error && (
                <div className="text-sm text-red-400/90 font-medium px-2 py-1">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 sm:h-[60px] bg-zinc-300 hover:bg-white text-black rounded-full font-medium text-lg flex items-center justify-center relative transition-colors mt-6 disabled:opacity-70 group"
              >
                {loading ? (
                   <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <>
                    <span className="absolute left-0 right-0 text-center pointer-events-none">Холбоос илгээх</span>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 bg-zinc-900 rounded-full flex items-center justify-center group-hover:scale-[0.95] transition-transform">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </>
                )}
              </Button>
            </form>

          </div>
        )}
      </div>
    </div>
  );
}
