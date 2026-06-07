# hiaisha

A localised community platform for Malaysia, built by Malaysians — think Reddit but rooted in Malaysian culture, language, and communities.

---

## What is Hiaisha?

Hiaisha is a full-stack social platform where Malaysians can discuss, share, and vote on content across communities (called *communities*) covering everything from local news and politics to food, memes, and rants — all with a Manglish-friendly interface.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | Hono on Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| File Storage | Cloudflare R2 |
| Language | TypeScript (monorepo) |

---

## Project Structure

```
hiaisha/
├── apps/
│   ├── web/        # Next.js 14 frontend
│   └── worker/     # Cloudflare Workers API (Hono)
├── packages/
│   └── types/      # Shared TypeScript types
└── .env.example
```

---

## Features

- **Communities** — 12 default communities (Malaysia, Berita Semasa, Politics, Tech, Makan, Memes, and more)
- **Posts** — Text and image posts with upvote/downvote, hot score ranking, location tagging
- **Comments** — Nested threaded comments with voting
- **Auth** — Registration, login, email verification, JWT sessions
- **Search** — Full-text search (SQLite FTS5) with community and sort filters
- **Notifications** — Replies, mentions, post activity
- **Moderation** — Per-community moderators, content reports, admin panel
- **PWA** — Mobile-optimised with bottom navigation and app manifest
- **Dark mode** — Warm dark theme

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Cloudflare account (for Workers, D1, R2)
- Wrangler CLI (`npm i -g wrangler`)

### Installation

```bash
git clone https://github.com/chrishemsworth-thor/hiaisha.git
cd hiaisha
npm install
```

### Environment Setup

**Frontend** — copy and edit `apps/web/.env.example`:

```bash
cp apps/web/.env.example apps/web/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Worker** — copy and edit `apps/worker/.dev.vars.example`:

```bash
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
```

```env
JWT_SECRET=your-secret-here
FRONTEND_URL=http://localhost:3000
R2_PUBLIC_URL=https://your-r2-bucket-url
RESEND_API_KEY=your-resend-key
```

### Database Setup

```bash
# Local development
npm run db:migrate:local

# Production (Cloudflare D1)
npm run db:migrate
```

### Running Locally

```bash
# Start both frontend and worker
npm run dev:web       # http://localhost:3000
npm run dev:worker    # http://localhost:8787
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev:web` | Start Next.js dev server |
| `npm run dev:worker` | Start Wrangler local dev server |
| `npm run build:web` | Build frontend for production |
| `npm run deploy:worker` | Deploy worker to Cloudflare |
| `npm run db:migrate` | Apply schema to remote D1 |
| `npm run db:migrate:local` | Apply schema to local D1 |
| `npm run db:reset` | Drop and recreate tables (remote) |
| `npm run db:reset:local` | Drop and recreate tables (local) |

---

## Design System

- **Primary:** Electric indigo `#4F3DE0`
- **Accent:** Turmeric gold `#E8A020` — inspired by the Malaysian flag
- **Dark background:** Warm dark `#18171C`
- **Display font:** Sora
- **Body font:** Plus Jakarta Sans
- **Mono font:** JetBrains Mono

---

## API Overview

The backend exposes these route groups via Hono:

| Route | Description |
|---|---|
| `/auth` | Register, login, verify email, profile |
| `/posts` | Create/read posts, voting, feeds |
| `/comments` | Nested comments, voting |
| `/communities` | List, join, leave communities |
| `/users` | Profiles, user feeds |
| `/search` | Full-text post search |
| `/notifications` | User notifications |
| `/upload` | Image upload to R2 |
| `/mod` | Moderation actions |

---

## License

MIT — see [LICENSE](./LICENSE).
