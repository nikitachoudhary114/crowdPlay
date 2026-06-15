# CrowdPlay

Real-time collaborative media queue platform where communities democratically decide what plays next.

## Features

- **Rooms** — Create/join via code (`/room/ABC123`)
- **Real-time queue** — Socket.IO powered voting and reordering
- **YouTube** — Search, queue, and synced playback
- **Chat** — Live room chat with moderation
- **Payments** — Razorpay fiat boosts (₹10–₹100) + CROWD token on Polygon
- **Web3** — MetaMask via RainbowKit/wagmi
- **Creator economy** — 70/30 revenue split
- **NFT memberships** — Double voting power (ERC-721)
- **DAO governance** — Token holder proposals
- **Analytics** — Room, creator, and platform dashboards
- **Gamification** — Badges and leaderboards

## Tech Stack

Next.js 15 · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Redis · Socket.IO · Razorpay · wagmi/viem · Solidity

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/crowdplay
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
YOUTUBE_API_KEY=
```

### 3. Set up database

```bash
npm run db:push
npm run db:seed
```

### 4. Run (includes Socket.IO server)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production

```bash
npm run build
npm start
```

## Smart Contracts

Solidity contracts in `contracts/`:

- `CrowdToken.sol` — ERC-20 CROWD token
- `QueueBoost.sol` — Boost purchases and creator earnings
- `CrowdMembership.sol` — ERC-721 NFT memberships

Deploy to Polygon and set addresses in `.env`.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/features` | Feature overview |
| `/pricing` | Boost pricing |
| `/room/create` | Create room |
| `/room/join` | Join by code |
| `/room/[code]` | Live room |
| `/dashboard` | User dashboard |
| `/dashboard/creator` | Creator earnings |
| `/dashboard/analytics` | Platform analytics |
| `/wallet` | CROWD + MetaMask |
| `/profile` | Badges & leaderboard |
| `/governance` | DAO proposals |
| `/admin` | Platform admin |
| `/settings` | User settings |

## Notes

- **Socket.IO** requires the custom server (`npm run dev` / `npm start`), not `next dev` alone
- **Razorpay** — without keys, boosts run in demo mode
- **YouTube** — without `YOUTUBE_API_KEY`, search returns demo results
- **Redis** — optional; falls back to in-memory cache
