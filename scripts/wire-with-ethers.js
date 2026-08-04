// scripts/wire-with-ethers.js
// Wire SolarExpressTicket by calling setSaleContract() and setBaseTokenURI()
// Expects these environment variables (set as GitHub secrets in workflow):
// NFT_ADDRESS, SALE_ADDRESS, BASE_TOKEN_URI, SEPOLIA_RPC_URL, PRIVATE_KEY

const { ethers } = require('ethers');

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

  console.log('Connecting to provider...');
  const provider = new ethers.providers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(key, provider);

  const abi = [
    'function setSaleContract(address _saleContract) external',
    'function setBaseTokenURI(string _baseTokenURI) external'
  ];

  const contract = new ethers.Contract(nft, abi, wallet);

  console.log('Calling setSaleContract(', sale, ')');
  const tx1 = await contract.setSaleContract(sale);
  console.log('tx sent:', tx1.hash);
  await tx1.wait();
  console.log('setSaleContract confirmed');

  console.log('Calling setBaseTokenURI(', base, ')');
  const tx2 = await contract.setBaseTokenURI(base);
  console.log('tx sent:', tx2.hash);
  await tx2.wait();
  console.log('setBaseTokenURI confirmed');

  console.log('Wiring complete. NFT:', nft, 'Sale:', sale, 'BaseURI:', base);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
