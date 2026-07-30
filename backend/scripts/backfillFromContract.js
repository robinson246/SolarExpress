/**
 * One-time backfill: reads TicketPurchased events from the TicketSale contract
 * and creates MongoDB Booking records for any that are missing.
 *
 * Usage: node backend/scripts/backfillFromContract.js
 *
 * Requires:
 *   - MONGODB_URI in backend/.env
 *   - NEXT_PUBLIC_SEPOLIA_RPC_URL in .env.local (project root) or SEPOLIA_RPC_URL in backend/.env
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { createPublicClient, http, parseAbiItem, formatEther, fallback } = require('viem');
const { sepolia } = require('viem/chains');
const { generateFlightDetails } = require('../utils/generateFlightDetails');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const RPC_URLS = [
  process.env.SEPOLIA_RPC_URL,
  'https://ethereum-sepolia.publicnode.com',
  'https://1rpc.io/sepolia',
  'https://rpc.sepolia.org',
  'https://sepolia.drpc.org',
  'https://sepolia.gateway.tenderly.co',
].filter(Boolean);

const TICKET_SALE_ADDRESS = '0x9108a57EF02A3e9486E62C7cb4bcEb49D735e86f';

if (!MONGO_URI) {
  console.error('MONGODB_URI not set. Create a .env file in backend/.');
  process.exit(1);
}

const ticketPurchasedEvent = parseAbiItem(
  'event TicketPurchased(uint256 indexed tokenId, address indexed buyer, uint256 indexed destinationId, uint256 pricePaid)',
);

const publicClient = createPublicClient({
  chain: sepolia,
  transport: fallback(RPC_URLS.map(url => http(url)), { rank: true }),
});

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const bookingsColl = db.collection('bookings');
  const usersColl = db.collection('users');

  // Check how many unique booking txHashes exist in the DB
  const existingTxHashes = new Set(
    (await bookingsColl.distinct('transactionHash')).map(h => h.toLowerCase()),
  );
  console.log(`Existing booking records: ${existingTxHashes.size}`);

  // Fetch all TicketPurchased events from the contract
  console.log('Fetching TicketPurchased events from contract...');
  const latestBlock = await publicClient.getBlockNumber();
  console.log(`  Current block: ${latestBlock}`);
  const BATCH = 10000n;
  // Start from a reasonable block (adjust with START_BLOCK env var if known)
  const START_BLOCK = process.env.START_BLOCK ? BigInt(process.env.START_BLOCK) : (latestBlock - 200000n);
  let logs = [];
  for (let from = START_BLOCK; from < latestBlock; from += BATCH) {
    const to = from + BATCH - 1n < latestBlock ? from + BATCH - 1n : latestBlock;
    const batch = await publicClient.getLogs({
      address: TICKET_SALE_ADDRESS,
      event: ticketPurchasedEvent,
      fromBlock: from,
      toBlock: to,
    });
    logs = logs.concat(batch);
    process.stdout.write(`  Blocks ${from}–${to}: ${batch.length} events\r`);
    // Throttle to avoid RPC rate limits
    if (from + BATCH < latestBlock) await new Promise(r => setTimeout(r, 500));
  }
  console.log(`\nFound ${logs.length} TicketPurchased events total`);

  let created = 0;
  let skipped = 0;
  let noUser = 0;

  for (const log of logs) {
    const { tokenId, buyer, destinationId, pricePaid } = log.args;
    const txHash = log.transactionHash.toLowerCase();

    if (existingTxHashes.has(txHash)) {
      skipped++;
      continue;
    }

    // Find user by wallet address
    const user = await usersColl.findOne({ walletAddress: buyer.toLowerCase() });
    if (!user) {
      console.log(`  No user found for wallet ${buyer} (token #${tokenId}) — skipping`);
      noUser++;
      continue;
    }

    const destId = Number(destinationId);
    const fields = generateFlightDetails(destId);

    const booking = {
      userId: user._id,
      walletAddress: buyer.toLowerCase(),
      destinationId: destId,
      transactionHash: txHash,
      tokenId: Number(tokenId),
      pricePaid: formatEther(pricePaid),
      status: 'Confirmed',
      bookingReference: fields.bookingReference,
      departureDate: fields.departureDate,
      departureTime: fields.departureTime,
      travelClass: 'economy',
      seatNumber: fields.seatNumber,
      availabilityStatus: 'confirmed',
      flightNumber: fields.flightNumber,
      launchTerminal: fields.launchTerminal,
      createdAt: new Date(Number(log.blockNumber) * 1000),
      updatedAt: new Date(),
    };

    await bookingsColl.insertOne(booking);

    // Also push to user's tickets array if not already there
    await usersColl.updateOne(
      { _id: user._id, 'tickets.tokenId': { $ne: Number(tokenId) } },
      {
        $push: {
          tickets: {
            destinationId: destId,
            txHash,
            tokenId: Number(tokenId),
            purchasedAt: new Date(),
          },
        },
      },
    );

    created++;
    console.log(`  Created booking for token #${tokenId} (buyer: ${buyer.slice(0, 6)}..., dest: ${destId}, tx: ${txHash.slice(0, 10)}...)`);
  }

  console.log(`\nDone. Created: ${created}, Skipped (already in DB): ${skipped}, No user found: ${noUser}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
