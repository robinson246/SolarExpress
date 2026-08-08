import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, fallback } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { TICKET_NFT_ADDRESS, TICKET_NFT_ABI } from '@/lib/contract';
import { SEPOLIA_RPC_URLS } from '@/lib/rpc';

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const RPC_TIMEOUT_MS = 5_000;

function normalizePrivateKey(key: string): `0x${string}` {
  let k = key.trim();
  if (!k.startsWith('0x')) k = `0x${k}`;
  return k as `0x${string}`;
}

export async function POST(req: NextRequest) {
  try {
    const { tokenId, metadataUri } = await req.json();

    if (typeof tokenId !== 'number' || !Number.isInteger(tokenId) || tokenId < 1) {
      return NextResponse.json(
        { error: 'Missing or invalid field: tokenId (positive integer)' },
        { status: 400 },
      );
    }

    if (typeof metadataUri !== 'string' || !metadataUri.startsWith('ipfs://')) {
      return NextResponse.json(
        { error: 'Missing or invalid field: metadataUri (must be an ipfs:// URI)' },
        { status: 400 },
      );
    }

    if (!PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, error: 'PRIVATE_KEY is not configured on the server' },
        { status: 503 },
      );
    }

    const account = privateKeyToAccount(normalizePrivateKey(PRIVATE_KEY));
    const transport = fallback(
      SEPOLIA_RPC_URLS.map(url => http(url, { timeout: RPC_TIMEOUT_MS })),
      { rank: true },
    );

    const walletClient = createWalletClient({ account, chain: sepolia, transport });

    const txHash = await walletClient.writeContract({
      address: TICKET_NFT_ADDRESS,
      abi: TICKET_NFT_ABI,
      functionName: 'setTokenURI',
      args: [BigInt(tokenId), metadataUri],
    });

    return NextResponse.json({ success: true, txHash, tokenId });
  } catch (err) {
    console.error('[set-token-uri] Error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
