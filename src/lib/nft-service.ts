export type GenerateMetadataResponse = {
  success: boolean;
  metadataUri: string;
  imageCid: string;
  predictedTokenId: number;
};

const FETCH_TIMEOUT_MS = 90_000;

export type SetTokenURIResponse = {
  success: boolean;
  txHash?: `0x${string}`;
  tokenId?: number;
  error?: string;
};

export async function setTokenURIOnChain(
  tokenId: number,
  metadataUri: string,
): Promise<SetTokenURIResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch('/api/nft/set-token-uri', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId, metadataUri }),
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => null)) as SetTokenURIResponse | null;

    if (!res.ok || !data?.success) {
      throw new Error(data?.error || `setTokenURI failed (${res.status})`);
    }

    return data;
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(`setTokenURI timed out after ${FETCH_TIMEOUT_MS / 1000}s.`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

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
