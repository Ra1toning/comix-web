'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AdminGuard } from '@/components/shared/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminGuard>
      <div className="relative min-h-dvh bg-[#070709] text-zinc-100 antialiased selection:bg-pink-400/25">

        {/* Ambient орчин — гэрлийн бөмбөлгүүд + нарийн цэгэн тор */}
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-48 size-[560px] rounded-full bg-pink-500/[0.07] blur-[130px]" />
          <div className="absolute -right-32 top-1/4 size-[480px] rounded-full bg-violet-500/[0.06] blur-[130px]" />
          <div className="absolute -bottom-48 left-1/3 size-[520px] rounded-full bg-cyan-400/[0.045] blur-[130px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.035)_1px,transparent_0)] bg-[size:26px_26px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_75%)]" />
        </div>

        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="relative flex min-h-dvh flex-col md:pl-[268px]">
          <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-4 sm:px-6">
              {children}
            </div>
          </main>
        </div>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </AdminGuard>
  );
}
