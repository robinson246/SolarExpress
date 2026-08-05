// scripts/set-token-uri.js
// Point a single NFT token's tokenURI at an explicit metadata URL (used to fix
// tickets minted before the base token URI was updated).
// Expects env vars (set as GitHub secrets/workflow inputs):
//   NFT_ADDRESS, PRIVATE_KEY, SEPOLIA_RPC_URL, TOKEN_ID, METADATA_URI

const { createPublicClient, createWalletClient, http, fallback, parseAbi } = require('viem');
const { sepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const nftAbi = parseAbi([
  'function setTokenURI(uint256 tokenId, string metadataURI)',
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
  const rpc = (process.env.SEPOLIA_RPC_URL || '').trim();
  const key = normalizePrivateKey(process.env.PRIVATE_KEY || '');
  const tokenId = process.env.TOKEN_ID ? BigInt(process.env.TOKEN_ID.trim()) : 1n;
  const metadataUri = (process.env.METADATA_URI || '').trim();

  if (!nft || !rpc || !key || !metadataUri) {
    console.error('Missing required env vars. Required: NFT_ADDRESS, PRIVATE_KEY, SEPOLIA_RPC_URL, METADATA_URI (TOKEN_ID optional, default 1)');
    process.exit(1);
  }

  const account = privateKeyToAccount(key);
  const transport = fallback(RPC_URLS.map(url => http(url, { timeout: 10000 })), { rank: true });
  const publicClient = createPublicClient({ chain: sepolia, transport });
  const walletClient = createWalletClient({ account, chain: sepolia, transport });

  console.log(`Calling setTokenURI(${tokenId.toString()}, ${metadataUri}) on NFT`, nft);
  const tx = await walletClient.writeContract({
    address: nft,
    abi: nftAbi,
    functionName: 'setTokenURI',
    args: [tokenId, metadataUri],
  });
  console.log('tx sent:', tx);
  const receipt = await waitForMined(publicClient, tx);
  console.log('setTokenURI confirmed, status:', receipt.status);
  console.log('TOKEN_ID=' + tokenId.toString());
  console.log('SET_TOKEN_URI_TX=' + tx);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
