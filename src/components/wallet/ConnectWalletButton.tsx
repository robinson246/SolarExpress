'use client';

import { useConnection, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';

export default function ConnectWalletButton() {
  const { address, isConnected, chain } = useConnection();
  const { mutate: connect, connectors } = useConnect();
  const { mutate: disconnect } = useDisconnect();
  const { mutate: switchChain } = useSwitchChain();

  if (isConnected && address) {
    if (chain?.id !== sepolia.id) {
      return (
        <button
          onClick={() => switchChain({ chainId: sepolia.id })}
          className="px-3 py-1.5 text-xs font-medium rounded bg-amber-600/80 hover:bg-amber-500 text-white transition-colors cursor-pointer"
        >
          Switch to Sepolia
        </button>
      );
    }

    return (
      <button
        onClick={() => disconnect()}
        className="px-3 py-1.5 text-xs font-mono rounded bg-gray-700/60 text-gray-200 border border-gray-600 hover:border-red-500/50 hover:text-red-300 transition-colors cursor-pointer"
        title="Disconnect wallet"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      className="px-3 py-1.5 text-xs font-medium rounded bg-violet-600 hover:bg-violet-500 text-white transition-colors cursor-pointer"
    >
      Connect Wallet
    </button>
  );
}
