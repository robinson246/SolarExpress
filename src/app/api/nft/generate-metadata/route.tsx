import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem, fallback } from 'viem';
import { sepolia } from 'viem/chains';
import { TICKET_SALE_ADDRESS } from '@/lib/contract';
import { bodies } from '@/data/bodies';
import { generateNFTTicketSVG } from '@/lib/generate-nft-svg';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const RPC_URLS = [
  'https://ethereum-sepolia.publicnode.com',
  'https://1rpc.io/sepolia',
  'https://sepolia.drpc.org',
  'https://sepolia.gateway.tenderly.co',
];

const RPC_TIMEOUT_MS = 5_000;
const RECENT_BLOCK_WINDOW = 60_000n;
const CHUNK_SIZE = 30_000n;

export const maxDuration = 60;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`RPC request timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function predictNextTokenId(): Promise<number> {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: fallback(
      RPC_URLS.map(url => http(url, { timeout: RPC_TIMEOUT_MS })),
      { rank: true },
    ),
  });

  const eventAbi = parseAbiItem(
    'event TicketPurchased(uint256 indexed tokenId, address indexed buyer, uint256 indexed destinationId, uint256 pricePaid)',
  );

  const tokenIds: number[] = [];

  try {
    const latestBlock = await withTimeout(publicClient.getBlockNumber(), RPC_TIMEOUT_MS);
    const fromBlock = latestBlock > RECENT_BLOCK_WINDOW ? latestBlock - RECENT_BLOCK_WINDOW : 6780000n;

    for (let start = fromBlock; start <= latestBlock; start += CHUNK_SIZE) {
      const end = start + CHUNK_SIZE > latestBlock ? latestBlock : start + CHUNK_SIZE;
      const logs = await withTimeout(
        publicClient.getLogs({
          address: TICKET_SALE_ADDRESS,
          event: eventAbi,
          fromBlock: start,
          toBlock: end,
        }),
        RPC_TIMEOUT_MS,
      );
      for (const log of logs) {
        if ('args' in log && log.args.tokenId !== undefined) {
          tokenIds.push(Number(log.args.tokenId));
        }
      }
    }
  } catch (err) {
    console.error('[generate-metadata] Could not predict next token ID, defaulting to 0:', err);
    return 0;
  }

  return tokenIds.length > 0 ? Math.max(...tokenIds) + 1 : 0;
}

export async function POST(req: NextRequest) {
  try {
    const { destinationId, priceEth, walletAddress, travelClass } = await req.json();
    const passengerClass = typeof travelClass === 'string' && travelClass.length > 0 ? travelClass : 'economy';

    if (destinationId == null || !priceEth) {
      return NextResponse.json(
        { error: 'Missing required fields: destinationId, priceEth' },
        { status: 400 },
      );
    }

    const body = bodies.find(b => b.id === destinationId);
    if (!body) {
      return NextResponse.json(
        { error: `Unknown destination: ${destinationId}` },
        { status: 400 },
      );
    }

    const predictedTokenId = await predictNextTokenId();

    const fullSvg = generateNFTTicketSVG({
      destinationId,
      tokenId: predictedTokenId,
      priceEth,
      walletAddress,
      passengerClass,
    });

    const ticketName = `SolarExpress Ticket #${predictedTokenId}`;
    const attributes = [
      { trait_type: 'Destination', value: body.name },
      { trait_type: 'Passenger Class', value: passengerClass },
      { trait_type: 'Price', value: `${priceEth} ETH` },
      { trait_type: 'Network', value: 'Sepolia' },
      { trait_type: 'Token ID', value: String(predictedTokenId) },
    ];

    const uploadRes = await fetch(`${BACKEND_URL}/api/pinata/upload-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        svgString: fullSvg,
        name: ticketName,
        description: `Official SolarExpress Interplanetary Boarding Pass to ${body.name}.`,
        externalUrl: 'https://solarexpress.app',
        attributes,
      }),
    });

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      console.error('[generate-metadata] Backend upload failed:', uploadRes.status, errBody);
      return NextResponse.json(
        { error: `Pinata upload failed: ${uploadRes.statusText}` },
        { status: 502 },
      );
    }

    const result = await uploadRes.json();

    return NextResponse.json({
      success: true,
      metadataUri: result.metadataUri,
      imageCid: result.imageCid,
      predictedTokenId,
    });
  } catch (err) {
    console.error('[generate-metadata] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
