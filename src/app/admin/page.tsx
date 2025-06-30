'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, waitForAuth } from '@/utils/supabaseClient';
import type { User } from '@supabase/supabase-js';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

interface AdminUser {
  id: string;
  email: string;
  image_analysis_credits: number;
  plan_type: string;
  created_at: string;
  updated_at: string;
  subscriptions?: {
    plan_id: string;
    status: string;
    current_period_end: string;
  };
}

interface AdminStats {
  totalUsers: number;
  totalPrompts: number;
  imagePrompts: number;
  textPrompts: number;
  activeSubscriptions: number;
  newUsersLast30Days: number;
  dailyRegistrations: number[];
  subscriptionDistribution: {
    free: number;
    pro: number;
    enterprise: number;
  };
  lastUpdated: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // UI states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCredits, setEditingCredits] = useState<{ userId: string; credits: number } | null>(null);

  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        console.log('Initializing admin dashboard...');
        
        if (!supabase) {
          throw new Error('Supabase not configured');
        }

        // Wait for auth to be ready
        const { user: currentUser, error: authError } = await waitForAuth(3000);
        
        if (authError) {
          console.error('Auth error:', authError);
          router.push('/login?redirectTo=/admin');
          return;
        }

        if (!currentUser) {
          console.log('No user found, redirecting to login');
          router.push('/login?redirectTo=/admin');
          return;
        }

        console.log('User authenticated:', currentUser.id);
        setUser(currentUser);

        // Check if user is admin (basic email check)
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@garuda-ai.com';
        if (currentUser.email !== adminEmail) {
          setError('Access denied. Admin privileges required.');
          setLoading(false);
          return;
        }

        setIsAuthorized(true);
        await Promise.all([loadStats(), loadUsers(1, '')]);

      } catch (err: any) {
        console.error('Admin initialization error:', err);
        setError(err.message || 'Failed to initialize admin dashboard');
      } finally {
        setLoading(false);
      }
    };

    initializeAdmin();
  }, [router]);

  const loadStats = async () => {
    if (!supabase || !user) return;
    
    setLoadingStats(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load statistics');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err: any) {
      console.error('Load stats error:', err);
      setError(err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadUsers = async (page: number, search: string) => {
    if (!supabase || !user) return;
    
    setLoadingUsers(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load users');
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Load users error:', err);
      setError(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers(1, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadUsers(newPage, searchTerm);
  };

  const handleUpdateCredits = async (userId: string, newCredits: number) => {
    if (!supabase || !user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          credits: newCredits
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update credits');
      }

      // Refresh users list
      await loadUsers(currentPage, searchTerm);
      setEditingCredits(null);
      alert('Credits updated successfully!');
    } catch (err: any) {
      console.error('Update credits error:', err);
      alert(`Failed to update credits: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading admin dashboard..." />
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

  const maxDailyRegistrations = Math.max(...(stats?.dailyRegistrations || [1]), 1);

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400">Manage users and monitor system statistics</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => Promise.all([loadStats(), loadUsers(currentPage, searchTerm)])}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🔄 Refresh
              </button>
              <Link 
                href="/" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back to App
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">
                  {loadingStats ? '...' : stats?.totalUsers || 0}
                </p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Prompts</p>
                <p className="text-2xl font-bold text-white">
                  {loadingStats ? '...' : stats?.totalPrompts || 0}
                </p>
              </div>
              <div className="text-3xl">📝</div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pro Subscribers</p>
                <p className="text-2xl font-bold text-white">
                  {loadingStats ? '...' : stats?.activeSubscriptions || 0}
                </p>
              </div>
              <div className="text-3xl">⭐</div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">New Users (30d)</p>
                <p className="text-2xl font-bold text-white">
                  {loadingStats ? '...' : stats?.newUsersLast30Days || 0}
                </p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Registrations Chart */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-4">Daily Registrations (7 days)</h3>
            <div className="flex items-end justify-between h-32 gap-2">
              {stats?.dailyRegistrations.map((count, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-red-600 rounded-t transition-all duration-300"
                    style={{ 
                      height: `${(count / maxDailyRegistrations) * 100}%`,
                      minHeight: count > 0 ? '8px' : '4px',
                      backgroundColor: count > 0 ? '#dc2626' : '#374151'
                    }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                  </span>
                  <span className="text-xs text-gray-400">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription Distribution */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-4">Subscription Distribution</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Free</span>
                <span className="text-white font-semibold">
                  {stats?.subscriptionDistribution.free || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Pro</span>
                <span className="text-amber-400 font-semibold">
                  {stats?.subscriptionDistribution.pro || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Enterprise</span>
                <span className="text-purple-400 font-semibold">
                  {stats?.subscriptionDistribution.enterprise || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Users Management */}
        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">User Management</h3>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" text="Loading users..." />
            </div>
          ) : (
            <>
              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="pb-3 text-gray-300">Email</th>
                      <th className="pb-3 text-gray-300">Plan</th>
                      <th className="pb-3 text-gray-300">Credits</th>
                      <th className="pb-3 text-gray-300">Joined</th>
                      <th className="pb-3 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-800">
                        <td className="py-3 text-white">{user.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.plan_type === 'pro' ? 'bg-amber-900 text-amber-300' :
                            user.plan_type === 'enterprise' ? 'bg-purple-900 text-purple-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {user.plan_type?.toUpperCase() || 'FREE'}
                          </span>
                        </td>
                        <td className="py-3">
                          {editingCredits?.userId === user.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editingCredits.credits}
                                onChange={(e) => setEditingCredits({
                                  userId: user.id,
                                  credits: parseInt(e.target.value) || 0
                                })}
                                className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                min="0"
                                max="999999"
                              />
                              <button
                                onClick={() => handleUpdateCredits(user.id, editingCredits.credits)}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingCredits(null)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingCredits({
                                userId: user.id,
                                credits: user.image_analysis_credits
                              })}
                              className="text-amber-400 hover:text-amber-300 transition-colors"
                            >
                              {user.image_analysis_credits}
                            </button>
                          )}
                        </td>
                        <td className="py-3 text-gray-400">
                          {new Date(user.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => setEditingCredits({
                              userId: user.id,
                              credits: user.image_analysis_credits
                            })}
                            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                          >
                            Edit Credits
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-gray-400 text-sm">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers)} of{' '}
                    {pagination.totalUsers} users
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-3 py-2 rounded transition-colors"
                    >
                      Previous
                    </button>
                    <span className="flex items-center px-3 py-2 text-gray-300">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-3 py-2 rounded transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Last updated: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString('id-ID') : 'Never'}</p>
        </div>
      </div>
    </ErrorBoundary>
  );
}