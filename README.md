# CrowdPlay

**Democratic media queues for parties, cafés, events, and live streams.**

CrowdPlay is a real-time collaborative YouTube queue. Create a room, share a code, search songs, vote, chat, and boost tracks with Razorpay (INR) or CROWD tokens on Polygon. Playback stays in sync for everyone in the room.

**Live demo:** [crowdplay-production-543a.up.railway.app](https://crowdplay-production-543a.up.railway.app)

---

## Features

| Area | What you get |
|------|----------------|
| **Rooms** | 6-character codes, guest or Google sign-in |
| **Queue & voting** | Real-time reorder via Socket.IO |
| **YouTube** | Search, queue, synced player |
| **Chat** | Live room chat |
| **Fiat boosts** | Razorpay — ₹10 / ₹25 / ₹50 / ₹100 tiers |
| **Crypto boosts** | CROWD token on Polygon Amoy via MetaMask |
| **Creator economy** | 70% creator / 30% platform revenue split |
| **Governance** | Platform stats, revenue dashboard, split config |
| **Web3** | RainbowKit + wagmi, optional NFT membership contract |
| **Admin** | User/room management for platform admins |

### Boost tiers

| Tier | INR | CROWD | Effect |
|------|-----|-------|--------|
| Boost | ₹10 | 5 | Move up in queue |
| Priority | ₹25 | 20 | Stronger queue jump |
| Play Next | ₹50 | 50 | Plays after current song |
| Super Priority | ₹100 | 100 | Interrupts and plays immediately |

---

## Tech stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS 4, Framer Motion, Radix UI
- **Backend:** Custom Node server (`server/index.ts`) with Next.js API routes
- **Realtime:** Socket.IO (rooms, queue, chat, playback sync)
- **Data:** PostgreSQL + Prisma, Redis (cache & pub/sub)
- **Auth:** NextAuth.js (Google OAuth + guest sessions)
- **Payments:** Razorpay, on-chain CROWD boosts (viem/wagmi)
- **Contracts:** Solidity 0.8 — CrowdToken, QueueBoost, CrowdMembership

---

## Architecture

```mermaid
flowchart LR
  Browser --> Railway[Railway Node Server]
  Railway --> Next[Next.js App + API]
  Railway --> Socket[Socket.IO]
  Next --> Postgres[(PostgreSQL)]
  Next --> Redis[(Redis)]
  Socket --> Redis
  Browser --> Google[Google OAuth]
  Browser --> Razorpay[Razorpay]
  Browser --> Polygon[Polygon Amoy]
```

> **Why not Vercel?** This app uses a custom server and persistent WebSocket connections. Deploy the full stack on Railway (or similar), not as a split Vercel frontend.

---

## Prerequisites

- Node.js 20+
- Docker (for local Postgres + Redis)
- [Google Cloud](https://console.cloud.google.com/) OAuth credentials
- [YouTube Data API](https://console.cloud.google.com/apis/library/youtube.googleapis.com) key
- Optional: [Razorpay](https://dashboard.razorpay.com/) keys, [WalletConnect](https://cloud.walletconnect.com/) project ID

---

## Local development

### 1. Clone and install

```bash
git clone https://github.com/nikitachoudhary114/crowdPlay.git
cd crowdPlay
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Fill in `.env` — at minimum:

```env
DATABASE_URL="postgresql://crowdplay:crowdplay@localhost:5432/crowdplay"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-long-random-secret"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
YOUTUBE_API_KEY="..."
```

### 3. Start databases

```bash
npm run docker:up
```

### 4. Initialize database

```bash
npm run db:push
npm run db:seed
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> Use `npm run dev` (custom server), **not** `next dev` — Socket.IO won't work without the custom server.

### Google OAuth (local)

In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials):

- **Authorized JavaScript origins:** `http://localhost:3000`
- **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`

---

## Production deployment (Railway)

### 1. Create services

In one Railway **project**:

1. **crowdPlay** — deploy from this GitHub repo
2. **PostgreSQL** — New → Database → PostgreSQL
3. **Redis** — New → Database → Redis

### 2. Configure variables

On the **crowdPlay** service, set:

| Variable | Value |
|----------|--------|
| `NEXTAUTH_URL` | `https://your-app.up.railway.app` (no trailing slash) |
| `NEXTAUTH_SECRET` | Strong random string |
| `DATABASE_URL` | From Postgres service → Connect |
| `REDIS_URL` | From Redis service → Connect |
| `GOOGLE_CLIENT_ID` | Must match OAuth client below |
| `GOOGLE_CLIENT_SECRET` | Same OAuth client |
| `YOUTUBE_API_KEY` | YouTube Data API |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Optional — demo mode without |
| `NEXT_PUBLIC_*` | Contract & wallet env vars (see below) |

### 3. Google OAuth (production)

For OAuth client matching `GOOGLE_CLIENT_ID` on Railway:

- **Origins:** `https://your-app.up.railway.app`
- **Redirect URI:** `https://your-app.up.railway.app/api/auth/callback/google`

### 4. Networking

**Settings → Networking → Generate Domain** (or add custom domain).

### 5. Database setup (once)

Railway shell on crowdPlay service:

```bash
npx prisma db push
npx tsx prisma/seed.ts
```

Build and start are automatic: `npm run build` → `npm run start`.

---

## Smart contracts (Polygon Amoy)

Contracts live in `contracts/`:

| Contract | Purpose |
|----------|---------|
| `CrowdToken.sol` | ERC-20 CROWD token |
| `QueueBoost.sol` | On-chain boost payments |
| `CrowdMembership.sol` | ERC-721 membership NFTs |

### Compile & deploy

```bash
# .env needs POLYGON_AMOY_RPC_URL and DEPLOYER_PRIVATE_KEY
npm run contracts:compile
npm run contracts:deploy:amoy
```

Copy printed addresses into `.env`:

```env
NEXT_PUBLIC_CROWD_TOKEN_ADDRESS="0x..."
NEXT_PUBLIC_QUEUE_BOOST_ADDRESS="0x..."
NEXT_PUBLIC_NFT_MEMBERSHIP_ADDRESS="0x..."
NEXT_PUBLIC_PLATFORM_TREASURY_ADDRESS="0x..."
NEXT_PUBLIC_CHAIN_ID="80002"
```

### Redeploy QueueBoost only

If the token is already deployed:

```bash
npm run contracts:deploy:amoy:boost
```

Skip existing contracts during full deploy:

```bash
DEPLOY_SKIP_TOKEN=1 npm run contracts:deploy:amoy
DEPLOY_SKIP_NFT=1 npm run contracts:deploy:amoy
```

Get test MATIC from the [Polygon faucet](https://faucet.polygon.technology/) (select **Amoy**).

---

## Platform admin

Set a user's role in the database:

```bash
npx prisma studio
```

Open **User** → set `role` to `PLATFORM_ADMIN` for your account.

Then visit `/admin` and `/governance` for platform controls and revenue stats.

---

## Project structure

```
app/                  # Next.js App Router pages & API routes
components/           # UI components (room, dashboard, providers)
hooks/                # useSocket, useCryptoBoost, etc.
lib/                  # Queue engine, auth, payments, contracts
server/               # Custom HTTP server + Socket.IO
contracts/            # Solidity + Hardhat deploy scripts
prisma/               # Schema & seed
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with Socket.IO |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run docker:up` | Start Postgres + Redis |
| `npm run db:push` | Apply Prisma schema |
| `npm run db:seed` | Seed governance defaults |
| `npm run contracts:compile` | Compile Solidity |
| `npm run contracts:deploy:amoy` | Deploy all contracts |
| `npm run contracts:deploy:amoy:boost` | Redeploy QueueBoost only |

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing |
| `/room/create` | Create room |
| `/room/join` | Join by code |
| `/room/[code]` | Live room (player, queue, chat, boosts) |
| `/dashboard` | User dashboard |
| `/dashboard/creator` | Creator earnings |
| `/dashboard/analytics` | Analytics |
| `/governance` | Revenue & governance |
| `/wallet` | Web3 wallet |
| `/profile` | Profile & badges |
| `/admin` | Platform admin |
| `/pricing` | Boost pricing |
| `/features` | Feature overview |

---

## Environment reference

See [`.env.example`](.env.example) for the full template. Never commit `.env` or private keys.

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes (prod) | Redis URL; in-memory fallback locally |
| `NEXTAUTH_URL` | Yes | App URL, no trailing slash |
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT |
| `GOOGLE_CLIENT_ID` / `SECRET` | Yes | Google OAuth |
| `YOUTUBE_API_KEY` | Yes | YouTube search |
| `RAZORPAY_*` | No | Demo boosts without keys |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | No | WalletConnect |
| `NEXT_PUBLIC_CROWD_TOKEN_ADDRESS` | For crypto | After contract deploy |
| `NEXT_PUBLIC_QUEUE_BOOST_ADDRESS` | For crypto | After contract deploy |
| `POLYGON_AMOY_RPC_URL` | Deploy only | Hardhat deploy scripts |
| `DEPLOYER_PRIVATE_KEY` | Deploy only | Never expose in frontend |

---

## License

Private project — all rights reserved.
