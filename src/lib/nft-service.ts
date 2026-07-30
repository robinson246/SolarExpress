export type GenerateMetadataResponse = {
  success: boolean;
  metadataUri: string;
  imageCid: string;
  predictedTokenId: number;
};

export async function generateNFTMetadata(
  destinationId: number,
  priceEth: string,
  walletAddress?: string,
): Promise<GenerateMetadataResponse> {
  const res = await fetch('/api/nft/generate-metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destinationId,
      priceEth,
      walletAddress,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Metadata generation failed (${res.status})`);
  }

  return res.json();
}
