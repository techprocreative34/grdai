// src/components/SuggestionGallery.tsx
'use client';
import { useEffect, useState } from 'react';

type Suggestion = {
  id: string;
  prompt_text: string;
  type: 'image' | 'text';
};

interface SuggestionGalleryProps {
  onSelectSuggestion: (prompt: string, type: 'image' | 'text') => void;
}

export default function SuggestionGallery({ onSelectSuggestion }: SuggestionGalleryProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch('/api/enhance-prompt/get-suggestions');
        if (!response.ok) {
          throw new Error("Gagal memuat sugesti dari komunitas");
        }
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (error: any) {
        console.error('Fetch suggestions error:', error);
        setError(error.message || 'Gagal memuat sugesti');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestions();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-gray-400 mt-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-64 mx-auto mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800 p-4 rounded-lg h-48">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-gray-400 mt-8">
        <p>⚠️ {error}</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-center text-white mb-6">✨ Inspirasi dari Komunitas ✨</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map((s) => (
          <div 
            key={s.id} 
            className="bg-gray-800 p-4 rounded-lg flex flex-col justify-between h-48 group hover:bg-gray-700 transition-colors cursor-pointer"
            onClick={() => onSelectSuggestion(s.prompt_text, s.type)}
          >
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  s.type === 'image' 
                    ? 'bg-blue-900 text-blue-300' 
                    : 'bg-green-900 text-green-300'
                }`}>
                  {s.type === 'image' ? '🖼️ Gambar' : '📝 Teks'}
                </span>
              </div>
              <p className="text-gray-300 text-sm line-clamp-5 leading-relaxed">
                {s.prompt_text}
              </p>
            </div>
            <button 
              className="w-full text-center bg-red-600 text-white font-semibold py-2 rounded-md mt-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
              onClick={(e) => {
                e.stopPropagation();
                onSelectSuggestion(s.prompt_text, s.type);
              }}
            >
              🚀 Gunakan Prompt Ini
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}