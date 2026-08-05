import { NextResponse } from 'next/server';
import { createPublicClient, fallback, http, formatEther, parseAbiItem, type PublicClient } from 'viem';
import { sepolia } from 'viem/chains';
import { TICKET_NFT_ADDRESS, TICKET_NFT_ABI } from '@/lib/contract';
import { bodies } from '@/data/bodies';
import { generateNFTTicketSVG } from '@/lib/generate-nft-svg';

const RPC_URLS = [
  'https://ethereum-sepolia.publicnode.com',
  'https://1rpc.io/sepolia',
  'https://sepolia.drpc.org',
  'https://sepolia.gateway.tenderly.co',
];

const ticketPurchasedEvent = parseAbiItem(
  'event TicketPurchased(uint256 indexed tokenId, address indexed buyer, uint256 indexed destinationId, uint256 pricePaid)',
);

const SECONDS_PER_BLOCK = 12n;
const BLOCK_LOOKBACK_MARGIN = 50000n;
const LOG_WINDOW = 6n;

export const dynamic = 'force-dynamic';

function createClient() {
  return createPublicClient({
    chain: sepolia,
    transport: fallback(RPC_URLS.map(url => http(url, { timeout: 5000 })), { rank: true }),
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

async function getTicketPriceEth(
  publicClient: PublicClient,
  tokenId: bigint,
  mintTimestamp: bigint,
  saleAddress: `0x${string}` | null,
) {
  if (!saleAddress) return '0';
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
    return purchaseLog && 'args' in purchaseLog && purchaseLog.args.pricePaid !== undefined
      ? formatEther(purchaseLog.args.pricePaid)
      : '0';
  } catch {
    return '0';
  }
}

async function findTicketData(tokenId: bigint) {
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
  const priceEth = await getTicketPriceEth(publicClient, tokenId, timestamp, saleAddress);

  return {
    destinationId,
    body,
    owner,
    priceEth,
    timestamp,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  try {
    const { tokenId: tokenIdParam } = await params;
    const tokenId = BigInt(tokenIdParam);

    const ticket = await findTicketData(tokenId);
    const body = ticket.body;

    if (!body) {
      return NextResponse.json({ error: 'Unknown destination' }, { status: 404 });
    }

    const svg = generateNFTTicketSVG({
      destinationId: ticket.destinationId,
      tokenId: Number(tokenId),
      priceEth: ticket.priceEth,
      walletAddress: ticket.owner ?? undefined,
      passengerClass: 'economy',
    });

    const image = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

    return NextResponse.json({
      name: `SolarExpress Ticket #${tokenId}`,
      description: `Official SolarExpress Interplanetary Boarding Pass to ${body.name}.`,
      image,
      external_url: 'https://solarexpress.app',
      attributes: [
        { trait_type: 'Destination', value: body.name },
        { trait_type: 'Token ID', value: String(tokenId) },
        { trait_type: 'Price', value: `${ticket.priceEth} ETH` },
        { trait_type: 'Network', value: 'Sepolia' },
      ],
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}