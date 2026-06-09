'use client';

import { useState } from 'react';
import { AdminGuard } from '@/components/shared/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminGuard>
      <div className="flex min-h-dvh bg-[var(--background)]">

        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />


        <div className="flex min-h-dvh flex-1 flex-col md:ml-64">

          <div className="md:hidden border-b border-white/10 p-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Админ</h1>
          </div>


          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 md:p-8">
              {children}
            </div>
          </main>
        </div>


        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 md:hidden z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </AdminGuard>
  );
}
