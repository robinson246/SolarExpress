'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import NavBar from '@/components/layout/NavBar';
import LoadingScreen from '@/components/ui/LoadingScreen';

const FAQ_ITEMS = [
  {
    category: 'Booking',
    questions: [
      { q: 'How do I book a ticket?', a: 'Select a destination from the Explore page, review the travel information, click "Book Now", and follow the multi-step wizard. You will need a MetaMask wallet and Sepolia test ETH to complete the booking.' },
      { q: 'Can I modify or cancel a booking?', a: 'Currently, bookings are final once confirmed on-chain. Since each booking is represented as an NFT, modifications are not supported. Please double-check all details before confirming.' },
      { q: 'Why do I need to choose a departure date?', a: 'Launch windows are simulated based on real orbital mechanics. Your selected date determines the launch schedule, seat assignment, and flight plan for your journey.' },
      { q: 'What happens after I book?', a: 'After successful payment, your NFT ticket is minted on the Sepolia test network and stored in your wallet. Booking details are saved to your profile and visible in My Tickets.' },
    ],
  },
  {
    category: 'Blockchain',
    questions: [
      { q: 'What is an NFT Ticket?', a: 'An NFT (Non-Fungible Token) ticket is a unique digital asset on the Ethereum blockchain that proves your ownership of a booking. Each ticket has a unique Token ID and cannot be duplicated.' },
      { q: 'Why do I need MetaMask?', a: 'MetaMask is a browser wallet that allows you to interact with the Ethereum blockchain. You need it to sign transactions, pay for tickets in ETH, and receive your NFT ticket.' },
      { q: 'What network does SolarExpress use?', a: 'SolarExpress operates on the Sepolia test network. All transactions use test ETH, not real money. You can obtain free test ETH from Sepolia faucets.' },
      { q: 'How do I get Sepolia test ETH?', a: 'Use a Sepolia faucet such as sepoliafaucet.com or alchemy.com/faucets/ethereum-sepolia. Enter your wallet address to receive free test ETH for transactions.' },
      { q: 'What if a transaction fails?', a: 'If a transaction fails (e.g., insufficient funds, network error), your booking will not be created and no NFT will be minted. You can retry from the booking wizard after resolving the issue.' },
    ],
  },
  {
    category: 'Payments',
    questions: [
      { q: 'What currency is used?', a: 'All payments are in Sepolia ETH, the native currency of the Sepolia test network. Prices are fixed per destination and displayed before booking.' },
      { q: 'Are there any refunds?', a: 'Blockchain transactions are irreversible. Once a ticket is purchased and the NFT is minted, refunds are not possible. This is a core feature of blockchain-based ticketing.' },
      { q: 'Which passenger classes are available?', a: 'Economy and Business Class are available. First Class is planned for a future update and will be enabled by a configuration flag.' },
    ],
  },
  {
    category: 'NFT Tickets',
    questions: [
      { q: 'How do I view my NFT?', a: 'Go to My Tickets > NFT Gallery to view all your minted NFT tickets. Each ticket includes the artwork, blockchain details, and a link to view it on Etherscan.' },
      { q: 'How do I verify my NFT on-chain?', a: 'Each ticket page includes a "View on Sepolia Etherscan" link that opens the transaction on the blockchain explorer. You can verify the token ID, contract address, and transaction history.' },
      { q: 'Can I transfer my NFT to another wallet?', a: 'Yes, since these are standard ERC-721 tokens, they can be transferred to any Ethereum address using MetaMask or any ERC-721 compatible wallet.' },
    ],
  },
  {
    category: 'Wallet',
    questions: [
      { q: 'Which wallets are supported?', a: 'SolarExpress supports MetaMask, the most popular browser-based Ethereum wallet. Support for additional wallets like WalletConnect and Coinbase Wallet may be added in the future.' },
      { q: 'How do I connect my wallet?', a: 'Click "Connect Wallet" in the navigation bar or profile menu. MetaMask will prompt you to approve the connection. Ensure you are on the Sepolia network.' },
      { q: 'Is my wallet address stored?', a: 'Your wallet address is stored securely in our database only after you link it during the booking process. You can unlink your wallet from the profile settings.' },
      { q: 'What if I switch wallets?', a: 'Previous bookings are tied to the wallet address used during purchase. If you switch wallets, your old tickets remain accessible from the original wallet.' },
    ],
  },
  {
    category: 'Travel',
    questions: [
      { q: 'How are travel times calculated?', a: 'Travel times are simulated approximations based on real astronomical distances and hypothetical propulsion technology. They are for educational purposes only.' },
      { q: 'What is a Launch Terminal?', a: 'Launch Terminals are fictional departure points within the SolarExpress network. Each destination has a designated terminal, such as "Earth Orbital Gateway" or "Mars Approach Station".' },
      { q: 'Are launch dates real?', a: 'Launch dates and times are simulated. In a real production system, they would depend on actual orbital mechanics, launch windows, and operational scheduling.' },
      { q: 'Why are some destinations more expensive?', a: 'Ticket prices are based on distance, travel time, and demand. Farther destinations like Pluto and Neptune cost more than nearby destinations like the Moon and Mars.' },
    ],
  },
];

export default function FAQPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();

  useEffect(() => {
    if (!checkingSession && !user) router.replace('/signin');
  }, [checkingSession, user, router]);

  if (checkingSession || !user) {
    return <LoadingScreen visible message='Checking session...' />;
  }

  return (
    <div className='h-full w-full overflow-hidden bg-[#09090b] text-white flex flex-col'>
      <NavBar />
      <div className='flex-1 overflow-y-auto scrollbar-thin'>
        <div className='max-w-3xl mx-auto px-4 py-8 pb-24 sm:pb-12'>
          <div className='flex items-center gap-3 mb-8'>
            <div className='w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center'>
              <span className='text-lg'>?</span>
            </div>
            <div>
              <h1 className='text-2xl font-bold'>FAQ</h1>
              <p className='text-sm text-gray-500'>Frequently asked questions about SolarExpress</p>
            </div>
          </div>

          <div className='space-y-8'>
            {FAQ_ITEMS.map((section) => (
              <div key={section.category}>
                <h2 className='text-sm font-bold text-violet-300 uppercase tracking-wider mb-3'>{section.category}</h2>
                <div className='space-y-2'>
                  {section.questions.map((item, i) => (
                    <details key={i} className='glass-card rounded-xl overflow-hidden group'>
                      <summary className='px-4 py-3 text-sm text-gray-200 font-medium cursor-pointer hover:bg-white/5 transition-colors list-none flex items-center justify-between'>
                        <span>{item.q}</span>
                        <svg className='w-4 h-4 text-gray-500 shrink-0 group-open:rotate-180 transition-transform' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                          <polyline points='6 9 12 15 18 9' />
                        </svg>
                      </summary>
                      <div className='px-4 pb-4 pt-1'>
                        <p className='text-xs text-gray-400 leading-relaxed'>{item.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
