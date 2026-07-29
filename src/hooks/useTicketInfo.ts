'use client';

import { useReadContract } from 'wagmi';
import { TICKET_NFT_ADDRESS, TICKET_NFT_ABI } from '@/lib/contract';
import type { Address } from 'viem';

export function useTicketData(tokenId: bigint | undefined) {
  const { data: ticketData, isLoading, isError } = useReadContract({
    address: TICKET_NFT_ADDRESS,
    abi: TICKET_NFT_ABI,
    functionName: 'tickets',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });

  return {
    ticketData: ticketData as { destinationId: bigint; timestamp: bigint } | undefined,
    isLoading,
    isError,
  };
}

export function useOwnerOf(tokenId: bigint | undefined) {
  const { data: owner, isLoading, isError } = useReadContract({
    address: TICKET_NFT_ADDRESS,
    abi: TICKET_NFT_ABI,
    functionName: 'ownerOf',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });

  return {
    owner: owner as Address | undefined,
    isLoading,
    isError,
  };
}

export function useTokenURI(tokenId: bigint | undefined) {
  const { data: tokenURI, isLoading, isError } = useReadContract({
    address: TICKET_NFT_ADDRESS,
    abi: TICKET_NFT_ABI,
    functionName: 'tokenURI',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });

  return {
    tokenURI: tokenURI as string | undefined,
    isLoading,
    isError,
  };
}

export function useBalanceOf(owner: Address | undefined) {
  const { data: balance, isLoading, isError } = useReadContract({
    address: TICKET_NFT_ADDRESS,
    abi: TICKET_NFT_ABI,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    query: { enabled: !!owner },
  });

  return {
    balance: (balance as bigint | undefined) ?? 0n,
    isLoading,
    isError,
  };
}
