'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import type { User } from '@supabase/supabase-js';
import LoadingSpinner from './LoadingSpinner';
import Link from 'next/link';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Pages that don't require authentication - ADDED '/' for homepage
  const publicPages = ['/', '/login', '/pricing'];
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setAuthChecked(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        // Only redirect to login if it's NOT a public page and user is not authenticated
        if (requireAuth && !isPublicPage && !session?.user) {
          router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setUser(session?.user ?? null);
      
      // Only redirect if it's not a public page and user is not authenticated
      if (requireAuth && !isPublicPage && !session?.user && authChecked) {
        router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname, requireAuth, isPublicPage, authChecked]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  // If auth is required but user is not logged in and it's not a public page
  if (requireAuth && !user && !isPublicPage && !loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-4">Login Required</h1>
          <p className="text-gray-400 mb-6">
            You need to be logged in to access Garuda AI. Please sign in to continue.
          </p>
          <div className="space-y-4">
            <Link 
              href={`/login?redirectTo=${encodeURIComponent(pathname)}`}
              className="block bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Sign In to Continue
            </Link>
            <Link 
              href="/pricing" 
              className="block text-gray-400 hover:text-white transition-colors"
            >
              Learn More About Garuda AI
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}