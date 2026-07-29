'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { TICKET_SALE_ADDRESS, TICKET_SALE_ABI } from '@/lib/contract';
import { parseEther, decodeEventLog, createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { getTransactionReceipt } from 'viem/actions';
import type { TransactionReceipt, Log } from 'viem';

const TX_HASH_KEY = 'solarexpress_pending_tx';
const PREPARING_KEY = 'solarexpress_preparing';

export type TicketStep = 'idle' | 'preparing' | 'pending' | 'broadcasting' | 'confirming' | 'success' | 'error';

export type BuyTicketResult = {
  transactionHash: `0x${string}`;
  tokenId: number;
};

export function useBuyTicket() {
  const [manualReceipt, setManualReceipt] = useState<TransactionReceipt | null>(null);
  const [manualTokenId, setManualTokenId] = useState<number | null>(null);
  const [restoredHash, setRestoredHash] = useState<`0x${string}` | null>(null);
  const checkingRef = useRef(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(TX_HASH_KEY);
    if (saved) {
      try {
        setRestoredHash(saved as `0x${string}`);
      } catch {
        sessionStorage.removeItem(TX_HASH_KEY);
      }
    }
  }, []);

  const {
    writeContractAsync,
    data: txHash,
    isPending,
    reset: resetWrite,
  } = useWriteContract();

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
        transport: http(),
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
      setRestoredHash(null);
    }
  }, [resolvedIsConfirmed, resolvedTokenId]);

  async function buyTicket(
    destinationId: number,
    priceEth: string,
    metadataURI = '',
  ): Promise<BuyTicketResult | null> {
    try {
      resetWrite();
      sessionStorage.removeItem(TX_HASH_KEY);
      setRestoredHash(null);
      setManualReceipt(null);
      setManualTokenId(null);
      setPreparing(true);
      const hash = await writeContractAsync({
        address: TICKET_SALE_ADDRESS,
        abi: TICKET_SALE_ABI,
        functionName: 'buyTicket',
        args: [BigInt(destinationId), metadataURI],
        value: parseEther(priceEth),
      });
      setPreparing(false);
      return { transactionHash: hash, tokenId: 0 };
    } catch {
      setPreparing(false);
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
  else if (activeHash) step = 'broadcasting';

  return {
    buyTicket,
    step,
    txHash: activeHash,
    tokenId: resolvedTokenId,
    error: txError,
    reset: () => { setPreparing(false); resetWrite(); },
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
