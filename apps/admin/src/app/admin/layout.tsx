'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, Building2, CreditCard, Zap,
  Star, ScrollText, Settings, LogOut, Shield, Package, FileCode2, LayoutList, Wrench, MessageSquare, BookOpen, HelpCircle
} from 'lucide-react';
import { isAdminAuthenticated, getAdminToken, API_URL } from '@/lib/api';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/businesses', label: 'Businesses', icon: Building2 },
  { href: '/admin/plans', label: 'Plans', icon: Package },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/modules', label: 'Modules', icon: Zap },
  { href: '/admin/sidebar-menus', label: 'Sidebar Menus', icon: LayoutList },
  { href: '/admin/invoice-templates', label: 'Invoice Templates', icon: FileCode2 },
  { href: '/admin/tools', label: 'Tools', icon: Wrench },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/enquiries', label: 'Enquiries', icon: MessageSquare },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen },
  { href: '/admin/faq', label: 'FAQs', icon: HelpCircle },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState('Super Admin');

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace('/login');
      return;
    }
    // Decode name from token
    const token = getAdminToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub) {
          fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(r => r.json())
            .then(data => {
              if (data.data?.user?.name) setAdminName(data.data.user.name);
            })
            .catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  }, [router]);

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <aside className="w-64 flex flex-col border-r border-gray-800 bg-gray-900">
        <div className="flex h-16 items-center gap-3 px-4 border-b border-gray-800">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Yantrix Admin</p>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {NAV.map(item => {
              const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-orange-400' : 'text-gray-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {adminName.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-medium text-gray-300 truncate">{adminName}</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('adminToken');
              localStorage.removeItem('adminRefreshToken');
              window.location.href = '/login';
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
          <h1 className="text-sm font-medium text-gray-400">
            {NAV.find(n => pathname.startsWith(n.href))?.label || 'Admin'}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded-full border border-red-800">SUPER ADMIN</span>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {adminName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

