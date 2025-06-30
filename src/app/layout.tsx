import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthGuard from "@/components/AuthGuard";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true
});

export const metadata: Metadata = {
  title: "Garuda AI - Generator Prompt #1 di Indonesia",
  description: "Buat prompt AI sempurna untuk gambar dan teks dengan cita rasa lokal Indonesia. Analisis gambar, enhance prompt, dan koleksi inspirasi terbaik.",
  keywords: ["AI prompt generator", "Indonesia", "text-to-image", "Midjourney", "DALL-E", "prompt engineering"],
  authors: [{ name: "Garuda AI Team" }],
  creator: "Garuda AI",
  publisher: "Garuda AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://garuda-ai.com',
    title: 'Garuda AI - Generator Prompt #1 di Indonesia',
    description: 'Buat prompt AI sempurna untuk gambar dan teks dengan cita rasa lokal Indonesia.',
    siteName: 'Garuda AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Garuda AI - Generator Prompt #1 di Indonesia',
    description: 'Buat prompt AI sempurna untuk gambar dan teks dengan cita rasa lokal Indonesia.',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} bg-gray-800 text-gray-100`}>
        <ErrorBoundary>
          <AuthGuard>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow container mx-auto px-6 py-8">
                {children}
              </main>
              <Footer />
            </div>
          </AuthGuard>
        </ErrorBoundary>
      </body>
    </html>
  );
}