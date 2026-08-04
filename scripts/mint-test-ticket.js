// scripts/mint-test-ticket.js
// 1) Sets destination prices on TicketSale (matching src/data/bodies.ts so the
//    frontend's prices match on-chain), 2) buys one economy ticket to mint the
//    NFT for testing the metadata endpoint.
// Expects env vars (set as GitHub secrets):
//   SALE_ADDRESS, SEPOLIA_RPC_URL, PRIVATE_KEY
// Optional: TEST_DESTINATION_ID (default 5 = Mars)

const { createPublicClient, createWalletClient, http, fallback, parseAbi, parseEther } = require('viem');
const { sepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const saleAbi = parseAbi([
  'function setDestinationPrices(uint8 travelClass, uint256[] destinationIds, uint256[] pricesWei)',
  'function buyTicket(uint256 destinationId, uint8 travelClass) payable returns (uint256)',
]);

// destinationId => economy priceEth (must match src/data/bodies.ts)
const PRICES = {
  1: '0.004', 2: '0.006', 3: '0.001', 4: '0.002', 5: '0.010',
  6: '0.012', 7: '0.011', 8: '0.035', 9: '0.038', 10: '0.040',
  11: '0.039', 12: '0.037', 13: '0.050', 14: '0.055', 15: '0.052',
  16: '0.080', 17: '0.082', 18: '0.095', 19: '0.097', 20: '0.120',
};

const RPC_URLS = [
  process.env.SEPOLIA_RPC_URL,
  'https://ethereum-sepolia.publicnode.com',
  'https://rpc.sepolia.org',
  'https://sepolia.drpc.org',
].filter(Boolean);

function normalizePrivateKey(key) {
  let k = key.trim();
  if (!k.startsWith('0x')) k = '0x' + k;
  return k;
}

async function main() {
  const sale = (process.env.SALE_ADDRESS || '').trim();
  const rpc = (process.env.SEPOLIA_RPC_URL || '').trim();
  const key = normalizePrivateKey(process.env.PRIVATE_KEY || '');

  if (!sale || !rpc || !key) {
    console.error('Missing required env vars. Required: SALE_ADDRESS, SEPOLIA_RPC_URL, PRIVATE_KEY');
    process.exit(1);
  }

  const destinationId = process.env.TEST_DESTINATION_ID ? Number(process.env.TEST_DESTINATION_ID) : 5;
  if (!PRICES[destinationId]) {
    console.error(`Unknown TEST_DESTINATION_ID ${destinationId}. Valid: ${Object.keys(PRICES).join(', ')}`);
    process.exit(1);
  }

  const account = privateKeyToAccount(key);
  const publicClient = createPublicClient({ chain: sepolia, transport: fallback(RPC_URLS.map(u => http(u)), { rank: true }) });
  const walletClient = createWalletClient({ account, chain: sepolia, transport: fallback(RPC_URLS.map(u => http(u)), { rank: true }) });

  const ids = Object.keys(PRICES).map(Number);
  const economyWei = ids.map(id => parseEther(PRICES[id]));
  const businessWei = ids.map(id => (parseEther(PRICES[id]) * 5n) / 2n);

  console.log('Setting economy prices...');
  const tx1 = await walletClient.writeContract({
    address: sale, abi: saleAbi, functionName: 'setDestinationPrices',
    args: [0, ids, economyWei],
  });
  console.log('tx sent:', tx1);
  await publicClient.waitForTransactionReceipt({ hash: tx1 });
  console.log('economy prices set');

  console.log('Setting business prices...');
  const tx2 = await walletClient.writeContract({
    address: sale, abi: saleAbi, functionName: 'setDestinationPrices',
    args: [1, ids, businessWei],
  });
  console.log('tx sent:', tx2);
  await publicClient.waitForTransactionReceipt({ hash: tx2 });
  console.log('business prices set');

  const price = economyWei[ids.indexOf(destinationId)];
  console.log(`Buying economy ticket for destination ${destinationId} (${PRICES[destinationId]} ETH)...`);
  const tx3 = await walletClient.writeContract({
    address: sale, abi: saleAbi, functionName: 'buyTicket',
    args: [BigInt(destinationId), 0],
    value: price,
    gas: 500_000n,
  });
  console.log('buyTicket tx:', tx3);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: tx3 });
  console.log('buyTicket confirmed, status:', receipt.status);

  console.log('---');
  console.log('DESTINATION_ID=' + destinationId);
  console.log('TICKET_TX=' + tx3);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
