"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Loader2, ArrowLeft, ArrowRight, HelpCircle, Sparkles } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {

      const { useAuthStore } = await import("@/lib/authStore");
      useAuthStore.getState().setLoading(true);

      await signInWithEmailAndPassword(auth, email, password);
      router.push("/home");
    } catch (err: any) {
      setError("Имэйл эсвэл нууц үг буруу байна.");
      const { useAuthStore } = await import("@/lib/authStore");
      useAuthStore.getState().setLoading(false);
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
        <div className="w-full max-w-[460px] flex flex-col">

          <h1 className="text-3xl sm:text-4xl md:text-[2.5rem] font-medium text-white leading-tight mb-12 sm:text-left text-center">
            Тавтай морилно уу
          </h1>


          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="text-zinc-500 text-sm font-light flex items-center gap-3">
              Бүртгэлгүй юу?
              <Link href="/register" className="px-4 py-1.5 rounded-full border border-white/10 bg-transparent text-white font-medium hover:bg-white/5 transition-colors">
                Бүртгүүлэх
              </Link>
            </div>
          </div>


          <form onSubmit={handleLogin} className="space-y-4">

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

            <div className="w-full relative group">
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 sm:h-[60px] bg-transparent border-white/10 hover:border-white/30 text-white placeholder:text-zinc-500 text-base rounded-[1.25rem] pl-5 pr-14 focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/30 transition-all font-light"
                placeholder="Нууц үг"
              />
              <Link href="#" className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors" title="Нууц үг сэргээх">
                <HelpCircle className="w-5 h-5 opacity-70" />
              </Link>
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
                  <span className="absolute left-0 right-0 text-center pointer-events-none">Нэвтрэх</span>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 bg-zinc-900 rounded-full flex items-center justify-center group-hover:scale-[0.95] transition-transform">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </>
              )}
            </Button>
          </form>


          <div className="mt-8 text-[11px] sm:text-xs font-light text-zinc-600 leading-relaxed max-w-sm">
            Үргэлжлүүлснээр та манай <Link href="#" className="underline underline-offset-2 hover:text-zinc-400 transition-colors">Үйлчилгээний нөхцөл</Link>, <Link href="#" className="underline underline-offset-2 hover:text-zinc-400 transition-colors">Нууцлалын бодлого</Link> болон Мэдээлэл ашиглах журмыг хүлээн зөвшөөрч байгаа болно.
          </div>

        </div>
      </div>
    </div>
  );
}
