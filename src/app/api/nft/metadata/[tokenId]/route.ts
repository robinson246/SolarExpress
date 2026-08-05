import { NextResponse } from 'next/server';
import { findTicketData } from '@/lib/nft-ticket-data';

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { ts: number; data: unknown }>();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  try {
    const { tokenId: tokenIdParam } = await params;
    if (!/^[1-9]\d*$/.test(tokenIdParam)) {
      return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
    }
    const tokenId = BigInt(tokenIdParam);

    const now = Date.now();
    const cached = cache.get(tokenIdParam);
    if (cached && now - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
      });
    }

    const ticket = await findTicketData(tokenId);
    const body = ticket.body;

    if (!body) {
      return NextResponse.json({ error: 'Unknown destination' }, { status: 404 });
    }

    const origin = new URL(req.url).origin;

    const attributes: Record<string, string>[] = [
      { trait_type: 'Destination', value: body.name },
      { trait_type: 'Passenger Class', value: ticket.passengerClass },
      { trait_type: 'Token ID', value: String(tokenId) },
      { trait_type: 'Network', value: 'Sepolia' },
    ];
    if (ticket.priceEth && ticket.priceEth !== '0') {
      attributes.push({ trait_type: 'Price', value: `${ticket.priceEth} ETH` });
    }

    const data = {
      name: `SolarExpress Ticket #${tokenId}`,
      description: `Official SolarExpress Interplanetary Boarding Pass to ${body.name}.`,
      image: `${origin}/api/nft/image/${tokenId}?v=3`,
      external_url: 'https://solar-express.vercel.app',
      attributes,
    };

    // If the on-chain price could not be read (RPC outage), this response is
    // degraded. Don't cache it long so a later successful fetch can fix it.
    const degraded = ticket.priceEth === '0';

    if (!degraded) {
      cache.set(tokenIdParam, { ts: Date.now(), data });
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': degraded
          ? 'no-store'
          : 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}