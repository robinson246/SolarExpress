// Shared Ethereum Sepolia public RPC fallback list. Used by both server-side
// routes and the client wallet. Ordered by observed reliability; an env var
// (e.g. an Infura/Alchemy/QuickNode key) is always appended last so it can
// override the free endpoints without editing code.
export const SEPOLIA_RPC_URLS = [
  'https://ethereum-sepolia.publicnode.com',
  'https://1rpc.io/sepolia',
  'https://sepolia.drpc.org',
  'https://sepolia.gateway.tenderly.co',
  'https://rpc.sepolia.ethpandaops.io',
  'https://ethereum-sepolia-rpc.publicnode.com',
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
].filter(Boolean) as string[];
