import { NextResponse } from 'next/server';
import { createPublicClient, fallback, http, formatEther, parseAbiItem } from 'viem';
import { sepolia } from 'viem/chains';
import { TICKET_NFT_ADDRESS, TICKET_SALE_ADDRESS, TICKET_NFT_ABI } from '@/lib/contract';
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

export const dynamic = 'force-dynamic';

function createClient() {
  return createPublicClient({
    chain: sepolia,
    transport: fallback(RPC_URLS.map(url => http(url, { timeout: 5000 })), { rank: true }),
  });
}

async function findTicketData(tokenId: bigint) {
  const publicClient = createClient();

  const [ticketData, owner, logs] = await Promise.all([
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
    publicClient.getLogs({
      address: TICKET_SALE_ADDRESS,
      event: ticketPurchasedEvent,
      fromBlock: 0n,
      toBlock: 'latest',
    }),
  ]);

  const purchaseLog = logs.find((log) => 'args' in log && log.args.tokenId === tokenId);
  const [destinationIdRaw] = ticketData;
  const destinationId = Number(destinationIdRaw);
  const body = bodies.find((entry) => entry.id === destinationId);
  const priceEth = purchaseLog && 'args' in purchaseLog && purchaseLog.args.pricePaid !== undefined
    ? formatEther(purchaseLog.args.pricePaid)
    : '0';

  return {
    destinationId,
    body,
    owner,
    priceEth,
    timestamp: ticketData[1],
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