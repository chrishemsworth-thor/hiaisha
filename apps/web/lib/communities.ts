// lib/communities.ts — 12 broad topik for hiaisha

export type CommunityCategory =
  | 'General' | 'News' | 'Sports' | 'Tech' | 'Money'
  | 'Education' | 'Lifestyle' | 'Entertainment' | 'Food' | 'Humor' | 'Off-topic';

export interface CommunityMeta {
  slug:  string;          // c/{slug}
  name:  string;
  emoji: string;
  fg:    string;          // accent color (text + strip)
  bg:    string;          // soft surface tint
  desc:  string;
  cat:   CommunityCategory;
}

export const COMMUNITIES: Record<string, CommunityMeta> = {
  malaysia:   { slug: 'malaysia',   name: 'Malaysia',              emoji: '🇲🇾', fg: '#D4A017', bg: '#FBEFD3', cat: 'General',       desc: 'General community — segala apa pun boleh.' },
  berita:     { slug: 'berita',     name: 'Berita Semasa',         emoji: '📰',  fg: '#475569', bg: '#E5E8EE', cat: 'News',          desc: 'Latest local & global news — fakta dulu, opinion lepas.' },
  politik:    { slug: 'politik',    name: 'Politik & PRU',         emoji: '🗳️', fg: '#B91C1C', bg: '#FBE5E5', cat: 'News',          desc: 'PRU watch, parliament drama, civic talk.' },
  sukan:      { slug: 'sukan',      name: 'Sukan',                 emoji: '⚽',  fg: '#059669', bg: '#DCF1E7', cat: 'Sports',        desc: 'Football, badminton, F1, esports — Malaysia boleh!' },
  tech:       { slug: 'tech',       name: 'Teknologi & Gaming',    emoji: '🎮',  fg: '#7C3AED', bg: '#EFE7FB', cat: 'Tech',          desc: 'Devs, gadgets, games, AI takes.' },
  hiburan:    { slug: 'hiburan',    name: 'Hiburan',               emoji: '🎬',  fg: '#DB2777', bg: '#FCE2EE', cat: 'Entertainment', desc: 'Movies, K-drama, local artists, gossip yang sah.' },
  kewangan:   { slug: 'kewangan',   name: 'Kewangan & Pelaburan',  emoji: '💰',  fg: '#15803D', bg: '#DEF0E1', cat: 'Money',         desc: 'EPF, saham, crypto, FIRE — duit cerita.' },
  pendidikan: { slug: 'pendidikan', name: 'Pendidikan & Kerjaya',  emoji: '📚',  fg: '#0284C7', bg: '#DDEEFB', cat: 'Education',     desc: 'SPM, uni, career switches, gaji benchmarks.' },
  gayahidup:  { slug: 'gayahidup',  name: 'Gaya Hidup',            emoji: '✨',  fg: '#E11D48', bg: '#FCE0E6', cat: 'Lifestyle',     desc: 'Fashion, fitness, travel, kahwin planning.' },
  makan:      { slug: 'makan',      name: 'Makan',                 emoji: '🍜',  fg: '#C0392B', bg: '#FBE9E5', cat: 'Food',          desc: 'The OG — mamak to fine dining, hawker to home.' },
  meme:       { slug: 'meme',       name: 'Meme Malaysia',         emoji: '😂',  fg: '#EA580C', bg: '#FDE5D3', cat: 'Humor',         desc: 'Wholesome, cursed, oddly specific. Post-em.' },
  rant:       { slug: 'rant',       name: 'Rant & Lepas Geram',    emoji: '😤',  fg: '#6D28D9', bg: '#E7DDF8', cat: 'Off-topic',     desc: 'Vent here. No judgement. Stress betul.' },
};

export const COMMUNITY_LIST = Object.values(COMMUNITIES);

/** Look up community visual metadata by slug. Returns undefined for unknown slugs. */
export function getCommunityMeta(slug: string): CommunityMeta | undefined {
  return COMMUNITIES[slug];
}

/** Format member count: 1000 → "1k", 41700 → "41.7k", 1200000 → "1.2m" */
export function formatMemberCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}
