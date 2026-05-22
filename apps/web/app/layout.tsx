import type { Metadata } from 'next';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' });

export const metadata: Metadata = {
  title: 'Hiaisha — Malaysian Food Community',
  description: 'Where Malaysian food lovers gather. Discover hidden gems, share your makan finds, and connect with the community.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-surface-bg font-body text-[#1A1A1A] dark:bg-[#1A1A1A] dark:text-[#FAFAF7]">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
