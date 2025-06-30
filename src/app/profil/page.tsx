'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, waitForAuth } from '@/utils/supabaseClient';
import type { User } from '@supabase/supabase-js';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

interface UserProfile {
  id: string;
  email: string;
  image_analysis_credits: number;
  created_at: string;
  updated_at: string;
}

interface ProfileStats {
  totalPrompts: number;
  totalAnalyses: number;
  joinDate: string;
}

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const getProfile = async () => {
      try {
        console.log('Initializing profile page...');
        
        if (!supabase) {
          throw new Error('Supabase not configured');
        }

        // Wait for auth to be ready with timeout
        const { user: currentUser, error: authError } = await waitForAuth(3000);
        
        if (authError) {
          console.error('Auth error:', authError);
          router.push('/login?redirectTo=/profil');
          return;
        }

        if (!currentUser) {
          console.log('No user found, redirecting to login');
          router.push('/login?redirectTo=/profil');
          return;
        }

        console.log('User authenticated:', currentUser.id);
        setUser(currentUser);

        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          throw new Error('Gagal memuat profil pengguna');
        }

        console.log('Profile loaded:', profileData);
        setProfile(profileData);
        setDisplayName(currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || '');

        // Calculate stats
        const joinDate = new Date(profileData.created_at).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Get prompts count
        const { data: { session } } = await supabase.auth.getSession();
        let totalPrompts = 0;
        
        if (session) {
          try {
            const response = await fetch('/api/prompts', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              totalPrompts = data.prompts?.length || 0;
            }
          } catch (err) {
            console.error('Failed to fetch prompts count:', err);
          }
        }

        setStats({
          totalPrompts,
          totalAnalyses: Math.max(0, 10 - profileData.image_analysis_credits),
          joinDate
        });

      } catch (err: any) {
        console.error('Profile initialization error:', err);
        setError(err.message || 'Terjadi kesalahan saat memuat profil');
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      if (!supabase || !user) {
        throw new Error('User not authenticated');
      }

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });

      if (updateError) throw updateError;

      setSuccess('Profil berhasil diperbarui!');
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.message || 'Gagal memperbarui profil');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      setUpdating(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      setUpdating(false);
      return;
    }

    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess('Password berhasil diubah!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Change password error:', err);
      setError(err.message || 'Gagal mengubah password');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan dan semua data Anda akan hilang.'
    );

    if (!confirmed) return;

    const doubleConfirm = window.prompt(
      'Ketik "HAPUS AKUN" untuk mengkonfirmasi penghapusan akun:'
    );

    if (doubleConfirm !== 'HAPUS AKUN') {
      alert('Konfirmasi tidak sesuai. Penghapusan akun dibatalkan.');
      return;
    }

    setUpdating(true);
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      // In a real app, you'd call an API endpoint to handle account deletion
      // For now, we'll just sign out the user
      await supabase.auth.signOut();
      router.push('/');
    } catch (err: any) {
      console.error('Delete account error:', err);
      setError('Gagal menghapus akun. Silakan hubungi support.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Memuat profil..." />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Gagal memuat profil pengguna.</p>
        <Link href="/" className="text-red-500 hover:text-red-400 mt-4 inline-block">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-gray-400 hover:text-white mb-4 inline-block">
            ← Kembali ke Beranda
          </Link>
          <h1 className="text-3xl font-bold text-white">Profil Saya</h1>
          <p className="text-gray-400 mt-2">Kelola akun dan preferensi Anda</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-500 text-green-200 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 p-6 rounded-lg">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{displayName}</h2>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>

              {stats && (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-amber-400">{profile.image_analysis_credits}</div>
                    <div className="text-sm text-gray-400">Kredit Analisa Tersisa</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{stats.totalAnalyses}</div>
                    <div className="text-sm text-gray-400">Total Analisa Gambar</div>
                  </div>

                  <div className="text-center p-4 bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{stats.totalPrompts}</div>
                    <div className="text-sm text-gray-400">Prompt Tersimpan</div>
                  </div>

                  <div className="text-center p-4 bg-gray-800 rounded-lg">
                    <div className="text-sm font-semibold text-green-400">Bergabung Sejak</div>
                    <div className="text-sm text-gray-400">{stats.joinDate}</div>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-700">
                <Link 
                  href="/koleksi" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition-colors text-center block"
                >
                  Lihat Koleksi Saya
                </Link>
              </div>
            </div>
          </div>

          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Update Profile */}
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Informasi Profil</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-white mb-1">
                    Nama Tampilan
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Masukkan nama tampilan"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={user.email || ''}
                    disabled
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:cursor-not-allowed"
                >
                  {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Ubah Password</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-white mb-1">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Masukkan password baru"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Konfirmasi password baru"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating || !newPassword || !confirmPassword}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:cursor-not-allowed"
                >
                  {updating ? 'Mengubah...' : 'Ubah Password'}
                </button>
              </form>
            </div>

            {/* Account Management */}
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Pengaturan Akun</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-amber-900/20 border border-amber-500 rounded-lg">
                  <h4 className="font-semibold text-amber-400 mb-2">Upgrade ke Pro</h4>
                  <p className="text-gray-300 text-sm mb-3">
                    Dapatkan kredit analisa gambar unlimited, akses fitur premium, dan dukungan prioritas.
                  </p>
                  <button className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                    Upgrade Sekarang
                  </button>
                </div>

                <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
                  <h4 className="font-semibold text-red-400 mb-2">Zona Bahaya</h4>
                  <p className="text-gray-300 text-sm mb-3">
                    Tindakan berikut akan menghapus akun Anda secara permanen dan tidak dapat dibatalkan.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={updating}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:cursor-not-allowed"
                  >
                    {updating ? 'Menghapus...' : 'Hapus Akun'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}