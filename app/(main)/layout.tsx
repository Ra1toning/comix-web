import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { AuthGuard } from "@/components/shared/AuthGuard"
import { MainRouteFrame } from "@/components/shared/MainRouteFrame"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen overflow-x-hidden bg-[#050505] font-sans text-white antialiased selection:bg-pink-400/25">
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
              backgroundSize: "72px 72px",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-72 bg-linear-to-b from-pink-500/[0.055] to-transparent" />
        </div>

        <Header />
        <MainRouteFrame>{children}</MainRouteFrame>
        <Footer />
      </div>
    </AuthGuard>
  )
}
