'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, Images, Users, LogOut, ChevronLeft, Tags } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { Button } from '@/components/ui/button';
import clsx from 'clsx';

const menuItems = [
  {
    label: 'Хяналтын самбар',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Комикууд',
    href: '/admin/comics',
    icon: BookOpen,
  },
  {
    label: 'Нүүрний слайд',
    href: '/admin/carousel',
    icon: Images,
  },
  {
    label: 'Жанрууд',
    href: '/admin/genres',
    icon: Tags,
  },
  {
    label: 'Хэрэглэгчид',
    href: '/admin/users',
    icon: Users,
  },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar = ({ isOpen = true, onClose }: AdminSidebarProps) => {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    logout();
  };

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-[#0c0c0d] transition-transform duration-300',
        {
          '-translate-x-full md:translate-x-0': !isOpen,
          'translate-x-0': isOpen,
        }
      )}
    >

      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-white">Lumio админ</p>
            <p className="text-xs text-white/40">Контент удирдлага</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 hover:bg-white/10 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>


      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>


      <div className="space-y-1 border-t border-white/10 p-3">
        <Link href="/home">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Сайт руу буцах
          </Button>
        </Link>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-red-500 hover:text-red-400"
        >
          <LogOut className="w-4 h-4" />
          Гарах
        </Button>
      </div>
    </aside>
  );
};
