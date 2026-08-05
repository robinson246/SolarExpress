const { createPublicClient, http, parseAbiItem, parseEther, decodeEventLog } = require('viem');
const { sepolia } = require('viem/chains');

const SALE_CONTRACT = process.env.SALE_CONTRACT_ADDRESS || '0xA3E410c1A85Ae21774a6aF2D54a818BaedF19eCE';

const RPC_URLS = [
  'https://ethereum-sepolia.publicnode.com',
  'https://1rpc.io/sepolia',
  'https://sepolia.drpc.org',
  'https://sepolia.gateway.tenderly.co',
];

const ticketPurchasedEvent = parseAbiItem(
  'event TicketPurchased(uint256 indexed tokenId, address indexed buyer, uint256 indexed destinationId, uint256 pricePaid)',
);

/// Verify that a booking corresponds to a real, successful on-chain purchase
/// on Sepolia against the SolarExpress sale contract. Prevents forged bookings.
async function verifyPurchase({ transactionHash, walletAddress, destinationId, tokenId, pricePaid }) {
  if (!transactionHash || !/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
    return { ok: false, error: 'Invalid transaction hash' };
  }

  const client = createPublicClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL || RPC_URLS[0], { timeout: 15000 }),
  });

  const receipt = await client.getTransactionReceipt({ hash: transactionHash }).catch(() => null);
  if (!receipt || receipt.status !== 'success') {
    return { ok: false, error: 'Transaction not found or not successful on Sepolia' };
  }

  let match = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== SALE_CONTRACT.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: [ticketPurchasedEvent],
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === 'TicketPurchased') {
        match = decoded.args;
        break;
      }
    } catch {
      // Not a TicketPurchased log; skip.
    }
  }

  if (!match) {
    return { ok: false, error: 'No TicketPurchased event found in transaction' };
  }

  if (match.buyer.toLowerCase() !== String(walletAddress).toLowerCase()) {
    return { ok: false, error: 'Buyer does not match wallet address' };
  }
  if (match.tokenId !== BigInt(tokenId)) {
    return { ok: false, error: 'Token ID mismatch' };
  }
  if (match.destinationId !== BigInt(destinationId)) {
    return { ok: false, error: 'Destination mismatch' };
  }
  if (match.pricePaid !== parseEther(String(pricePaid))) {
    return { ok: false, error: 'Price paid mismatch' };
  }

  return { ok: true };
}

module.exports = { verifyPurchase };
