# SolarExpress

An interplanetary travel booking platform that combines a modern web application with blockchain technology. Book flights to destinations across the solar system, mint ERC-721 NFT tickets, and track your journey history — all on the Sepolia test network.

## Features

- **Interactive Solar System**: 3D explorable solar system built with Three.js and React Three Fiber
- **Blockchain Tickets**: Each booking mints a unique ERC-721 NFT ticket on Sepolia
- **Wallet Integration**: Connect MetaMask to manage NFT tickets and link wallets to accounts
- **Booking Flow**: Browse destinations, select travel class, pay with ETH, receive NFT
- **NFT Gallery**: View all minted tickets as collectible NFT cards with procedurally generated art
- **Booking History**: Track every booking with flight details, route info, and on-chain verification
- **Authentication**: JWT-based auth with httpOnly cookies, email/password signup and signin
- **Responsive Design**: Mobile-first UI with bottom navigation and adaptive layouts

## Screenshots

_Screenshots coming soon_

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js    │────▶│   Express    │────▶│   MongoDB    │
│  Frontend    │     │   Backend    │     │  (Bookings)  │
│  :3000       │◀────│  :4000       │◀────│              │
└──────┬───────┘     └──────────────┘     └──────────────┘
       │                                         ▲
       │  Wagmi / Viem                           │
       ▼                                         │
┌──────────────┐                                 │
│   Sepolia    │─────────────────────────────────┘
│  Testnet     │  Smart Contracts (ERC-721)
│  (Ethereum)  │  TicketSale, BookingHistory
└──────────────┘
```

## Tech Stack

**Frontend**
- [Next.js](https://nextjs.org/) 16 (App Router)
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Wagmi](https://wagmi.sh/) / [Viem](https://viem.sh/) — blockchain interaction
- [TanStack Query](https://tanstack.com/query/latest) — server state management
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) — 3D solar system
- [React Three Drei](https://github.com/pmndrs/drei) — 3D utilities

**Backend**
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) / [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/) — authentication
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — password hashing

**Blockchain**
- [Solidity](https://soliditylang.org/) smart contracts
- [ERC-721](https://eips.ethereum.org/EIPS/e-721) NFT standard
- [Sepolia](https://sepolia.dev/) test network
- [MetaMask](https://metamask.io/) — wallet connection

## Folder Structure

```
SolarExpress/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── about/           # About page
│   │   ├── booking-history/ # Booking history + NFT gallery
│   │   ├── booking/         # Booking/payment flow
│   │   ├── explore/         # Destination exploration
│   │   ├── faq/             # FAQ page
│   │   └── signin/          # Authentication
│   ├── components/
│   │   ├── layout/          # NavBar, bottom nav
│   │   ├── nft/             # NFT ticket components
│   │   ├── panel/           # Booking panel components
│   │   ├── scene/           # 3D solar system components
│   │   ├── ui/              # Shared UI (Modal, Loading, Logo)
│   │   └── wallet/          # Wallet connection components
│   ├── data/                # Static data (bodies, routes, travel)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities, config, providers
│   └── types/               # TypeScript type definitions
├── backend/
│   ├── config/              # Database connection
│   ├── controllers/         # Route handlers
│   ├── middleware/           # Auth middleware
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express routes
│   ├── scripts/             # Utility scripts
│   └── utils/               # Shared utilities
├── contracts/               # Solidity smart contracts
└── public/                  # Static assets
```

## Installation

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- MetaMask browser extension
- Sepolia test ETH (from a faucet)

### Clone

```bash
git clone https://github.com/anomalyco/SolarExpress.git
cd SolarExpress
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your values
# NEXT_PUBLIC_TICKET_SALE_ADDRESS=0x...
# NEXT_PUBLIC_TICKET_NFT_ADDRESS=0x...
# NEXT_PUBLIC_BOOKING_HISTORY_ADDRESS=0x...
# NEXT_PUBLIC_SEPOLIA_RPC_URL=https://rpc.sepolia.org
# API_BACKEND_URL=http://localhost:4000

# Run development server
npm run dev
```

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values
# MONGODB_URI=mongodb+srv://...
# JWT_SECRET=your-secret-key
# PORT=4000
# CORS_ORIGIN=http://localhost:3000

# Run backend
npm run dev
```

### Smart Contract Deployment

1. Navigate to `contracts/` directory
2. Install dependencies: `npm install`
3. Configure `hardhat.config.js` with your Sepolia private key and RPC URL
4. Deploy: `npx hardhat run scripts/deploy.js --network sepolia`
5. Copy the deployed contract addresses to your `.env.local`

## Environment Variables

### Frontend (`.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_TICKET_SALE_ADDRESS` | Deployed TicketSale contract address |
| `NEXT_PUBLIC_TICKET_NFT_ADDRESS` | Deployed TicketNFT (ERC-721) contract address |
| `NEXT_PUBLIC_BOOKING_HISTORY_ADDRESS` | Deployed BookingHistory contract address |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Sepolia RPC endpoint |
| `API_BACKEND_URL` | Backend API URL used by frontend requests, API routes, and rewrites |

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `PORT` | Server port (default: 4000) |
| `CORS_ORIGIN` | Allowed CORS origin (frontend URL) |
| `NODE_ENV` | Environment: `development` or `production` |
| `TICKET_SALE_ADDRESS` | TicketSale contract address (optional, for utilities) |
| `SOLAREXPRESS_TICKET_ADDRESS` | TicketNFT contract address (optional, for utilities) |
| `BOOKING_HISTORY_ADDRESS` | BookingHistory contract address (optional, for utilities) |

## Running Locally

1. Start MongoDB: `mongod`
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `npm run dev`
4. Open http://localhost:3000
5. Create an account, connect MetaMask, and book a flight

## Deployment

### Frontend (Vercel)

```bash
npm run build
npx vercel --prod
```

Set all environment variables in Vercel dashboard.

### Backend (Railway / Render / DigitalOcean)

1. Set `NODE_ENV=production` in environment
2. Set `CORS_ORIGIN` to your frontend URL
3. Ensure MongoDB URI points to a production cluster
4. Deploy and run `node server.js`

## Smart Contract Deployment

```bash
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
```

Update `.env.local` with the deployed addresses after deployment.

## NFT Metadata Endpoint

Tickets store `tokenURI` as `{BASE_TOKEN_URI}/{tokenId}` and the metadata is
generated on-demand by the frontend API route at `/api/nft/metadata/[tokenId]`.
The route reads the ticket data from the `SolarExpressTicket` contract and the
`TicketPurchased` event from `TicketSale`, then returns an ERC-721 metadata JSON
with an embedded SVG image. Because it is a Next.js API route, the deployed
frontend must be able to serve `/api/*` (e.g. Vercel) — a static host such as an
S3 bucket will not work. After deployment, set `baseTokenURI` on the NFT
contract (e.g. via `scripts/wire-with-viem.js`) to the frontend's URL ending in
`/api/nft/metadata/`.

## Future Improvements

- Multi-network support (Ethereum mainnet, Polygon, Arbitrum)
- Ticket transfer between wallets from the UI
- Real-time flight status and countdown
- Email notifications for booking confirmations
- Passenger class upgrades with additional NFT metadata
- Dark mode toggle (currently dark-only)
- Internationalization (i18n)
- Unit and integration tests (Jest + Playwright)
- CI/CD pipeline (GitHub Actions)

