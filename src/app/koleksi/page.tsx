'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, waitForAuth } from '@/utils/supabaseClient';
import type { User } from '@supabase/supabase-js';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

interface SavedPrompt {
  id: string;
  prompt_text: string;
  type: 'image' | 'text';
  created_at: string;
  is_favorite: boolean;
  tags: string[];
}

export default function KoleksiPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'text' | 'favorites'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const initializePage = async () => {
      try {
        console.log('Initializing koleksi page...');
        
        if (!supabase) {
          throw new Error('Supabase not configured');
        }

        // Wait for auth to be ready with timeout
        const { user: currentUser, error: authError } = await waitForAuth(3000);
        
        if (authError) {
          console.error('Auth error:', authError);
          router.push('/login?redirectTo=/koleksi');
          return;
        }

        if (!currentUser) {
          console.log('No user found, redirecting to login');
          router.push('/login?redirectTo=/koleksi');
          return;
        }

        console.log('User authenticated:', currentUser.id);
        setUser(currentUser);
        await loadPrompts(currentUser);
      } catch (err: any) {
        console.error('Page initialization error:', err);
        setError(err.message || 'Gagal memuat halaman');
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [router]);

  const loadPrompts = async (currentUser: User) => {
    try {
      console.log('Loading prompts for user:', currentUser.id);
      
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const response = await fetch('/api/prompts', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized, redirecting to login');
          router.push('/login?redirectTo=/koleksi');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memuat prompt');
      }

      const data = await response.json();
      console.log('Prompts loaded:', data.prompts?.length || 0);
      setPrompts(data.prompts || []);
    } catch (err: any) {
      console.error('Load prompts error:', err);
      setError(err.message || 'Gagal memuat koleksi prompt');
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'favorites' && prompt.is_favorite) ||
                         prompt.type === filter;
    
    const matchesSearch = prompt.prompt_text.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const handleCopyPrompt = async (promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      alert('Prompt berhasil disalin!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Gagal menyalin prompt');
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus prompt ini?');
    if (!confirmed) return;

    try {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session) {
        router.push('/login?redirectTo=/koleksi');
        return;
      }

      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus prompt');
      }

      // Reload prompts
      if (user) {
        await loadPrompts(user);
      }
      alert('Prompt berhasil dihapus!');
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(`Gagal menghapus prompt: ${err.message}`);
    }
  };

  const handleToggleFavorite = async (promptId: string) => {
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session) {
        router.push('/login?redirectTo=/koleksi');
        return;
      }

      const prompt = prompts.find(p => p.id === promptId);
      if (!prompt) return;

      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_favorite: !prompt.is_favorite
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengubah status favorit');
      }

      // Update local state
      setPrompts(prev => prev.map(p => 
        p.id === promptId ? { ...p, is_favorite: !p.is_favorite } : p
      ));
    } catch (err: any) {
      console.error('Toggle favorite error:', err);
      alert(`Gagal mengubah status favorit: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Memuat koleksi..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded">
          <p className="font-semibold">Terjadi Kesalahan</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-gray-400 hover:text-white mb-4 inline-block">
            ← Kembali ke Beranda
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Koleksi Prompt Saya</h1>
          <p className="text-gray-400">Kelola dan atur prompt yang telah Anda simpan</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari prompt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'Semua' },
                { key: 'image', label: 'Gambar' },
                { key: 'text', label: 'Teks' },
                { key: 'favorites', label: 'Favorit' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                    filter === key 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prompts Grid */}
        {filteredPrompts.length === 0 ? (
          <div className="bg-gray-900 p-8 rounded-lg text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-white mb-2">
              {prompts.length === 0 ? 'Belum Ada Prompt Tersimpan' : 'Tidak Ada Hasil'}
            </h3>
            <p className="text-gray-400 mb-6">
              {prompts.length === 0 
                ? 'Mulai buat prompt di halaman utama dan simpan yang terbaik ke koleksi Anda.'
                : 'Coba ubah filter atau kata kunci pencarian Anda.'
              }
            </p>
            <Link 
              href="/" 
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-md transition-colors inline-block"
            >
              Buat Prompt Baru
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <div key={prompt.id} className="bg-gray-900 p-6 rounded-lg hover:bg-gray-800 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    prompt.type === 'image' 
                      ? 'bg-blue-900 text-blue-300' 
                      : 'bg-green-900 text-green-300'
                  }`}>
                    {prompt.type === 'image' ? 'Gambar' : 'Teks'}
                  </span>
                  <button
                    onClick={() => handleToggleFavorite(prompt.id)}
                    className={`text-xl ${prompt.is_favorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'} transition-colors`}
                  >
                    ★
                  </button>
                </div>
                
                <p className="text-gray-300 text-sm mb-4 line-clamp-4">
                  {prompt.prompt_text}
                </p>
                
                <div className="text-xs text-gray-500 mb-4">
                  {new Date(prompt.created_at).toLocaleDateString('id-ID')}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyPrompt(prompt.prompt_text)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded-md transition-colors"
                  >
                    Salin
                  </button>
                  <button
                    onClick={() => handleDeletePrompt(prompt.id)}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold py-2 px-3 rounded-md transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 bg-gray-900 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-white mb-4">Statistik Koleksi</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{prompts.filter(p => p.type === 'image').length}</div>
              <div className="text-sm text-gray-400">Prompt Gambar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{prompts.filter(p => p.type === 'text').length}</div>
              <div className="text-sm text-gray-400">Prompt Teks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{prompts.filter(p => p.is_favorite).length}</div>
              <div className="text-sm text-gray-400">Favorit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{prompts.length}</div>
              <div className="text-sm text-gray-400">Total Prompt</div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}