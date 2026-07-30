import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { sepolia } from 'viem/chains';
import { TICKET_SALE_ADDRESS } from '@/lib/contract';
import { bodies } from '@/data/bodies';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const SEPOLIA_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';

async function predictNextTokenId(): Promise<number> {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(SEPOLIA_RPC),
  });

  const eventAbi = parseAbiItem(
    'event TicketPurchased(uint256 indexed tokenId, address indexed buyer, uint256 indexed destinationId, uint256 pricePaid)',
  );

  const tokenIds: number[] = [];

  try {
    const fromBlock = 6780000n;
    const latestBlock = await publicClient.getBlockNumber();
    const chunkSize = 50000n;

    for (let start = fromBlock; start < latestBlock; start += chunkSize) {
      const end = start + chunkSize > latestBlock ? latestBlock : start + chunkSize;
      const logs = await publicClient.getLogs({
        address: TICKET_SALE_ADDRESS,
        event: eventAbi,
        fromBlock: start,
        toBlock: end,
      });
      for (const log of logs) {
        if ('args' in log && log.args.tokenId !== undefined) {
          tokenIds.push(Number(log.args.tokenId));
        }
      }
    }
  } catch {
    const logs = await publicClient.getLogs({
      address: TICKET_SALE_ADDRESS,
      event: eventAbi,
      fromBlock: 0n,
      toBlock: 'latest',
    });
    for (const log of logs) {
      if ('args' in log && log.args.tokenId !== undefined) {
        tokenIds.push(Number(log.args.tokenId));
      }
    }
  }

  return tokenIds.length > 0 ? Math.max(...tokenIds) + 1 : 0;
}

export async function POST(req: NextRequest) {
  try {
    const { destinationId, priceEth, walletAddress } = await req.json();

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

    const { renderToString } = await import('react-dom/server');
    const { default: NFTTicket } = await import('@/components/nft/NFTTicket');

    const svg = renderToString(
      <NFTTicket
        destinationId={destinationId}
        tokenId={predictedTokenId}
        priceEth={priceEth}
        walletAddress={walletAddress}
      />,
    );

    const fullSvg = `<?xml version="1.0" encoding="UTF-8"?>${svg}`;

    const ticketName = `SolarExpress Ticket #${predictedTokenId}`;
    const attributes = [
      { trait_type: 'Destination', value: body.name },
      { trait_type: 'Passenger Class', value: 'Economy' },
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
