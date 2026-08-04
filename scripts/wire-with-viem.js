// scripts/wire-with-viem.js
// Wire SolarExpressTicket by calling setSaleContract() and setBaseTokenURI()
// Expects these environment variables (set as GitHub secrets in workflow):
// NFT_ADDRESS, SALE_ADDRESS, BASE_TOKEN_URI, SEPOLIA_RPC_URL, PRIVATE_KEY

const { createPublicClient, createWalletClient, http } = require('viem');
const { sepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const abi = [
  'function setSaleContract(address _saleContract) external',
  'function setBaseTokenURI(string _baseTokenURI) external'
];

async function main() {
  const nft = process.env.NFT_ADDRESS;
  const sale = process.env.SALE_ADDRESS;
  const base = process.env.BASE_TOKEN_URI;
  const rpc = process.env.SEPOLIA_RPC_URL;
  const key = process.env.PRIVATE_KEY;

  if (!nft || !sale || !base || !rpc || !key) {
    console.error('Missing required env vars. Required: NFT_ADDRESS, SALE_ADDRESS, BASE_TOKEN_URI, SEPOLIA_RPC_URL, PRIVATE_KEY');
    process.exit(1);
  }

  const account = privateKeyToAccount(key);
  const publicClient = createPublicClient({ chain: sepolia, transport: http(rpc) });
  const walletClient = createWalletClient({ account, chain: sepolia, transport: http(rpc) });

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
