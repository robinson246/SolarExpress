// scripts/wire-with-viem.js
// Wire SolarExpressTicket (setSaleContract, setBaseTokenURI) and
// BookingHistory (setSaleContract) so the whole purchase flow works.
// Expects these environment variables (set as GitHub secrets in workflow):
// NFT_ADDRESS, SALE_ADDRESS, BASE_TOKEN_URI, SEPOLIA_RPC_URL, PRIVATE_KEY

const { createPublicClient, createWalletClient, http, fallback, parseAbi } = require('viem');
const { sepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const nftAbi = parseAbi([
  'function setSaleContract(address _saleContract)',
  'function setBaseTokenURI(string _baseTokenURI)'
]);

const saleAbi = parseAbi([
  'function bookingHistory() view returns (address)'
]);

const bookingHistoryAbi = parseAbi([
  'function saleContract() view returns (address)',
  'function setSaleContract(address _saleContract)'
]);

const RPC_URLS = [
  process.env.SEPOLIA_RPC_URL,
  'https://ethereum-sepolia.publicnode.com',
  'https://rpc.sepolia.org',
  'https://sepolia.drpc.org',
  'https://sepolia.gateway.tenderly.co',
].filter(Boolean);

function normalizePrivateKey(key) {
  let k = key.trim();
  if (!k.startsWith('0x')) k = '0x' + k;
  return k;
}

async function waitForMined(publicClient, hash, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash });
      if (receipt && receipt.status === 'success') return receipt;
      if (receipt && receipt.status === 'reverted') throw new Error(`Transaction ${hash} reverted`);
    } catch (err) {
      if (err && err.shortMessage && err.shortMessage.includes('could not be found')) {
        // not mined yet, keep polling
      } else if (!err || !err.shortMessage || !/rate limit|too many|429|unavailable/i.test(err.shortMessage + (err.message || ''))) {
        throw err;
      }
    }
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error(`Timed out waiting for transaction ${hash} to be mined`);
}

async function main() {
  const nft = (process.env.NFT_ADDRESS || '').trim();
  const sale = (process.env.SALE_ADDRESS || '').trim();
  const base = (process.env.BASE_TOKEN_URI || '').trim();
  const rpc = (process.env.SEPOLIA_RPC_URL || '').trim();
  const key = normalizePrivateKey(process.env.PRIVATE_KEY || '');

  if (!nft || !sale || !base || !rpc || !key) {
    console.error('Missing required env vars. Required: NFT_ADDRESS, SALE_ADDRESS, BASE_TOKEN_URI, SEPOLIA_RPC_URL, PRIVATE_KEY');
    process.exit(1);
  }

  const account = privateKeyToAccount(key);
  const transport = fallback(RPC_URLS.map(url => http(url, { timeout: 10000 })), { rank: true });
  const publicClient = createPublicClient({ chain: sepolia, transport });
  const walletClient = createWalletClient({ account, chain: sepolia, transport });

  console.log('Calling setSaleContract(', sale, ') on NFT');
  const tx1 = await walletClient.writeContract({ address: nft, abi: nftAbi, functionName: 'setSaleContract', args: [sale] });
  console.log('tx sent:', tx1);
  await waitForMined(publicClient, tx1);
  console.log('setSaleContract confirmed');

  console.log('Calling setBaseTokenURI(', base, ') on NFT');
  const tx2 = await walletClient.writeContract({ address: nft, abi: nftAbi, functionName: 'setBaseTokenURI', args: [base] });
  console.log('tx sent:', tx2);
  await waitForMined(publicClient, tx2);
  console.log('setBaseTokenURI confirmed');

  const bookingHistoryAddr = await publicClient.readContract({ address: sale, abi: saleAbi, functionName: 'bookingHistory' });
  const currentBHSale = await publicClient.readContract({
    address: bookingHistoryAddr, abi: bookingHistoryAbi, functionName: 'saleContract',
  }).catch(() => null);
  if (currentBHSale && currentBHSale.toLowerCase() === sale.toLowerCase()) {
    console.log('BookingHistory already wired to sale contract');
  } else {
    console.log('Wiring BookingHistory', bookingHistoryAddr, 'to sale contract');
    const tx3 = await walletClient.writeContract({
      address: bookingHistoryAddr, abi: bookingHistoryAbi, functionName: 'setSaleContract', args: [sale],
    });
    console.log('tx sent:', tx3);
    await waitForMined(publicClient, tx3);
    console.log('BookingHistory wired');
  }

  console.log('Wiring complete. NFT:', nft, 'Sale:', sale, 'BookingHistory:', bookingHistoryAddr, 'BaseURI:', base);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
