// Retro-migrate existing SolarExpress tickets to on-chain IPFS metadata.
//
// For each token ID it: fetches the currently-rendered PNG + metadata JSON from
// the robinson11 routes, uploads both to Pinata, then setTokenURI()s the NFT
// contract so the token points at immutable ipfs:// metadata.
//
// setTokenURI is onlyOwner, so run this with the deployer's private key.
//
// Usage:
//   PINATA_JWT=<jwt> PRIVATE_KEY=<deployer pk> node scripts/ipfs-migrate.mjs 2 3 5
//
// Optional env overrides: RPC_URL, NFT_ADDRESS, METADATA_BASE, IMAGE_BASE

import { createWalletClient, createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const PINATA_JWT = process.env.PINATA_JWT;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia.publicnode.com';
const NFT_ADDRESS = (process.env.NFT_ADDRESS || '0x76062Ce48e3fA5F24375A27A5Da8ea1d52ED2bee') ;
const METADATA_BASE = process.env.METADATA_BASE || 'https://solar-express-robinson11.vercel.app/api/nft/metadata';
const IMAGE_BASE = process.env.IMAGE_BASE || 'https://solar-express-robinson11.vercel.app/api/nft/image';
const PINATA_API = 'https://api.pinata.cloud';

const nftAbi = [
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'setTokenURI',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'metadataURI', type: 'string' },
    ],
    outputs: [],
  },
] ;

function fail(msg) {
  console.error(`[ipfs-migrate] ${msg}`);
  process.exit(1);
}

if (!PINATA_JWT) fail('PINATA_JWT is required');
if (!PRIVATE_KEY) fail('PRIVATE_KEY is required');
const tokenIds = process.argv.slice(2).map(Number);
if (tokenIds.length === 0) fail('pass token IDs as args, e.g. node scripts/ipfs-migrate.mjs 2 3 5');

const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, chain: sepolia, transport: http(RPC_URL) });

async function uploadImageToPinata(png, name) {
  const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
  const form = new FormData();
  form.append('file', new Blob([png], { type: 'image/png' }), `${safeName}.png`);
  const res = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });
  if (!res.ok) throw new Error(`image upload failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.IpfsHash;
}

async function uploadJsonToPinata(json) {
  const res = await fetch(`${PINATA_API}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${PINATA_JWT}` },
    body: JSON.stringify(json),
  });
  if (!res.ok) throw new Error(`metadata upload failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.IpfsHash;
}

async function migrate(tokenId) {
  console.log(`\n=== Migrating token ${tokenId} ===`);
  const currentUri = await publicClient.readContract({
    address: NFT_ADDRESS,
    abi: nftAbi,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
  });
  console.log('current tokenURI:', currentUri);
  if (typeof currentUri === 'string' && currentUri.startsWith('ipfs://')) {
    console.log('already on IPFS, skipping.');
    return;
  }

  const [metaRes, imgRes] = await Promise.all([
    fetch(`${METADATA_BASE}/${tokenId}?v=3`),
    fetch(`${IMAGE_BASE}/${tokenId}?v=3`),
  ]);
  if (!metaRes.ok) throw new Error(`metadata fetch failed (${metaRes.status})`);
  if (!imgRes.ok) throw new Error(`image fetch failed (${imgRes.status})`);

  const metadata = await metaRes.json();
  if (!metadata.name || !String(metadata.name).includes(`#${tokenId}`)) {
    console.warn(`  WARNING: fetched metadata name "${metadata.name}" does not reference token #${tokenId}`);
  }
  const png = new Uint8Array(await imgRes.arrayBuffer());

  const imageCid = await uploadImageToPinata(png, `SolarExpress Ticket #${tokenId}`);
  console.log('image CID:', imageCid);

  const pinnedMetadata = { ...metadata, image: `ipfs://${imageCid}` };
  const metadataCid = await uploadJsonToPinata(pinnedMetadata);
  console.log('metadata CID:', metadataCid);

  const ipfsUri = `ipfs://${metadataCid}`;
  const hash = await walletClient.writeContract({
    address: NFT_ADDRESS,
    abi: nftAbi,
    functionName: 'setTokenURI',
    args: [BigInt(tokenId), ipfsUri],
  });
  console.log('setTokenURI tx:', hash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('confirmed block:', receipt.blockNumber);

  const verified = await publicClient.readContract({
    address: NFT_ADDRESS,
    abi: nftAbi,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
  });
  console.log('verified tokenURI:', verified);
  if (verified !== ipfsUri) throw new Error(`verification mismatch: ${verified}`);

  console.log(`token ${tokenId} migrated to ${ipfsUri}`);
}

(async () => {
  console.log(`account: ${account.address}`);
  console.log(`NFT: ${NFT_ADDRESS}`);
  for (const id of tokenIds) {
    try {
      await migrate(id);
    } catch (err) {
      console.error(`  FAILED token ${id}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log('\nDone.');
})();
