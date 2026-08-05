import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import { createPublicClient, http, parseAbiItem, fallback } from 'viem';
import { sepolia } from 'viem/chains';
import { TICKET_SALE_ADDRESS } from '@/lib/contract';
import { bodies } from '@/data/bodies';
import { generateNFTTicketSVG } from '@/lib/generate-nft-svg';

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API = 'https://api.pinata.cloud';

const RPC_URLS = [
  'https://ethereum-sepolia.publicnode.com',
  'https://1rpc.io/sepolia',
  'https://sepolia.drpc.org',
  'https://sepolia.gateway.tenderly.co',
];

const RPC_TIMEOUT_MS = 5_000;
const RECENT_BLOCK_WINDOW = 60_000n;
const CHUNK_SIZE = 30_000n;

const FONT_FILES = [
  path.join(process.cwd(), 'public/fonts/Roboto-Regular.ttf'),
  path.join(process.cwd(), 'public/fonts/Roboto-Bold.ttf'),
];

export const maxDuration = 90;

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

function rasterizePng(svg: string): Uint8Array {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'original' },
    font: {
      fontFiles: FONT_FILES,
      defaultFontFamily: 'Roboto',
      loadSystemFonts: false,
    },
  });
  return resvg.render().asPng();
}

async function uploadImageToPinata(png: Uint8Array, name: string): Promise<string> {
  const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
  const form = new FormData();
  form.append('file', new Blob([png as BlobPart], { type: 'image/png' }), `${safeName}.png`);

  const res = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Pinata image upload failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  return data.IpfsHash as string;
}

async function uploadMetadataToPinata(metadata: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Pinata metadata upload failed (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  return data.IpfsHash as string;
}

export async function POST(req: NextRequest) {
  try {
    const { destinationId, priceEth, walletAddress, travelClass, tokenId } = await req.json();
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

    const resolvedTokenId =
      typeof tokenId === 'number' && Number.isInteger(tokenId) && tokenId >= 0
        ? tokenId
        : await predictNextTokenId();

    const fullSvg = generateNFTTicketSVG({
      destinationId,
      tokenId: resolvedTokenId,
      priceEth,
      walletAddress,
      passengerClass,
    });

    if (!PINATA_JWT) {
      return NextResponse.json(
        { success: false, error: 'PINATA_JWT is not configured', predictedTokenId: resolvedTokenId },
        { status: 503 },
      );
    }

    const png = rasterizePng(fullSvg);
    const imageCid = await uploadImageToPinata(png, `SolarExpress Ticket #${resolvedTokenId}`);

    const metadata = {
      name: `SolarExpress Ticket #${resolvedTokenId}`,
      description: `Official SolarExpress Interplanetary Boarding Pass to ${body.name}.`,
      image: `ipfs://${imageCid}`,
      external_url: 'https://solar-express.vercel.app',
      attributes: [
        { trait_type: 'Destination', value: body.name },
        { trait_type: 'Passenger Class', value: passengerClass },
        { trait_type: 'Price', value: `${priceEth} ETH` },
        { trait_type: 'Network', value: 'Sepolia' },
        { trait_type: 'Token ID', value: String(resolvedTokenId) },
      ],
    };

    const metadataCid = await uploadMetadataToPinata(metadata);

    return NextResponse.json({
      success: true,
      metadataUri: `ipfs://${metadataCid}`,
      imageCid,
      predictedTokenId: resolvedTokenId,
    });
  } catch (err) {
    console.error('[generate-metadata] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
