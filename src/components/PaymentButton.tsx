'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import LoadingSpinner from './LoadingSpinner';

interface PaymentButtonProps {
  planId: string;
  planName: string;
  price: number;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function PaymentButton({ 
  planId, 
  planName, 
  price, 
  disabled = false, 
  className = '',
  children 
}: PaymentButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!supabase) {
      alert('Konfigurasi database diperlukan untuk pembayaran.');
      return;
    }

    setLoading(true);
    
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirectTo=/pricing');
        return;
      }

      // Get session for API calls
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirectTo=/pricing');
        return;
      }

      // Create payment intent
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal membuat pembayaran');
      }

      const data = await response.json();
      
      // Redirect to payment URL
      if (data.paymentIntent.paymentUrl) {
        window.location.href = data.paymentIntent.paymentUrl;
      } else {
        throw new Error('URL pembayaran tidak tersedia');
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      alert(`Gagal memproses pembayaran: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || loading}
      className={`${className} ${
        disabled || loading 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:scale-105'
      } transition-all duration-300 flex items-center justify-center`}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" />
          <span className="ml-2">Memproses...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}