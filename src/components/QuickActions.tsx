'use client';
import { useState } from 'react';
import type { User } from '@supabase/supabase-js';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  requiresAuth?: boolean;
  isPro?: boolean;
}

interface QuickActionsProps {
  user: User | null;
  onGenerateIdea: () => void;
  onOpenTemplates: () => void;
  onClearForm: () => void;
  onSaveCurrentPrompt: () => void;
  currentPrompt: string;
}

export default function QuickActions({ 
  user, 
  onGenerateIdea, 
  onOpenTemplates, 
  onClearForm, 
  onSaveCurrentPrompt,
  currentPrompt 
}: QuickActionsProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const quickActions: QuickAction[] = [
    {
      id: 'random-idea',
      title: 'Ide Acak',
      description: 'Generate ide prompt secara acak',
      icon: '🎲',
      action: onGenerateIdea
    },
    {
      id: 'templates',
      title: 'Template',
      description: 'Pilih dari template siap pakai',
      icon: '📋',
      action: onOpenTemplates
    },
    {
      id: 'clear-form',
      title: 'Reset Form',
      description: 'Bersihkan semua input form',
      icon: '🗑️',
      action: onClearForm
    },
    {
      id: 'save-prompt',
      title: 'Simpan Prompt',
      description: 'Simpan prompt saat ini ke koleksi',
      icon: '💾',
      action: onSaveCurrentPrompt,
      requiresAuth: true
    },
    {
      id: 'copy-prompt',
      title: 'Salin Prompt',
      description: 'Salin prompt ke clipboard',
      icon: '📋',
      action: () => {
        if (currentPrompt) {
          navigator.clipboard.writeText(currentPrompt);
          // Show success feedback
          setShowTooltip('copy-success');
          setTimeout(() => setShowTooltip(null), 2000);
        }
      }
    },
    {
      id: 'share-prompt',
      title: 'Bagikan',
      description: 'Bagikan prompt via link',
      icon: '🔗',
      action: () => {
        if (currentPrompt) {
          const shareUrl = `${window.location.origin}?shared=${encodeURIComponent(currentPrompt)}`;
          navigator.clipboard.writeText(shareUrl);
          setShowTooltip('share-success');
          setTimeout(() => setShowTooltip(null), 2000);
        }
      }
    }
  ];

  const handleAction = (action: QuickAction) => {
    if (action.requiresAuth && !user) {
      alert('Silakan login terlebih dahulu untuk menggunakan fitur ini.');
      return;
    }

    if (action.isPro && user) {
      // TODO: Check if user has pro subscription
      alert('Fitur ini tersedia untuk pengguna Pro. Upgrade sekarang!');
      return;
    }

    action.action();
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h3 className="text-lg font-bold text-white mb-4">⚡ Aksi Cepat</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {quickActions.map(action => (
          <div key={action.id} className="relative">
            <button
              onClick={() => handleAction(action)}
              onMouseEnter={() => setShowTooltip(action.id)}
              onMouseLeave={() => setShowTooltip(null)}
              disabled={action.id === 'save-prompt' && !currentPrompt}
              className={`w-full p-3 rounded-lg transition-all duration-200 ${
                action.id === 'save-prompt' && !currentPrompt
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-800 hover:bg-gray-700 text-white hover:scale-105'
              } ${action.requiresAuth && !user ? 'border border-amber-500/30' : ''}`}
            >
              <div className="text-2xl mb-1">{action.icon}</div>
              <div className="text-sm font-medium">{action.title}</div>
            </button>

            {/* Tooltip */}
            {showTooltip === action.id && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap z-10">
                {action.description}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-700"></div>
              </div>
            )}

            {/* Success feedback */}
            {showTooltip === 'copy-success' && action.id === 'copy-prompt' && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-green-600 text-white text-xs rounded-lg whitespace-nowrap z-10">
                ✅ Prompt disalin!
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-green-600"></div>
              </div>
            )}

            {showTooltip === 'share-success' && action.id === 'share-prompt' && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg whitespace-nowrap z-10">
                🔗 Link disalin!
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-blue-600"></div>
              </div>
            )}

            {/* Pro badge */}
            {action.isPro && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 text-xs font-bold px-1 py-0.5 rounded">
                PRO
              </div>
            )}

            {/* Auth required indicator */}
            {action.requiresAuth && !user && (
              <div className="absolute -top-1 -right-1 bg-amber-500 text-gray-900 text-xs font-bold px-1 py-0.5 rounded">
                🔒
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pro upgrade prompt */}
      {!user && (
        <div className="mt-4 p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-amber-400 text-sm text-center">
            🔒 Login untuk akses fitur lengkap dan simpan prompt Anda
          </p>
        </div>
      )}
    </div>
  );
}