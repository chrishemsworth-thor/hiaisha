import type { Metadata, Viewport } from 'next';
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', weight: ['400','500','600','700','800'] });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta', weight: ['400','500','600','700'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', weight: ['400','500'] });

const BASE_URL = 'https://hiaisha.com';

export const viewport: Viewport = {
  themeColor: '#4F3DE0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',   // honours iPhone notch / home-bar safe areas
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Hiaisha — Malaysian Community',
    template: '%s — Hiaisha',
  },
  description:
    'Where Malaysians come to lepak, share cerita, and cakap pasal apa-apa. News, sports, hiburan — semua ada.',
  keywords: ['Malaysia', 'Malaysian community', 'forum Malaysia', 'berita Malaysia', 'Malaysian Reddit'],
  authors: [{ name: 'Hiaisha' }],
  creator: 'Hiaisha',
  publisher: 'Hiaisha Technologies Sdn. Bhd.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hiaisha',
    startupImage: '/og-default.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_MY',
    url: BASE_URL,
    siteName: 'Hiaisha',
    title: 'Hiaisha — Malaysian Community',
    description:
      'Where Malaysians come to lepak, share cerita, and cakap pasal apa-apa. News, sports, hiburan — semua ada.',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Hiaisha — Malaysian Community',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@hiaisha',
    creator: '@hiaisha',
    title: 'Hiaisha — Malaysian Community',
    description:
      'Where Malaysians come to lepak, share cerita, and cakap pasal apa-apa. News, sports, hiburan — semua ada.',
    images: ['/og-default.png'],
  },
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
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ms-MY"
      className={`${sora.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[var(--background)] font-body text-[var(--foreground)] antialiased">
        <Navbar />
        {/* Extra bottom padding on mobile so content clears the fixed BottomNav */}
        <main className="max-w-6xl mx-auto px-4 py-6 pb-[calc(1.5rem+72px)] sm:pb-6">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
