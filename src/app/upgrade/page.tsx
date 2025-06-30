'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';
import type { User } from '@supabase/supabase-js';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function UpgradePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const initializePage = async () => {
      try {
        if (!supabase) {
          router.push('/login?redirectTo=/upgrade');
          return;
        }

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          router.push('/login?redirectTo=/upgrade');
          return;
        }

        setUser(currentUser);

        // Get user's current credits
        const { data: profile } = await supabase
          .from('profiles')
          .select('image_analysis_credits')
          .eq('id', currentUser.id)
          .single();

        setCredits(profile?.image_analysis_credits || 0);
      } catch (error) {
        console.error('Error initializing upgrade page:', error);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [router]);

  const handleUpgrade = () => {
    // TODO: Integrate with payment gateway
    alert('Fitur pembayaran akan segera hadir! Untuk sementara, hubungi support@garuda-ai.com untuk upgrade manual.');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Memuat informasi akun..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Silakan login terlebih dahulu.</p>
        <Link href="/login" className="text-red-500 hover:text-red-400 mt-4 inline-block">
          Login
        </Link>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-gray-400 hover:text-white mb-4 inline-block">
            ← Kembali ke Beranda
          </Link>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-white mb-4">
            Upgrade ke Pro
          </h1>
          <p className="text-xl text-gray-300">
            Buka potensi penuh kreativitas Anda dengan fitur premium
          </p>
        </div>

        {/* Current Status */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Status Akun Saat Ini</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-amber-400">{credits}</div>
              <div className="text-sm text-gray-400">Kredit Analisa Tersisa</div>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">Gratis</div>
              <div className="text-sm text-gray-400">Paket Aktif</div>
            </div>
            <div className="text-center p-4 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-400">50</div>
              <div className="text-sm text-gray-400">Batas Simpan Prompt</div>
            </div>
          </div>
        </div>

        {/* Upgrade Benefits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Free vs Pro Comparison */}
          <div className="bg-gray-900 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Perbandingan Fitur</h3>
            <div className="space-y-4">
              {[
                { feature: 'Analisa Gambar', free: '10/bulan', pro: 'Unlimited' },
                { feature: 'Simpan Prompt', free: '50 prompt', pro: 'Unlimited' },
                { feature: 'AI Enhancement', free: 'Basic', pro: 'Premium' },
                { feature: 'Export Format', free: 'Text only', pro: 'Multiple formats' },
                { feature: 'Support', free: 'Komunitas', pro: 'Priority' },
                { feature: 'Fitur Beta', free: '❌', pro: '✅' }
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-300">{item.feature}</span>
                  <div className="flex gap-4">
                    <span className="text-gray-400 text-sm w-20 text-right">{item.free}</span>
                    <span className="text-green-400 text-sm w-20 text-right font-semibold">{item.pro}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-gradient-to-br from-red-500/10 to-red-700/10 border border-red-500/20 rounded-2xl p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Paket Pro</h3>
              <div className="mb-4">
                <span className="text-4xl font-extrabold text-white">Rp 49.000</span>
                <span className="text-gray-400 ml-2">/bulan</span>
              </div>
              <p className="text-gray-300">Semua yang Anda butuhkan untuk kreativitas tanpa batas</p>
            </div>

            <ul className="space-y-3 mb-6">
              {[
                'Analisa gambar unlimited',
                'Simpan prompt unlimited',
                'AI Enhancement premium',
                'Export ke berbagai format',
                'Prioritas dukungan',
                'Akses fitur beta terbaru',
                'No ads experience'
              ].map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105"
            >
              🚀 Upgrade Sekarang
            </button>

            <p className="text-center text-gray-400 text-xs mt-4">
              Garansi uang kembali 30 hari • Batalkan kapan saja
            </p>
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-8">
          <h3 className="text-2xl font-bold text-white text-center mb-6">Apa Kata Pengguna Pro</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-gray-300 mb-3">"Dengan paket Pro, saya bisa menganalisa gambar sebanyak yang saya mau. Sangat membantu untuk pekerjaan desain saya!"</p>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <div>
                  <div className="text-white font-semibold">Andi Pratama</div>
                  <div className="text-gray-400 text-sm">Graphic Designer</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-gray-300 mb-3">"Fitur AI Enhancement premium benar-benar game changer. Prompt yang dihasilkan jauh lebih detail dan artistik."</p>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">S</span>
                </div>
                <div>
                  <div className="text-white font-semibold">Sari Dewi</div>
                  <div className="text-gray-400 text-sm">Content Creator</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-gray-900 rounded-2xl p-6">
          <h3 className="text-2xl font-bold text-white text-center mb-6">Pertanyaan Umum</h3>
          <div className="space-y-4">
            <details className="bg-gray-800 rounded-lg p-4">
              <summary className="text-white font-semibold cursor-pointer">Bagaimana cara pembayaran?</summary>
              <p className="text-gray-400 mt-2">Kami menerima berbagai metode pembayaran termasuk kartu kredit, transfer bank, dan e-wallet populer di Indonesia.</p>
            </details>
            <details className="bg-gray-800 rounded-lg p-4">
              <summary className="text-white font-semibold cursor-pointer">Apakah bisa dibatalkan kapan saja?</summary>
              <p className="text-gray-400 mt-2">Ya, Anda dapat membatalkan langganan kapan saja. Akses Pro akan tetap aktif hingga akhir periode billing.</p>
            </details>
            <details className="bg-gray-800 rounded-lg p-4">
              <summary className="text-white font-semibold cursor-pointer">Bagaimana dengan data saya jika downgrade?</summary>
              <p className="text-gray-400 mt-2">Semua prompt yang tersimpan akan tetap aman. Anda hanya akan dibatasi untuk menyimpan prompt baru sesuai limit paket gratis.</p>
            </details>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}