'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import type { User } from '@supabase/supabase-js';
import LoadingSpinner from './LoadingSpinner';

interface PromptHistoryItem {
  id: string;
  prompt_text: string;
  type: 'image' | 'text';
  created_at: string;
  is_favorite: boolean;
}

interface PromptHistoryProps {
  user: User | null;
  onSelectPrompt: (prompt: string) => void;
}

export default function PromptHistory({ user, onSelectPrompt }: PromptHistoryProps) {
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user || !supabase) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/prompts?limit=10', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gagal memuat riwayat');
      }

      const data = await response.json();
      setHistory(data.prompts || []);
    } catch (err: any) {
      console.error('Load history error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (promptId: string) => {
    if (!user || !supabase) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const prompt = history.find(p => p.id === promptId);
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

      if (response.ok) {
        setHistory(prev => prev.map(p => 
          p.id === promptId ? { ...p, is_favorite: !p.is_favorite } : p
        ));
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="text-lg font-bold text-white mb-2">Riwayat Prompt</h3>
        <p className="text-gray-400 mb-4">Login untuk melihat riwayat prompt Anda</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">📝 Riwayat Prompt</h3>
        <button
          onClick={loadHistory}
          disabled={loading}
          className="text-gray-400 hover:text-white transition-colors"
        >
          🔄
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={loadHistory}
            className="text-red-500 hover:text-red-400 text-sm mt-2"
          >
            Coba Lagi
          </button>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-4">
          <div className="text-2xl mb-2">📭</div>
          <p className="text-gray-400 text-sm">Belum ada riwayat prompt</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {history.map(item => (
            <div
              key={item.id}
              className="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-colors cursor-pointer"
              onClick={() => onSelectPrompt(item.prompt_text)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  item.type === 'image' 
                    ? 'bg-blue-900 text-blue-300' 
                    : 'bg-green-900 text-green-300'
                }`}>
                  {item.type === 'image' ? '🖼️' : '📝'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(item.id);
                  }}
                  className={`text-sm ${
                    item.is_favorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'
                  } transition-colors`}
                >
                  ★
                </button>
              </div>
              
              <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                {item.prompt_text}
              </p>
              
              <div className="text-xs text-gray-500">
                {new Date(item.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}