'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase, isSupabaseConfigured } from '@/utils/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const redirectTo = searchParams.get('redirectTo') || '/';

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push(redirectTo);
        return;
      }
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Small delay to ensure session is properly set
        setTimeout(() => {
          router.push(redirectTo);
          router.refresh();
        }, 500);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, redirectTo]);

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  // Show error message if Supabase is not configured
  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Link href="/pricing" className="text-gray-400 hover:text-white mb-4 inline-block">← Learn More About Garuda AI</Link>
        <h1 className="text-3xl font-bold text-center mb-6 text-white">Masuk / Daftar</h1>
        <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded">
          <p className="font-semibold">Konfigurasi Supabase Diperlukan</p>
          <p className="text-sm mt-1">
            Silakan konfigurasi variabel lingkungan Supabase di file .env.local untuk menggunakan fitur autentikasi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <Link href="/pricing" className="text-gray-400 hover:text-white mb-4 inline-block">← Learn More About Garuda AI</Link>
      <h1 className="text-3xl font-bold text-center mb-6 text-white">Masuk / Daftar</h1>
      
      {redirectTo !== '/' && (
        <div className="bg-blue-900/20 border border-blue-500 text-blue-200 px-4 py-3 rounded mb-4">
          <p className="text-sm">Silakan login untuk mengakses Garuda AI dan mulai berkreasi dengan prompt AI terbaik.</p>
        </div>
      )}

      <div className="bg-gray-900 p-6 rounded-lg">
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            style: {
              button: {
                background: '#dc2626',
                color: 'white',
                borderRadius: '6px',
                border: 'none',
                padding: '10px 15px',
                fontSize: '14px',
                fontWeight: '600',
              },
              anchor: {
                color: '#dc2626',
                textDecoration: 'none',
              },
              container: {
                width: '100%',
              },
              divider: {
                background: '#374151',
                margin: '16px 0',
              },
              input: {
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                color: 'white',
                padding: '10px 12px',
              },
              label: {
                color: '#d1d5db',
                fontSize: '14px',
                marginBottom: '6px',
              },
              message: {
                color: '#fca5a5',
                fontSize: '13px',
                marginTop: '6px',
              },
            }
          }}
          theme="dark"
          providers={['google', 'github']}
          redirectTo={`${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`}
          onlyThirdPartyProviders={false}
          magicLink={false}
          showLinks={true}
          localization={{
            variables: {
              sign_in: { 
                email_label: 'Alamat Email', 
                password_label: 'Kata Sandi', 
                button_label: 'Masuk', 
                social_provider_text: 'Masuk dengan {{provider}}',
                link_text: 'Sudah punya akun? Masuk di sini',
                loading_button_label: 'Sedang masuk...',
              },
              sign_up: { 
                email_label: 'Alamat Email', 
                password_label: 'Kata Sandi', 
                button_label: 'Daftar', 
                social_provider_text: 'Daftar dengan {{provider}}',
                link_text: 'Belum punya akun? Daftar di sini',
                loading_button_label: 'Sedang mendaftar...',
                confirmation_text: 'Periksa email Anda untuk link konfirmasi',
              },
              forgotten_password: {
                email_label: 'Alamat Email',
                button_label: 'Kirim instruksi reset',
                link_text: 'Lupa kata sandi?',
                confirmation_text: 'Periksa email Anda untuk link reset password',
              }
            }
          }}
        />
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          Dengan mendaftar, Anda menyetujui{' '}
          <a href="#" className="text-red-400 hover:text-red-300">Syarat & Ketentuan</a>
          {' '}dan{' '}
          <a href="#" className="text-red-400 hover:text-red-300">Kebijakan Privasi</a>
        </p>
      </div>
    </div>
  );
}