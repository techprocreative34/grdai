import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface PromptOutputProps {
  prompt: string;
  isLoading: boolean;
  onSave?: () => void;
  user?: any;
  isSaving?: boolean;
}

export default function PromptOutput({ prompt, isLoading, onSave, user, isSaving = false }: PromptOutputProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = async () => {
    if (!prompt) return;
    
    try {
      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(prompt);
        setCopied(true);
        setCopyError(false);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = prompt;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopied(true);
          setCopyError(false);
        } else {
          throw new Error('Copy command failed');
        }
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopyError(true);
      setCopied(false);
    }
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    if (copyError) {
      const timer = setTimeout(() => setCopyError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [copyError]);

  useEffect(() => {
    setCopied(false);
    setCopyError(false);
  }, [prompt]);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-white">Hasil Prompt</h2>
      <div className="bg-gray-800 p-4 rounded-md flex-grow h-64 relative min-h-[20rem]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Menyusun imajinasi..." />
          </div>
        ) : (
          <pre className="whitespace-pre-wrap text-gray-300 text-sm h-full overflow-y-auto">
            <code>{prompt || "Hasil prompt Anda akan muncul di sini setelah Anda menekan tombol 'Generate'."}</code>
          </pre>
        )}
      </div>
      
      <div className="space-y-2">
        <button
          onClick={handleCopy}
          disabled={!prompt || isLoading}
          className="w-full flex items-center justify-center px-6 py-3 font-semibold rounded-md transition-all bg-red-600 text-white disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-red-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {copied ? '✅ Tersalin!' : copyError ? '❌ Gagal Menyalin' : '📋 Salin Prompt'}
        </button>
        
        {copyError && (
          <p className="text-red-400 text-sm text-center">
            Gagal menyalin. Silakan pilih teks secara manual.
          </p>
        )}
        
        {onSave && user && (
          <button
            onClick={onSave}
            disabled={!prompt || isLoading || isSaving}
            className="w-full flex items-center justify-center px-6 py-2 font-semibold rounded-md transition-all bg-gray-700 text-gray-300 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {isSaving ? '💾 Menyimpan...' : '💾 Simpan ke Koleksi'}
          </button>
        )}
      </div>
    </div>
  );
}