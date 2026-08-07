'use client';

import { useReadContract, useConnection } from 'wagmi';
import { TICKET_NFT_ADDRESS, TICKET_NFT_ABI } from '@/lib/contract';
import type { Address } from 'viem';

function useEnabled() {
  const { isConnected, address } = useConnection();
  return { ready: isConnected && !!address, address };
}

export function useTicketData(tokenId: bigint | undefined) {
  const { ready } = useEnabled();
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: TICKET_NFT_ADDRESS,
    abi: TICKET_NFT_ABI,
    functionName: 'tickets',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined && ready },
  });

  if (isError) console.error('[useTicketData] RPC error:', error?.message);

  return {
    ticketData: data as { destinationId: bigint; timestamp: bigint } | undefined,
    isLoading,
    isError,
    refetch,
  };
}

export function useOwnerOf(tokenId: bigint | undefined) {
  const { ready } = useEnabled();
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: TICKET_NFT_ADDRESS,
    abi: TICKET_NFT_ABI,
    functionName: 'ownerOf',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined && ready },
  });

  if (isError) console.error('[useOwnerOf] RPC error:', error?.message);

  return {
    owner: data as Address | undefined,
    isLoading,
    isError,
    refetch,
  };
}

export function useTokenURI(tokenId: bigint | undefined) {
  const { ready } = useEnabled();
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: TICKET_NFT_ADDRESS,
    abi: TICKET_NFT_ABI,
    functionName: 'tokenURI',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined && ready },
  });

  if (isError) console.error('[useTokenURI] RPC error:', error?.message);

  return {
    tokenURI: data as string | undefined,
    isLoading,
    isError,
    refetch,
  };
}

export function useBalanceOf(owner: Address | undefined) {
  const { ready } = useEnabled();
  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: TICKET_NFT_ADDRESS,
    abi: TICKET_NFT_ABI,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    query: { enabled: !!owner && ready },
  });

  if (isError) console.error('[useBalanceOf] RPC error:', error?.message);

  return {
    balance: (data as bigint | undefined) ?? 0n,
    isLoading,
    isError,
    refetch,
  };
}
