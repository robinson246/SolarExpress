'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useChainId, useAccount } from 'wagmi';
import { TICKET_SALE_ADDRESS, TICKET_SALE_ABI, TICKET_NFT_ADDRESS, TICKET_NFT_ABI } from '@/lib/contract';
import { parseEther, decodeEventLog, createPublicClient, http, fallback } from 'viem';
import { sepolia } from 'viem/chains';
import { getTransactionReceipt } from 'viem/actions';
import { generateNFTMetadata } from '@/lib/nft-service';
import type { TransactionReceipt, Log } from 'viem';

const TX_HASH_KEY = 'solarexpress_pending_tx';

const baseTokenURIFragment = {
  type: 'function',
  name: 'baseTokenURI',
  stateMutability: 'view',
  inputs: [],
  outputs: [{ name: '', type: 'string' }],
} as const;

// Prime the CDN/edge cache for a freshly minted token so NFT crawlers
// (Etherscan) get an instant response instead of a cold serverless start.
async function warmNftCache(tokenId: number) {
  try {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http('https://ethereum-sepolia.publicnode.com', { timeout: 5000 }),
    });
    const base = (await publicClient.readContract({
      address: TICKET_NFT_ADDRESS,
      abi: [baseTokenURIFragment],
      functionName: 'baseTokenURI',
    })) as string;
    const imageBase = base.replace(/\/metadata\/$/, '/image/');
    await Promise.all([
      fetch(`${base}${tokenId}`, { mode: 'no-cors' }),
      fetch(`${imageBase}${tokenId}?v=2`, { mode: 'no-cors' }),
    ]);
  } catch {
    // Warming is best-effort; ignore failures.
  }
}

export type TicketStep = 'idle' | 'preparing' | 'pending' | 'broadcasting' | 'confirming' | 'success' | 'error';

export type BuyTicketResult = {
  transactionHash: `0x${string}`;
  tokenId: number;
};

export function useBuyTicket() {
  const [manualReceipt, setManualReceipt] = useState<TransactionReceipt | null>(null);
  const [manualTokenId, setManualTokenId] = useState<number | null>(null);
  const [restoredHash, setRestoredHash] = useState<`0x${string}` | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(TX_HASH_KEY) as `0x${string}` | null;
    } catch {
      return null;
    }
  });
  const [writeError, setWriteError] = useState<Error | null>(null);
  const checkingRef = useRef(false);
  const purchaseRef = useRef<{ destinationId: number; priceEth: string; travelClass: string } | null>(null);

  const {
    writeContractAsync,
    data: txHash,
    isPending,
    reset: resetWrite,
  } = useWriteContract();

  const { writeContractAsync: writeTokenUriAsync } = useWriteContract();
  const { address: connectedAddress } = useAccount();

  const { switchChainAsync } = useSwitchChain();
  const activeChainId = useChainId();

  const activeHash = txHash || restoredHash;

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isTxError,
    error: txError,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash: activeHash ?? undefined,
  });

  const resolvedIsConfirmed = isConfirmed || manualReceipt !== null;
  const resolvedTokenId = (isConfirmed ? extractTokenId(receipt) : null) || manualTokenId;

  function extractTokenIdFromLogs(logs: Log[]): number | null {
    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: TICKET_SALE_ABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'TicketPurchased') {
          return Number(decoded.args.tokenId);
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  const checkReceipt = useCallback(async () => {
    if (!activeHash) return;
    if (checkingRef.current) return;
    checkingRef.current = true;
    try {
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: fallback([
          http('https://ethereum-sepolia.publicnode.com'),
          http('https://1rpc.io/sepolia'),
          http('https://sepolia.drpc.org'),
          http('https://sepolia.gateway.tenderly.co'),
        ], { rank: true }),
      });
      const rcpt = await getTransactionReceipt(publicClient, { hash: activeHash });
      if (rcpt && rcpt.status === 'success') {
        setManualReceipt(rcpt);
        const tid = extractTokenIdFromLogs(rcpt.logs);
        if (tid !== null) setManualTokenId(tid);
        sessionStorage.removeItem(TX_HASH_KEY);
      } else if (rcpt && rcpt.status === 'reverted') {
        setManualReceipt(null);
      }
    } catch {
    } finally {
      checkingRef.current = false;
    }
  }, [activeHash]);

  useEffect(() => {
    if (activeHash) {
      sessionStorage.setItem(TX_HASH_KEY, activeHash);
    }
  }, [activeHash]);

  useEffect(() => {
    if (resolvedIsConfirmed && resolvedTokenId !== null) {
      sessionStorage.removeItem(TX_HASH_KEY);
      const purchase = purchaseRef.current;
      void (async () => {
        if (purchase) {
          try {
            const result = await generateNFTMetadata(
              purchase.destinationId,
              purchase.priceEth,
              connectedAddress,
              purchase.travelClass,
              resolvedTokenId,
            );
            if (result.success && result.metadataUri.startsWith('ipfs://')) {
              try {
                const uriHash = await writeTokenUriAsync({
                  address: TICKET_NFT_ADDRESS,
                  abi: TICKET_NFT_ABI,
                  functionName: 'setTokenURI',
                  args: [BigInt(resolvedTokenId), result.metadataUri],
                  chainId: sepolia.id,
                });
                console.log('[useBuyTicket] setTokenURI submitted:', uriHash);
              } catch {
                console.warn('[useBuyTicket] setTokenURI failed (is the connected wallet the contract owner?); keeping baseTokenURI rendering.');
                void warmNftCache(resolvedTokenId);
              }
              return;
            }
          } catch {
            console.warn('[useBuyTicket] IPFS metadata publish failed; falling back to CDN warm.');
          }
        }
        void warmNftCache(resolvedTokenId);
      })();
    }
  }, [resolvedIsConfirmed, resolvedTokenId, connectedAddress]);

  async function buyTicket(
    destinationId: number,
    priceEth: string,
    travelClass = 'economy',
  ): Promise<BuyTicketResult | null> {
    try {
      resetWrite();
      setWriteError(null);
      sessionStorage.removeItem(TX_HASH_KEY);
      setRestoredHash(null);
      setManualReceipt(null);
      setManualTokenId(null);
      setPreparing(true);
      purchaseRef.current = { destinationId, priceEth, travelClass };
      const classId = travelClass === 'business' ? 1 : travelClass === 'first' ? 2 : 0;
      if (activeChainId !== sepolia.id) {
        await switchChainAsync({ chainId: sepolia.id });
      }
      const hash = await writeContractAsync({
        address: TICKET_SALE_ADDRESS,
        abi: TICKET_SALE_ABI,
        functionName: 'buyTicket',
        args: [BigInt(destinationId), classId],
        value: parseEther(priceEth),
        chainId: sepolia.id,
        gas: 500_000n,
      });
      setPreparing(false);
      return { transactionHash: hash, tokenId: 0 };
    } catch (err) {
      setPreparing(false);
      setWriteError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }

  const [preparing, setPreparing] = useState(false);

  let step: TicketStep = 'idle';
  if (preparing && !isPending && !activeHash) step = 'preparing';
  else if (isPending) step = 'pending';
  else if (activeHash && !isConfirming && !isConfirmed && !isTxError) step = 'broadcasting';
  else if (isConfirming && !resolvedIsConfirmed) step = 'confirming';
  else if (resolvedIsConfirmed) step = 'success';
  else if (isTxError) step = 'error';
  else if (writeError && !activeHash) step = 'error';
  else if (activeHash) step = 'broadcasting';

  return {
    buyTicket,
    step,
    txHash: activeHash,
    tokenId: resolvedTokenId,
    error: txError,
    writeError,
    reset: () => { setPreparing(false); setWriteError(null); resetWrite(); },
    checkReceipt,
  };
}

function extractTokenId(receipt: TransactionReceipt | null | undefined): number | null {
  if (!receipt?.logs) return null;
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: TICKET_SALE_ABI,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === 'TicketPurchased') {
        return Number(decoded.args.tokenId);
      }
    } catch {
      continue;
    }
  }
  return null;
}
