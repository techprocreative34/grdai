'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase not configured');
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Get payment ID from URL params
        const paymentId = searchParams.get('payment_id') || searchParams.get('order_id');
        
        if (!paymentId) {
          setVerificationStatus('failed');
          setLoading(false);
          return;
        }

        // Check subscription status
        const { data: subscription, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('stripe_subscription_id', paymentId)
          .single();

        if (error || !subscription) {
          console.error('Subscription not found:', error);
          setVerificationStatus('failed');
        } else if (subscription.status === 'active') {
          setVerificationStatus('success');
          setSubscriptionDetails(subscription);
        } else {
          // Still pending, keep checking
          setTimeout(verifyPayment, 2000);
          return;
        }

      } catch (error) {
        console.error('Payment verification error:', error);
        setVerificationStatus('failed');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <LoadingSpinner size="lg" />
        <h1 className="text-2xl font-bold text-white mt-6 mb-2">Memverifikasi Pembayaran</h1>
        <p className="text-gray-400">Mohon tunggu sebentar, kami sedang memproses pembayaran Anda...</p>
      </div>
    );
  }

  if (verificationStatus === 'failed') {
    return (
      <ErrorBoundary>
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-3xl font-bold text-red-400 mb-4">Pembayaran Gagal</h1>
          <p className="text-gray-400 mb-8">
            Maaf, terjadi kesalahan dalam memproses pembayaran Anda. Silakan coba lagi atau hubungi support.
          </p>
          <div className="space-y-4">
            <Link 
              href="/pricing" 
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Coba Lagi
            </Link>
            <div>
              <a 
                href="mailto:support@garuda-ai.com" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Hubungi Support
              </a>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-green-400 mb-4">Pembayaran Berhasil!</h1>
        <p className="text-gray-400 mb-8">
          Selamat! Akun Anda telah berhasil diupgrade ke paket {subscriptionDetails?.plan_id?.toUpperCase() || 'Pro'}.
        </p>

        <div className="bg-gray-900 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-xl font-bold text-white mb-4">Detail Langganan</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex justify-between">
              <span>Paket:</span>
              <span className="font-semibold text-green-400">
                {subscriptionDetails?.plan_id?.toUpperCase() || 'Pro'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-semibold text-green-400">Aktif</span>
            </div>
            <div className="flex justify-between">
              <span>Berlaku hingga:</span>
              <span>
                {subscriptionDetails?.current_period_end 
                  ? new Date(subscriptionDetails.current_period_end).toLocaleDateString('id-ID')
                  : '-'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-green-700/10 border border-green-500/20 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-3">Fitur yang Sudah Aktif:</h3>
          <ul className="text-left space-y-2 text-gray-300">
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Analisa gambar unlimited
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Simpan prompt unlimited
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              AI Enhancement premium
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Prioritas dukungan
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <Link 
            href="/" 
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Mulai Berkreasi
          </Link>
          <div>
            <Link 
              href="/profil" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              Lihat Profil Saya
            </Link>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}