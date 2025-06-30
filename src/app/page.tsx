'use client';
import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabaseClient';

// Impor semua komponen yang kita butuhkan
import ImagePromptForm from '@/components/ImagePromptForm';
import TextPromptForm from '@/components/TextPromptForm';
import ImageToPromptForm from '@/components/ImageToPromptForm';
import PromptOutput from '@/components/PromptOutput';
import SuggestionGallery from '@/components/SuggestionGallery';
import PromptTemplates from '@/components/PromptTemplates';
import PromptHistory from '@/components/PromptHistory';
import UsageAnalytics from '@/components/UsageAnalytics';
import QuickActions from '@/components/QuickActions';

// Impor utilitas dan data tambahan
import { IndonesianPromptEnhancer } from '@/utils/promptEnhancer';
import ideaStarters from '@/data/ideaStarters.json';

type GeneratorMode = 'image' | 'text' | 'image_to_prompt';

export default function Home() {
  // State untuk UI
  const [mode, setMode] = useState<GeneratorMode>('image');
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // State untuk otentikasi dan data pengguna
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  const fetchCredits = useCallback(async (user: User) => {
    if (!supabase) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('image_analysis_credits')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error("Gagal mengambil profil kredit:", error.message);
        setCredits(null);
      } else {
        setCredits(profile?.image_analysis_credits ?? 0);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
      setCredits(null);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setCredits(null);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user;
      setUser(currentUser ?? null);
      if (currentUser) {
        await fetchCredits(currentUser);
      } else {
        setCredits(null);
      }
    });
    return () => { subscription.unsubscribe(); };
  }, [fetchCredits]);

  // Check for shared prompt in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedPrompt = urlParams.get('shared');
    if (sharedPrompt) {
      setGeneratedPrompt(decodeURIComponent(sharedPrompt));
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGeneratePrompt = () => {
    // CHECK: Require login for prompt generation
    if (!user) {
      alert("Silakan login atau daftar terlebih dahulu untuk menggunakan fitur generator prompt. Daftar gratis dan mulai berkreasi sekarang!");
      return;
    }

    setIsLoading(true);
    let basePrompt = '';
    
    try {
      if (mode === 'image') {
        const { subject, style, artistStyle, details, aspectRatio } = formData;
        const promptParts = [ 
          subject, 
          details, 
          style ? `dalam gaya ${style}` : '', 
          artistStyle ? `terinspirasi oleh ${artistStyle}` : '' 
        ];
        basePrompt = promptParts.filter(Boolean).join(', ');
        
        let finalPrompt = basePrompt;
        if (basePrompt) {
          finalPrompt = IndonesianPromptEnhancer.enhance(basePrompt);
          if (aspectRatio) {
              finalPrompt += `, ${aspectRatio.split(' ')[0]}`;
          }
        }
        setGeneratedPrompt(finalPrompt);

      } else {
        const { task, topic, tone, audience, length } = formData;
        const prompt = `${task || 'Tulis sebuah teks'} tentang "${topic || 'topik yang menarik'}". Gunakan gaya bahasa yang ${tone || 'netral'}. Target pembacanya adalah ${audience || 'audiens umum'}. Panjang kontennya ${length || 'sedang'}.`;
        setGeneratedPrompt(prompt);
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      alert('Terjadi kesalahan saat membuat prompt. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdeaGenerator = () => {
    // CHECK: Require login for idea generation
    if (!user) {
      alert("Silakan login atau daftar terlebih dahulu untuk menggunakan fitur generator ide. Daftar gratis dan dapatkan inspirasi tak terbatas!");
      return;
    }

    try {
      if (mode === 'image') {
          const ideas = ideaStarters.image;
          const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
          setFormData(randomIdea as { [key: string]: string });
      } else {
          const ideas = ideaStarters.text;
          const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
          setFormData(randomIdea);
      }
      setGeneratedPrompt('');
    } catch (error) {
      console.error('Error generating idea:', error);
      alert('Terjadi kesalahan saat membuat ide. Silakan coba lagi.');
    }
  };

  const handleClearForm = () => {
    setFormData({});
    setGeneratedPrompt('');
  };

  const handleImageUpload = async (file: File) => {
    if (!user) { 
      alert("Silakan login atau daftar terlebih dahulu untuk menggunakan fitur analisa gambar. Daftar gratis dan dapatkan 10 kredit analisa!"); 
      return; 
    }
    
    if (!supabase) {
      alert("Konfigurasi database diperlukan untuk fitur ini.");
      return;
    }

    setIsAnalyzing(true);
    setGeneratedPrompt('');
    
    try {
      // Get the current session to obtain the access token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error("Tidak dapat mengambil sesi pengguna. Silakan login ulang.");
      }

      const bodyFormData = new FormData();
      bodyFormData.append('image', file);
      
      const response = await fetch('/api/analyze-image', { 
        method: 'POST', 
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: bodyFormData 
      });
      
      const data = await response.json();
      if (!response.ok) {
          if (response.status === 402) { 
            alert("Yah, kuota gratis Anda untuk analisa gambar bulan ini sudah habis. Upgrade ke Pro untuk analisa tanpa batas!"); 
          } else { 
            throw new Error(data.error || "Gagal menganalisa gambar."); 
          }
      } else {
          setGeneratedPrompt(data.generatedPrompt);
          await fetchCredits(user);
      }
    } catch (error: any) {
        console.error('Image analysis error:', error);
        alert(`Terjadi kesalahan: ${error.message}`);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleEnhanceWithAI = async () => {
    // CHECK: Require login for AI enhancement
    if (!user) {
      alert("Silakan login atau daftar terlebih dahulu untuk menggunakan fitur AI Enhancement. Daftar gratis dan tingkatkan kualitas prompt Anda!");
      return;
    }

    if (!generatedPrompt) { 
      alert("Generate sebuah prompt dasar terlebih dahulu."); 
      return; 
    }
    
    setIsEnhancing(true);
    try {
        const response = await fetch('/api/enhance-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: generatedPrompt }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Gagal menyempurnakan prompt dengan AI.');
        }
        
        const data = await response.json();
        setGeneratedPrompt(data.enhancedPrompt);
    } catch (error: any) {
        console.error('AI enhancement error:', error);
        alert(`Terjadi kesalahan saat menghubungi AI: ${error.message}`);
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleSelectSuggestion = (prompt: string, type: 'image' | 'text') => {
    setMode(type);
    setGeneratedPrompt(prompt);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTemplate = (prompt: string) => {
    setGeneratedPrompt(prompt);
    setShowTemplates(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSavePrompt = async () => {
    if (!user) {
        alert("Silakan login atau daftar terlebih dahulu untuk menyimpan prompt. Daftar gratis dan kelola koleksi prompt Anda!");
        return;
    }
    
    if (!generatedPrompt) {
        alert("Tidak ada prompt untuk disimpan.");
        return;
    }

    if (!supabase) {
        alert("Konfigurasi database diperlukan untuk menyimpan prompt.");
        return;
    }

    setIsSaving(true);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert("Sesi tidak valid. Silakan login ulang.");
            return;
        }

        const response = await fetch('/api/prompts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt_text: generatedPrompt,
                type: mode === 'image_to_prompt' ? 'image' : mode,
                tags: []
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Gagal menyimpan prompt');
        }

        alert("Prompt berhasil disimpan ke koleksi Anda!");
    } catch (error: any) {
        console.error('Save prompt error:', error);
        alert(`Gagal menyimpan prompt: ${error.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  const activeButtonStyle = "bg-red-600 text-white";
  const inactiveButtonStyle = "bg-gray-700 hover:bg-gray-600";

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-white mb-2">
          Garuda AI Prompt Generator
        </h1>
        <p className="text-lg text-gray-300">
          Wujudkan imajinasi Anda dengan prompt sempurna bercita rasa Indonesia.
        </p>
        {!user && (
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500 rounded-lg max-w-2xl mx-auto">
            <p className="text-blue-200">
              💡 <strong>Daftar gratis untuk menggunakan semua fitur!</strong> Login untuk generate prompt, analisa gambar, dan simpan koleksi Anda.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-4 mb-8">
        <button 
          onClick={() => setMode('image')} 
          className={`px-6 py-2 font-semibold rounded-md transition-all ${mode === 'image' ? activeButtonStyle : inactiveButtonStyle}`}
        >
          Generator Gambar
        </button>
        <button 
          onClick={() => setMode('text')} 
          className={`px-6 py-2 font-semibold rounded-md transition-all ${mode === 'text' ? activeButtonStyle : inactiveButtonStyle}`}
        >
          Generator Teks
        </button>
        <button 
          onClick={() => setMode('image_to_prompt')} 
          className={`px-6 py-2 font-semibold rounded-md transition-all ${mode === 'image_to_prompt' ? activeButtonStyle : inactiveButtonStyle}`}
        >
          Analisa Gambar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Generator Section */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg flex flex-col">
              <div className="flex-grow">
                {mode === 'image' ? (
                  <ImagePromptForm formState={formData} onFormChange={handleFormChange} />
                ) : mode === 'text' ? (
                  <TextPromptForm formState={formData} onFormChange={handleFormChange} />
                ) : (
                  <ImageToPromptForm 
                    onImageUploaded={handleImageUpload} 
                    isAnalyzing={isAnalyzing} 
                    credits={credits} 
                  />
                )}
              </div>
              {(mode === 'image' || mode === 'text') && (
                <div className="mt-6 space-y-4">
                  <button 
                    onClick={handleIdeaGenerator} 
                    type="button" 
                    className="w-full px-6 py-2 font-semibold rounded-md transition-all bg-gray-700 text-amber-400 hover:bg-gray-600 flex items-center justify-center"
                  >
                    🎲 Beri Saya Ide!
                  </button>
                  <button 
                    onClick={handleGeneratePrompt} 
                    disabled={isLoading} 
                    className="w-full px-6 py-3 font-bold rounded-md transition-all bg-gradient-to-r from-red-500 to-red-700 text-white disabled:bg-gray-600 hover:scale-105 disabled:hover:scale-100"
                  >
                    {isLoading ? 'Membuat...' : 'Generate Prompt'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg flex flex-col">
              <PromptOutput 
                prompt={generatedPrompt} 
                isLoading={isLoading || isAnalyzing || isEnhancing || isSaving} 
                onSave={handleSavePrompt} 
                user={user}
                isSaving={isSaving}
              />
              {mode === 'image' && (
                <div className="border-t border-gray-700 mt-6 pt-6">
                  <h3 className="text-xl font-bold text-amber-400">Penyempurnaan AI ✨</h3>
                  <p className="text-gray-400 mt-1 mb-4">
                    Gunakan Gemini untuk membuat prompt Anda lebih detail dan artistik.
                  </p>
                  <button
                    onClick={handleEnhanceWithAI}
                    disabled={isEnhancing || !generatedPrompt}
                    className="w-full px-6 py-3 font-bold rounded-md transition-all bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 disabled:bg-gray-600 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
                  >
                    {isEnhancing ? '🤖 AI Sedang Berpikir...' : '✨ Sempurnakan dengan AI'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <QuickActions
            user={user}
            onGenerateIdea={handleIdeaGenerator}
            onOpenTemplates={() => setShowTemplates(true)}
            onClearForm={handleClearForm}
            onSaveCurrentPrompt={handleSavePrompt}
            currentPrompt={generatedPrompt}
          />
          
          <PromptHistory 
            user={user} 
            onSelectPrompt={setGeneratedPrompt} 
          />
          
          <UsageAnalytics user={user} />
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Template Prompt</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <PromptTemplates onSelectTemplate={handleSelectTemplate} />
            </div>
          </div>
        </div>
      )}

      <SuggestionGallery onSelectSuggestion={handleSelectSuggestion} />
    </div>
  );
}