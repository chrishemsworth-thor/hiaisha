import type { Metadata } from 'next';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' });

const BASE_URL = 'https://hiaisha.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Hiaisha — Malaysian Community',
    template: '%s — Hiaisha',
  },
  description:
    'The Malaysian community for everything — news, sports, tech, lifestyle, entertainment, and more. Cakap apa-apa, share apa-apa.',
  keywords: ['Malaysia', 'Malaysian community', 'forum Malaysia', 'berita Malaysia', 'Malaysian Reddit'],
  authors: [{ name: 'Hiaisha' }],
  creator: 'Hiaisha',
  publisher: 'Hiaisha Technologies Sdn. Bhd.',
  openGraph: {
    type: 'website',
    locale: 'en_MY',
    url: BASE_URL,
    siteName: 'Hiaisha',
    title: 'Hiaisha — Malaysian Community',
    description:
      'The Malaysian community for everything — news, sports, tech, lifestyle, entertainment, and more. Cakap apa-apa, share apa-apa.',
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
      'The Malaysian community for everything — news, sports, tech, lifestyle, entertainment, and more. Cakap apa-apa, share apa-apa.',
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
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms-MY" className={`${sora.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-surface-bg font-body text-[#1A1A1A] dark:bg-[#1A1A1A] dark:text-[#FAFAF7]">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
