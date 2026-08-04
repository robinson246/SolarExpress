// scripts/wire-with-viem.js
// Wire SolarExpressTicket by calling setSaleContract() and setBaseTokenURI()
// Expects these environment variables (set as GitHub secrets in workflow):
// NFT_ADDRESS, SALE_ADDRESS, BASE_TOKEN_URI, SEPOLIA_RPC_URL, PRIVATE_KEY

const { createPublicClient, createWalletClient, http, fallback, parseAbi } = require('viem');
const { sepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const abi = parseAbi([
  'function setSaleContract(address _saleContract)',
  'function setBaseTokenURI(string _baseTokenURI)'
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
  const transport = fallback(RPC_URLS.map(url => http(url)), { rank: true });
  const publicClient = createPublicClient({ chain: sepolia, transport });
  const walletClient = createWalletClient({ account, chain: sepolia, transport });

  console.log('Calling setSaleContract(', sale, ')');
  const tx1 = await walletClient.writeContract({
    address: nft,
    abi,
    functionName: 'setSaleContract',
    args: [sale],
  });
  console.log('tx sent:', tx1);
  await publicClient.waitForTransactionReceipt({ hash: tx1 });
  console.log('setSaleContract confirmed');

  console.log('Calling setBaseTokenURI(', base, ')');
  const tx2 = await walletClient.writeContract({
    address: nft,
    abi,
    functionName: 'setBaseTokenURI',
    args: [base],
  });
  console.log('tx sent:', tx2);
  await publicClient.waitForTransactionReceipt({ hash: tx2 });
  console.log('setBaseTokenURI confirmed');

  console.log('Wiring complete. NFT:', nft, 'Sale:', sale, 'BaseURI:', base);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
