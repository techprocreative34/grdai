'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';
import type { User } from '@supabase/supabase-js';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonStyle: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Gratis',
    price: 0,
    period: 'selamanya',
    features: [
      '10 analisa gambar per bulan',
      'Generator prompt unlimited',
      'Simpan hingga 50 prompt',
      'Akses fitur dasar',
      'Dukungan komunitas'
    ],
    buttonText: 'Mulai Gratis',
    buttonStyle: 'bg-gray-600 hover:bg-gray-700'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49000,
    period: 'per bulan',
    features: [
      'Analisa gambar UNLIMITED',
      'Generator prompt unlimited',
      'Simpan prompt unlimited',
      'AI Enhancement premium',
      'Export ke berbagai format',
      'Prioritas dukungan',
      'Akses fitur beta'
    ],
    popular: true,
    buttonText: 'Upgrade ke Pro',
    buttonStyle: 'bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199000,
    period: 'per bulan',
    features: [
      'Semua fitur Pro',
      'API access dengan rate limit tinggi',
      'Custom branding',
      'Dedicated account manager',
      'SLA 99.9% uptime',
      'Custom integrations',
      'Bulk operations'
    ],
    buttonText: 'Hubungi Sales',
    buttonStyle: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-gray-900'
  }
];

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>('free');

  useEffect(() => {
    const initializePage = async () => {
      try {
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Get user's current plan (for now, everyone is on free)
        if (currentUser) {
          // TODO: Fetch actual plan from database
          setCurrentPlan('free');
        }
      } catch (error) {
        console.error('Error initializing pricing page:', error);
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  const handlePlanSelection = async (planId: string) => {
    if (planId === 'free') {
      if (!user) {
        router.push('/login?redirectTo=/pricing');
        return;
      }
      alert('Anda sudah menggunakan paket gratis!');
      return;
    }

    if (!user) {
      router.push('/login?redirectTo=/pricing');
      return;
    }

    if (planId === 'enterprise') {
      window.open('mailto:sales@garuda-ai.com?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }

    if (planId === 'pro') {
      // TODO: Integrate with payment gateway (Midtrans/Stripe)
      alert('Fitur pembayaran akan segera hadir! Untuk sementara, hubungi support@garuda-ai.com');
      return;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Memuat paket harga..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-white mb-4">
            Pilih Paket yang Tepat
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Mulai gratis dan upgrade kapan saja. Semua paket dirancang untuk membantu kreativitas Anda berkembang.
          </p>
          {!user && (
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500 rounded-lg max-w-2xl mx-auto">
              <p className="text-blue-200">
                💡 <strong>Perlu akun untuk menggunakan Garuda AI.</strong> Daftar gratis untuk mulai berkreasi dengan prompt AI terbaik!
              </p>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-gray-900 rounded-2xl p-8 ${
                plan.popular 
                  ? 'ring-2 ring-red-500 scale-105 shadow-2xl shadow-red-500/20' 
                  : 'hover:bg-gray-800'
              } transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-red-500 to-red-700 text-white px-4 py-2 rounded-full text-sm font-bold">
                    🔥 PALING POPULER
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-extrabold text-white">
                    {plan.price === 0 ? 'Gratis' : `Rp ${plan.price.toLocaleString('id-ID')}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-400 ml-2">/{plan.period}</span>
                  )}
                </div>
                {currentPlan === plan.id && user && (
                  <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Paket Aktif
                  </span>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelection(plan.id)}
                disabled={currentPlan === plan.id && user}
                className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 ${
                  currentPlan === plan.id && user
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : plan.buttonStyle
                } hover:scale-105 disabled:hover:scale-100`}
              >
                {currentPlan === plan.id && user ? 'Paket Aktif' : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-900 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Pertanyaan Umum</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Apakah saya bisa upgrade/downgrade kapan saja?</h3>
              <p className="text-gray-400">Ya, Anda dapat mengubah paket kapan saja. Perubahan akan berlaku pada periode billing berikutnya.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Bagaimana cara pembayaran?</h3>
              <p className="text-gray-400">Kami menerima berbagai metode pembayaran termasuk kartu kredit, transfer bank, dan e-wallet.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Apakah ada garansi uang kembali?</h3>
              <p className="text-gray-400">Ya, kami menawarkan garansi uang kembali 30 hari untuk semua paket berbayar.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Bagaimana dengan data saya jika saya berhenti berlangganan?</h3>
              <p className="text-gray-400">Data Anda akan tetap aman. Anda dapat mengekspor semua prompt yang tersimpan sebelum berlangganan berakhir.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12 bg-gradient-to-r from-red-500/10 to-red-700/10 rounded-2xl p-8 border border-red-500/20">
          <h2 className="text-2xl font-bold text-white mb-4">Siap Mulai Berkreasi?</h2>
          <p className="text-gray-300 mb-6">
            {user 
              ? 'Pilih paket yang sesuai dengan kebutuhan kreatif Anda.'
              : 'Daftar sekarang dan mulai buat prompt AI terbaik dengan Garuda AI!'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <Link
                href="/login"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                🚀 Daftar Gratis Sekarang
              </Link>
            ) : (
              <Link
                href="/"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                🎨 Mulai Berkreasi
              </Link>
            )}
            <a
              href="mailto:support@garuda-ai.com"
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              💬 Hubungi Support
            </a>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}