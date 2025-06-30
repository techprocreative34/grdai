'use client';
import Link from 'next/link';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function PaymentFailedPage() {
  return (
    <ErrorBoundary>
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-6xl mb-6">💳</div>
        <h1 className="text-3xl font-bold text-red-400 mb-4">Pembayaran Dibatalkan</h1>
        <p className="text-gray-400 mb-8">
          Pembayaran Anda telah dibatalkan. Jangan khawatir, tidak ada biaya yang dikenakan.
        </p>

        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Mengapa pembayaran bisa dibatalkan?</h2>
          <ul className="text-left space-y-2 text-gray-300">
            <li>• Anda memilih untuk membatalkan pembayaran</li>
            <li>• Terjadi masalah dengan metode pembayaran</li>
            <li>• Koneksi internet terputus saat proses pembayaran</li>
            <li>• Batas waktu pembayaran telah habis</li>
          </ul>
        </div>

        <div className="space-y-4">
          <Link 
            href="/pricing" 
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Coba Lagi
          </Link>
          <div className="flex justify-center space-x-6">
            <Link 
              href="/" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              Kembali ke Beranda
            </Link>
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