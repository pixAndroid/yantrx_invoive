'use client';

import Link from 'next/link';
import { ArrowRight, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { isAuthenticated, getUserData, apiFetch, isSafeImageUrl } from '@/lib/api';

const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/tools', label: 'Tools' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [initials, setInitials] = useState('');
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) return;
    setLoggedIn(true);
    const tokenData = getUserData();
    const displayName = tokenData.name || 'User';
    setInitials(displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2));

    apiFetch('/auth/me')
      .then((res: any) => {
        if (res.data?.user?.name) {
          const name = res.data.user.name;
          setInitials(name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2));
        }
        const biz = res.data?.memberships?.[0]?.business;
        if (biz?.logo && typeof biz.logo === 'string' && isSafeImageUrl(biz.logo)) {
          setBusinessLogo(biz.logo);
        }
        if (biz?.name) setBusinessName(biz.name);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="container-wide">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Y</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Yantrix</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(link => (
                <Link key={link.href} href={link.href} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {loggedIn ? (
                <>
                  <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link href="/dashboard" className="flex-shrink-0">
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-200 hover:ring-indigo-400 transition-all">
                      {businessLogo ? (
                        <img src={businessLogo} alt={businessName || 'Business Logo'} className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-white text-xs font-bold">{initials}</span>
                      )}
                    </div>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2">
                    Log in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    Get Started Free
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} className="block py-2 text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="pt-2 space-y-2">
              {loggedIn ? (
                <Link href="/dashboard" className="flex items-center gap-2 py-2 text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                  <div className="h-7 w-7 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    {businessLogo ? (
                      <img src={businessLogo} alt={businessName || 'Business'} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-white text-xs font-bold">{initials}</span>
                    )}
                  </div>
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="block py-2 text-sm font-medium text-gray-700">Log in</Link>
                  <Link href="/auth/register" className="block rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white">Get Started Free</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="pt-16">
        {children}
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
        <div className="container-wide">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Y</span>
                </div>
                <span className="text-xl font-bold text-white">Yantrix</span>
              </Link>
              <p className="text-sm leading-relaxed mb-3">
                India&apos;s simplest GST billing software. Built for small and medium businesses.
              </p>
              <p className="text-xs">Made with ❤️ in India 🇮🇳</p>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-3">Product</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/tools" className="hover:text-white transition-colors">Free Tools</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-3">Company</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">© {new Date().getFullYear()} Yantrix. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
