'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Don't show nav on login page
  if (pathname === '/login') {
    return (
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="text-xl font-bold text-gray-900">
            JH Knowledge Base
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            JH Knowledge Base
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className={`text-sm ${
                pathname === '/' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Articles
            </Link>
            <Link
              href="/settings"
              className={`text-sm ${
                pathname === '/settings' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
