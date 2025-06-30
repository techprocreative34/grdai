'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import type { User } from '@supabase/supabase-js';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        // Check if user is admin
        if (currentUser) {
          const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@garuda-ai.com';
          setIsAdmin(currentUser.email === adminEmail);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      
      // Check if user is admin
      if (currentUser) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@garuda-ai.com';
        setIsAdmin(currentUser.email === adminEmail);
      } else {
        setIsAdmin(false);
      }
      
      // Close mobile menu on auth change
      setMenuOpen(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (!supabase) return;
    
    try {
      await supabase.auth.signOut();
      setMenuOpen(false);
      // Force page refresh to clear any cached state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getDisplayName = (user: User) => {
    return user.user_metadata?.display_name || 
           user.email?.split('@')[0] || 
           'User';
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (menuOpen && !target.closest('.user-menu')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="bg-gray-900 text-white shadow-md">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-white">
          Garuda AI
        </Link>
        
        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
            Harga
          </Link>
          {user && (
            <>
              <Link href="/koleksi" className="text-gray-300 hover:text-white transition-colors">
                Koleksiku
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-purple-400 hover:text-purple-300 transition-colors font-semibold">
                  🛠️ Admin
                </Link>
              )}
              <Link href="/upgrade" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 px-3 py-1 rounded-md text-sm font-semibold hover:from-amber-600 hover:to-yellow-600 transition-colors">
                ⭐ Upgrade Pro
              </Link>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-4 h-8">
          {loading ? (
            <div className="h-full w-36 bg-gray-700 rounded-md animate-pulse"></div>
          ) : user ? (
            <div className="relative user-menu">
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/profil" className="text-gray-300 hover:text-white transition-colors">
                  Profil
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="bg-red-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {getDisplayName(user).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <svg 
                    className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Mobile Dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
                    <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                      <div className="font-semibold">{getDisplayName(user)}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                    <Link 
                      href="/pricing" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors md:hidden"
                      onClick={() => setMenuOpen(false)}
                    >
                      Harga
                    </Link>
                    <Link 
                      href="/upgrade" 
                      className="block px-4 py-2 text-sm text-amber-400 hover:bg-gray-700 hover:text-amber-300 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      ⭐ Upgrade Pro
                    </Link>
                    <Link 
                      href="/profil" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profil
                    </Link>
                    <Link 
                      href="/koleksi" 
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      Koleksiku
                    </Link>
                    {isAdmin && (
                      <Link 
                        href="/admin" 
                        className="block px-4 py-2 text-sm text-purple-400 hover:bg-gray-700 hover:text-purple-300 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        🛠️ Admin Dashboard
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors hidden md:block">
                Harga
              </Link>
              <Link href="/login" className="bg-red-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700 transition-colors">
                Login
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}