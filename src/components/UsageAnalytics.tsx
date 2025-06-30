'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import type { User } from '@supabase/supabase-js';
import LoadingSpinner from './LoadingSpinner';

interface UsageStats {
  totalPrompts: number;
  imagePrompts: number;
  textPrompts: number;
  favoritePrompts: number;
  imageAnalysisUsed: number;
  imageAnalysisRemaining: number;
  joinDate: string;
  lastActivity: string;
  weeklyActivity: number[];
  popularTags: { tag: string; count: number }[];
}

interface UsageAnalyticsProps {
  user: User | null;
}

export default function UsageAnalytics({ user }: UsageAnalyticsProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user || !supabase) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Get prompts data
      const response = await fetch('/api/prompts', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gagal memuat statistik');
      }

      const data = await response.json();
      const prompts = data.prompts || [];

      // Calculate stats
      const totalPrompts = prompts.length;
      const imagePrompts = prompts.filter((p: any) => p.type === 'image').length;
      const textPrompts = prompts.filter((p: any) => p.type === 'text').length;
      const favoritePrompts = prompts.filter((p: any) => p.is_favorite).length;
      const imageAnalysisUsed = Math.max(0, 10 - (profile?.image_analysis_credits || 0));
      const imageAnalysisRemaining = profile?.image_analysis_credits || 0;

      // Calculate weekly activity (last 7 days)
      const weeklyActivity = Array(7).fill(0);
      const now = new Date();
      prompts.forEach((prompt: any) => {
        const promptDate = new Date(prompt.created_at);
        const daysDiff = Math.floor((now.getTime() - promptDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff < 7) {
          weeklyActivity[6 - daysDiff]++;
        }
      });

      // Calculate popular tags
      const tagCounts: { [key: string]: number } = {};
      prompts.forEach((prompt: any) => {
        if (prompt.tags && Array.isArray(prompt.tags)) {
          prompt.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
      
      const popularTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const lastActivity = prompts.length > 0 
        ? new Date(prompts[0].created_at).toLocaleDateString('id-ID')
        : 'Belum ada aktivitas';

      setStats({
        totalPrompts,
        imagePrompts,
        textPrompts,
        favoritePrompts,
        imageAnalysisUsed,
        imageAnalysisRemaining,
        joinDate: new Date(profile?.created_at || user.created_at).toLocaleDateString('id-ID'),
        lastActivity,
        weeklyActivity,
        popularTags
      });

    } catch (err: any) {
      console.error('Load stats error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-bold text-white mb-2">Analitik Penggunaan</h3>
        <p className="text-gray-400">Login untuk melihat statistik penggunaan Anda</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner size="lg" text="Memuat statistik..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-red-400 mb-2">Gagal Memuat Statistik</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={loadStats}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const maxActivity = Math.max(...stats.weeklyActivity, 1);

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">📊 Analitik Penggunaan</h3>
        <button
          onClick={loadStats}
          className="text-gray-400 hover:text-white transition-colors"
        >
          🔄
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.totalPrompts}</div>
          <div className="text-sm text-gray-400">Total Prompt</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.imagePrompts}</div>
          <div className="text-sm text-gray-400">Prompt Gambar</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.textPrompts}</div>
          <div className="text-sm text-gray-400">Prompt Teks</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.favoritePrompts}</div>
          <div className="text-sm text-gray-400">Favorit</div>
        </div>
      </div>

      {/* Image Analysis Usage */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h4 className="text-white font-semibold mb-3">🔍 Penggunaan Analisa Gambar</h4>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Digunakan: {stats.imageAnalysisUsed}/10</span>
          <span className="text-gray-400 text-sm">Tersisa: {stats.imageAnalysisRemaining}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-red-500 to-red-700 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(stats.imageAnalysisUsed / 10) * 100}%` }}
          ></div>
        </div>
        {stats.imageAnalysisRemaining <= 2 && (
          <p className="text-amber-400 text-xs mt-2">
            ⚠️ Kuota hampir habis! Upgrade ke Pro untuk analisa unlimited.
          </p>
        )}
      </div>

      {/* Weekly Activity */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h4 className="text-white font-semibold mb-3">📈 Aktivitas 7 Hari Terakhir</h4>
        <div className="flex items-end justify-between h-16 gap-1">
          {stats.weeklyActivity.map((count, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-red-600 rounded-t transition-all duration-300"
                style={{ 
                  height: `${(count / maxActivity) * 100}%`,
                  minHeight: count > 0 ? '4px' : '2px',
                  backgroundColor: count > 0 ? '#dc2626' : '#374151'
                }}
              ></div>
              <span className="text-xs text-gray-500 mt-1">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Tags */}
      {stats.popularTags.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h4 className="text-white font-semibold mb-3">🏷️ Tag Populer</h4>
          <div className="flex flex-wrap gap-2">
            {stats.popularTags.map(({ tag, count }) => (
              <span 
                key={tag}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
              >
                #{tag} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-3">👤 Info Akun</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Bergabung:</span>
            <span className="text-gray-300">{stats.joinDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Aktivitas Terakhir:</span>
            <span className="text-gray-300">{stats.lastActivity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}