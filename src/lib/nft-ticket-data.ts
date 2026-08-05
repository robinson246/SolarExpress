import { createPublicClient, fallback, http, formatEther, parseAbiItem, parseEther, type PublicClient } from 'viem';
import { sepolia } from 'viem/chains';
import { TICKET_NFT_ADDRESS, TICKET_NFT_ABI } from '@/lib/contract';
import { SEPOLIA_RPC_URLS } from '@/lib/rpc';
import { bodies } from '@/data/bodies';

const ticketPurchasedEvent = parseAbiItem(
  'event TicketPurchased(uint256 indexed tokenId, address indexed buyer, uint256 indexed destinationId, uint256 pricePaid)',
);

const SECONDS_PER_BLOCK = 12n;
const BLOCK_LOOKBACK_MARGIN = 50000n;
const LOG_WINDOW = 6n;

export function createClient() {
  return createPublicClient({
    chain: sepolia,
    transport: fallback(SEPOLIA_RPC_URLS.map(url => http(url, { timeout: 5000 })), { rank: true }),
  });
}

// Find the first block whose timestamp is >= the ticket's mint timestamp. The
// TicketPurchased log is emitted in the same transaction as the mint, so the log
// is within a few blocks of this block. A narrow window keeps the eth_getLogs
// range small enough for RPCs that cap ranges (e.g. 1rpc.io limits to ~50 blocks).
async function findMintBlock(publicClient: PublicClient, mintTimestamp: bigint) {
  const latestBlock = await publicClient.getBlockNumber();
  const latestInfo = await publicClient.getBlock({ blockNumber: latestBlock });

  const elapsedBlocks = (latestInfo.timestamp - mintTimestamp) / SECONDS_PER_BLOCK;
  const estimatedMintBlock = elapsedBlocks > 0n ? latestBlock - elapsedBlocks : 0n;
  let low = estimatedMintBlock > BLOCK_LOOKBACK_MARGIN ? estimatedMintBlock - BLOCK_LOOKBACK_MARGIN : 0n;
  let high = latestBlock;

  while (low < high) {
    const mid = (low + high) / 2n;
    const block = await publicClient.getBlock({ blockNumber: mid });
    if (block.timestamp < mintTimestamp) low = mid + 1n;
    else high = mid;
  }
  return low;
}

export async function getTicketPriceEth(
  publicClient: PublicClient,
  tokenId: bigint,
  mintTimestamp: bigint,
  saleAddress: `0x${string}` | null,
): Promise<{ wei: bigint; eth: string } | null> {
  if (!saleAddress) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const mintBlock = await findMintBlock(publicClient, mintTimestamp);
      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock = mintBlock > LOG_WINDOW ? mintBlock - LOG_WINDOW : 0n;
      const toBlock = mintBlock + LOG_WINDOW < latestBlock ? mintBlock + LOG_WINDOW : latestBlock;

      const logs = await publicClient.getLogs({
        address: saleAddress,
        event: ticketPurchasedEvent,
        fromBlock,
        toBlock,
      });

      const purchaseLog = logs.find((log) => 'args' in log && log.args.tokenId === tokenId);
      if (purchaseLog && 'args' in purchaseLog && purchaseLog.args.pricePaid !== undefined) {
        const wei = purchaseLog.args.pricePaid as bigint;
        return { wei, eth: formatEther(wei) };
      }
      return null;
    } catch {
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }
  return null;
}

const destinationPriceFragment = {
  type: 'function',
  name: 'destinationPrice',
  stateMutability: 'view',
  inputs: [
    { name: '', type: 'uint256' },
    { name: '', type: 'uint8' },
  ],
  outputs: [{ name: '', type: 'uint256' }],
} as const;

// The sale contract stores authoritative per-destination, per-class prices.
// TravelClass enum: 0 = Economy, 1 = Business, 2 = First.
async function getClassPrices(
  publicClient: PublicClient,
  saleAddress: `0x${string}`,
  destinationId: number,
): Promise<{ economy: bigint; business: bigint } | null> {
  try {
    const [economy, business] = await Promise.all([
      publicClient.readContract({
        address: saleAddress,
        abi: [destinationPriceFragment],
        functionName: 'destinationPrice',
        args: [BigInt(destinationId), 0],
      }),
      publicClient.readContract({
        address: saleAddress,
        abi: [destinationPriceFragment],
        functionName: 'destinationPrice',
        args: [BigInt(destinationId), 1],
      }),
    ]);
    return { economy: economy as bigint, business: business as bigint };
  } catch {
    return null;
  }
}

function inferPassengerClass(
  priceWei: bigint | null,
  prices: { economy: bigint; business: bigint } | null,
): string {
  if (priceWei === null || !prices) return 'economy';
  if (priceWei === prices.economy) return 'economy';
  if (priceWei === prices.business) return 'business';
  return 'economy';
}

// Fallback price source when the sale contract is unreachable. Mirrors the
// app's own pricing (economy = catalog price, business = 2.5x), so class
// inference stays correct during RPC outages.
function getFallbackPrices(
  body: TicketData['body'],
): { economy: bigint; business: bigint } | null {
  if (!body) return null;
  try {
    const economy = parseEther(body.priceEth);
    return { economy, business: (economy * 5n) / 2n };
  } catch {
    return null;
  }
}

export type TicketData = {
  destinationId: number;
  body: { id: number; name: string; type: string; priceEth: string; color?: string; description?: string } | undefined;
  owner: `0x${string}` | null;
  priceEth: string;
  passengerClass: string;
  timestamp: bigint;
};

const DATA_CACHE_TTL_MS = 60_000;
const dataCache = new Map<string, { ts: number; data: TicketData }>();

// Ticket data is immutable once minted (destination, class, price are set
// on-chain at mint time), so caching computed lookups is safe and shields the
// free public RPCs from repeated log scans / block searches.
export async function findTicketData(tokenId: bigint): Promise<TicketData> {
  const key = tokenId.toString();
  const now = Date.now();
  const hit = dataCache.get(key);
  if (hit && now - hit.ts < DATA_CACHE_TTL_MS) return hit.data;

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const data = await computeTicketData(tokenId);
      dataCache.set(key, { ts: Date.now(), data });
      return data;
    } catch (err) {
      lastError = err;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function computeTicketData(tokenId: bigint): Promise<TicketData> {
  const publicClient = createClient();

  // Read the sale contract from the NFT itself (single source of truth wired
  // on-chain) instead of relying on env vars, so metadata always matches the
  // sale contract that actually minted the ticket.
  const [ticketData, owner, saleAddress] = await Promise.all([
    publicClient.readContract({
      address: TICKET_NFT_ADDRESS,
      abi: TICKET_NFT_ABI,
      functionName: 'tickets',
      args: [tokenId],
    }),
    publicClient.readContract({
      address: TICKET_NFT_ADDRESS,
      abi: TICKET_NFT_ABI,
      functionName: 'ownerOf',
      args: [tokenId],
    }).catch(() => null),
    publicClient.readContract({
      address: TICKET_NFT_ADDRESS,
      abi: TICKET_NFT_ABI,
      functionName: 'saleContract',
    }).catch(() => null),
  ]);

  const [destinationIdRaw, timestamp] = ticketData;
  const destinationId = Number(destinationIdRaw);
  const body = bodies.find((entry) => entry.id === destinationId);

  const [purchase, contractPrices] = await Promise.all([
    getTicketPriceEth(publicClient, tokenId, timestamp, saleAddress),
    saleAddress ? getClassPrices(publicClient, saleAddress, destinationId) : Promise.resolve(null),
  ]);

  const prices = contractPrices ?? getFallbackPrices(body);
  const priceEth = purchase?.eth ?? '0';

  return {
    destinationId,
    body,
    owner,
    priceEth,
    passengerClass: inferPassengerClass(purchase?.wei ?? null, prices),
    timestamp,
  };
}
