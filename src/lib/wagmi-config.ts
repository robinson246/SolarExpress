import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { fallback } from 'viem';

const RPC_URLS = [
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
  'https://ethereum-sepolia.publicnode.com',
  'https://1rpc.io/sepolia',
  'https://rpc.sepolia.org',
  'https://sepolia.drpc.org',
  'https://sepolia.gateway.tenderly.co',
].filter(Boolean) as string[];

export const config = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: fallback(RPC_URLS.map(url => http(url)), { rank: true }),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
