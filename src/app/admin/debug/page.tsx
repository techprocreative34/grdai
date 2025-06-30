'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, waitForAuth } from '@/utils/supabaseClient';
import type { User } from '@supabase/supabase-js';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

interface DebugInfo {
  authUsersCount: number;
  profilesCount: number;
  authUsers: Array<{
    id: string;
    email: string;
    created_at: string;
  }>;
  profiles: Array<{
    id: string;
    email: string;
    created_at: string;
  }>;
  missingProfiles: string[];
  orphanedProfiles: string[];
  adminEmail: string;
}

export default function AdminDebugPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const initializeDebug = async () => {
      try {
        console.log('Initializing admin debug...');
        
        if (!supabase) {
          throw new Error('Supabase not configured');
        }

        // Wait for auth to be ready
        const { user: currentUser, error: authError } = await waitForAuth(3000);
        
        if (authError) {
          console.error('Auth error:', authError);
          router.push('/login?redirectTo=/admin/debug');
          return;
        }

        if (!currentUser) {
          console.log('No user found, redirecting to login');
          router.push('/login?redirectTo=/admin/debug');
          return;
        }

        console.log('User authenticated:', currentUser.id);
        setUser(currentUser);

        // Check if user is admin
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@garuda-ai.com';
        if (currentUser.email !== adminEmail) {
          setError('Access denied. Admin privileges required.');
          setLoading(false);
          return;
        }

        setIsAuthorized(true);
        await loadDebugInfo();

      } catch (err: any) {
        console.error('Debug initialization error:', err);
        setError(err.message || 'Failed to initialize debug page');
      } finally {
        setLoading(false);
      }
    };

    initializeDebug();
  }, [router]);

  const loadDebugInfo = async () => {
    if (!supabase || !user) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/debug', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load debug info');
      }

      const data = await response.json();
      setDebugInfo(data.debug);
    } catch (err: any) {
      console.error('Load debug info error:', err);
      setError(err.message);
    }
  };

  const handleSyncProfiles = async () => {
    if (!supabase || !user) return;
    
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/debug', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync profiles');
      }

      const data = await response.json();
      alert(`Success: ${data.message}`);
      
      // Reload debug info
      await loadDebugInfo();
    } catch (err: any) {
      console.error('Sync profiles error:', err);
      alert(`Failed to sync profiles: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading debug info..." />
      </div>
    );
  }

  if (error && !isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-900/20 border border-red-500 text-red-200 px-6 py-8 rounded-lg text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="mb-6">{error}</p>
          <Link 
            href="/" 
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Checking authorization..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Debug</h1>
              <p className="text-gray-400">Debug user synchronization issues</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadDebugInfo}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🔄 Refresh
              </button>
              <Link 
                href="/admin" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Admin
              </Link>
            </div>
          </div>
        </div>

        {debugInfo && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-900 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Auth Users</p>
                    <p className="text-2xl font-bold text-white">{debugInfo.authUsersCount}</p>
                  </div>
                  <div className="text-3xl">🔐</div>
                </div>
              </div>

              <div className="bg-gray-900 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Profiles</p>
                    <p className="text-2xl font-bold text-white">{debugInfo.profilesCount}</p>
                  </div>
                  <div className="text-3xl">👤</div>
                </div>
              </div>

              <div className="bg-gray-900 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Missing Profiles</p>
                    <p className="text-2xl font-bold text-red-400">{debugInfo.missingProfiles.length}</p>
                  </div>
                  <div className="text-3xl">⚠️</div>
                </div>
              </div>

              <div className="bg-gray-900 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Orphaned Profiles</p>
                    <p className="text-2xl font-bold text-yellow-400">{debugInfo.orphanedProfiles.length}</p>
                  </div>
                  <div className="text-3xl">🔗</div>
                </div>
              </div>
            </div>

            {/* Sync Action */}
            {debugInfo.missingProfiles.length > 0 && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-bold text-red-400 mb-2">Synchronization Required</h3>
                <p className="text-gray-300 mb-4">
                  There are {debugInfo.missingProfiles.length} users in auth.users that don't have corresponding profiles. 
                  This will cause them to not appear in the admin dashboard.
                </p>
                <button
                  onClick={handleSyncProfiles}
                  disabled={syncing}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {syncing ? '🔄 Syncing...' : '🔧 Sync Missing Profiles'}
                </button>
              </div>
            )}

            {/* Admin Email Info */}
            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-bold text-white mb-4">Admin Configuration</h3>
              <div className="bg-gray-800 p-4 rounded">
                <p className="text-gray-300">
                  <strong>Admin Email:</strong> <code className="text-amber-400">{debugInfo.adminEmail}</code>
                </p>
              </div>
            </div>

            {/* Detailed Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Auth Users */}
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Auth Users ({debugInfo.authUsersCount})</h3>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="pb-2 text-gray-300">Email</th>
                        <th className="pb-2 text-gray-300">Created</th>
                        <th className="pb-2 text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debugInfo.authUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-800">
                          <td className="py-2 text-white">{user.email}</td>
                          <td className="py-2 text-gray-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2">
                            {debugInfo.missingProfiles.includes(user.id) ? (
                              <span className="text-red-400">Missing Profile</span>
                            ) : (
                              <span className="text-green-400">Has Profile</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Profiles */}
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Profiles ({debugInfo.profilesCount})</h3>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="pb-2 text-gray-300">Email</th>
                        <th className="pb-2 text-gray-300">Created</th>
                        <th className="pb-2 text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debugInfo.profiles.map((profile) => (
                        <tr key={profile.id} className="border-b border-gray-800">
                          <td className="py-2 text-white">{profile.email}</td>
                          <td className="py-2 text-gray-400">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2">
                            {debugInfo.orphanedProfiles.includes(profile.id) ? (
                              <span className="text-yellow-400">Orphaned</span>
                            ) : (
                              <span className="text-green-400">Valid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}