// components/communities/WelcomeCard.tsx — sidebar welcome card
// Logged-out visitors see a warm Malaysian welcome with batik pattern + bunga raya.
import Link from 'next/link';

export function WelcomeCard() {
  return (
    <div
      className="relative overflow-hidden rounded-card text-white"
      style={{ background: 'linear-gradient(135deg, #4F3DE0 0%, #6E5FE2 55%, #E8A020 130%)' }}
    >
      {/* batik-inspired diamond pattern */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
        viewBox="0 0 320 200"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <pattern id="batik" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 4 L36 20 L20 36 L4 20 Z" fill="none" stroke="white" strokeWidth="1" />
            <circle cx="20" cy="20" r="2" fill="white" />
            <path d="M20 12 L28 20 L20 28 L12 20 Z" fill="none" stroke="white" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#batik)" />
      </svg>

      {/* bunga raya silhouette */}
      <svg
        className="absolute -right-3 -top-3 opacity-25"
        width="80"
        height="80"
        viewBox="0 0 80 80"
        aria-hidden
      >
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="40" cy="24" rx="12" ry="18"
            transform={`rotate(${a} 40 40)`} fill="#FFD23F" />
        ))}
        <circle cx="40" cy="40" r="5" fill="#C0392B" />
      </svg>

      <div className="relative p-4">
        <div className="mb-2 flex items-center gap-2 font-display text-[13px] font-bold uppercase tracking-wider opacity-90">
          <span className="text-xl">🇲🇾</span>
          Selamat datang
        </div>
        <h3 className="mb-2 font-display text-[22px] font-extrabold leading-[1.15] tracking-tight">
          Ke Hiaisha, jom borak!
        </h3>
        <p className="mb-3.5 text-[13px] leading-relaxed opacity-90">
          Tempat orang Malaysia kumpul, share cerita, dan lepak. Dari berita, bola, makan sampai
          meme — semua ada.
        </p>
        <div className="flex gap-2">
          <Link
            href="/register"
            className="flex-1 rounded-pill bg-white px-3 py-2.5 text-center font-display text-xs font-bold text-primary-700 transition hover:bg-white/95"
          >
            Daftar (free)
          </Link>
          <Link
            href="/login"
            className="rounded-pill border border-white/45 px-3.5 py-2.5 font-display text-xs font-semibold transition hover:bg-white/10"
          >
            Log masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
