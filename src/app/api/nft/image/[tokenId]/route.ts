import { NextResponse } from 'next/server';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import { findTicketData } from '@/lib/nft-ticket-data';
import { generateNFTTicketSVG } from '@/lib/generate-nft-svg';

export const dynamic = 'force-dynamic';

const FONT_FILES = [
  path.join(process.cwd(), 'public/fonts/Roboto-Regular.ttf'),
  path.join(process.cwd(), 'public/fonts/Roboto-Bold.ttf'),
];

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
      return new NextResponse('Unknown destination', { status: 404 });
    }

    const svg = generateNFTTicketSVG({
      destinationId: ticket.destinationId,
      tokenId: Number(tokenId),
      priceEth: ticket.priceEth,
      walletAddress: ticket.owner ?? undefined,
      passengerClass: ticket.passengerClass,
    });

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'original' },
      font: {
        fontFiles: FONT_FILES,
        defaultFontFamily: 'Roboto',
        loadSystemFonts: false,
      },
    });
    const png = resvg.render().asPng();

    // Degraded responses (RPC outage while reading price/class) must not be
    // pinned in the CDN for a day; a retry shortly after will correct them.
    const degraded = ticket.priceEth === '0';

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': degraded
          ? 'public, max-age=60, s-maxage=60'
          : 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
