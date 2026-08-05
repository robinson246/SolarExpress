import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { fallback } from 'viem';
import { SEPOLIA_RPC_URLS } from '@/lib/rpc';

export const config = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: fallback(SEPOLIA_RPC_URLS.map(url => http(url)), { rank: true }),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
