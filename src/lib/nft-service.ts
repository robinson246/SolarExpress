export type GenerateMetadataResponse = {
  success: boolean;
  metadataUri: string;
  imageCid: string;
  predictedTokenId: number;
};

const FETCH_TIMEOUT_MS = 90_000;

export async function generateNFTMetadata(
  destinationId: number,
  priceEth: string,
  walletAddress?: string,
  travelClass: string = 'economy',
  tokenId?: number,
): Promise<GenerateMetadataResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch('/api/nft/generate-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationId,
        priceEth,
        walletAddress,
        travelClass,
        tokenId,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || `Metadata generation failed (${res.status})`);
    }

    return res.json();
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(`Metadata generation timed out after ${FETCH_TIMEOUT_MS / 1000}s. Please try again.`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
