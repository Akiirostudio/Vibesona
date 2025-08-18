'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function NavBar() {
  const { currentUser, logout, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  console.log('NavBar render:', { currentUser: currentUser?.email, loading });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-white tracking-wide hover:text-purple-300 transition-colors">
            <img src="/brand/vibesona-logo.png" alt="Vibesona" className="w-8 h-8 object-contain" />
            <span>Vibesona</span>
          </Link>
          
          {currentUser && (
            <div className="text-sm text-white/80 flex gap-4">
              <Link href="/playlist" className="hover:text-white transition-colors">Analyzer</Link>
              <Link href="/playlists" className="hover:text-white transition-colors">Playlists</Link>
              <Link href="/studio" className="hover:text-white transition-colors">Studio</Link>
              <Link href="/submissions" className="hover:text-white transition-colors">Submissions</Link>
              <Link href="/tokens" className="hover:text-white transition-colors">Tokens</Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="text-sm text-white/60">Loading...</div>
          ) : currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/80 hidden md:block">
                {currentUser.email}
              </span>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  className="p-2 text-white hover:text-purple-300 transition-colors rounded-lg hover:bg-white/10"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 text-sm text-gray-300 border-b border-white/10">
                        <div className="font-medium text-white">{currentUser.email}</div>
                        <div className="text-xs text-gray-400">Account</div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all duration-200 shadow-lg"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
