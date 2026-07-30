'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useBookingHistory } from '@/hooks/useBookingHistory';
import { bodies } from '@/data/bodies';
import { getTravelRoute } from '@/data/travel';
import NavBar from '@/components/layout/NavBar';
import NFTTicket from '@/components/nft/NFTTicket';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner, default as LoadingScreen } from '@/components/ui/LoadingScreen';
import type { BookingRecord } from '@/lib/api';

type Tab = 'nft-gallery' | 'booking-history';

function shorten(s: string, chars = 6): string {
  if (s.length <= chars * 2 + 3) return s;
  return `${s.slice(0, chars)}...${s.slice(-chars)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getBody(id: number) {
  return bodies.find(b => b.id === id);
}

/* ─── NFT Gallery Tab ─── */
function NFTGalleryView({ bookings, onSelect }: { bookings: BookingRecord[]; onSelect: (b: BookingRecord) => void }) {
  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
      {bookings.map((b) => {
        const body = getBody(b.destinationId);
        return (
          <button
            key={b._id}
            onClick={() => onSelect(b)}
            className='bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all text-left cursor-pointer group w-full'
          >
            <NFTTicket
              destinationId={b.destinationId}
              tokenId={b.tokenId}
              priceEth={b.pricePaid}
              compact
            />
            <div className='px-3 pb-3 -mt-2 relative z-10 space-y-1'>
              <p className='text-xs font-bold text-white'>{body?.name ?? `#${b.destinationId}`}</p>
              <div className='flex items-center justify-between text-[10px]'>
                <span className='text-gray-500 font-mono'>#{b.tokenId}</span>
                <span className='text-emerald-400 font-medium'>{b.status}</span>
              </div>
              <p className='text-[9px] text-gray-600'>{formatDate(b.createdAt)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function NFTDetailModal({ booking, onClose, onViewBooking }: { booking: BookingRecord; onClose: () => void; onViewBooking: () => void }) {
  const body = getBody(booking.destinationId);
  return (
    <Modal open onClose={onClose}>
      <div className='w-full max-w-[540px] mx-auto px-6 pt-6 sm:px-8 sm:pt-8'>
        <NFTTicket destinationId={booking.destinationId} tokenId={booking.tokenId} priceEth={booking.pricePaid} />
      </div>
        <div className='px-6 pb-6 sm:px-8 sm:pb-8 space-y-5 -mt-4'>
          <div>
            <h2 className='text-2xl font-bold text-white'>{body?.name ?? `#${booking.destinationId}`}</h2>
            <p className='text-sm text-gray-500 mt-1'>NFT Ticket &middot; Token #{booking.tokenId}</p>
          </div>
          <div className='h-px bg-gradient-to-r from-violet-500/20 via-gray-700/50 to-transparent' />
          <div className='grid grid-cols-2 gap-3'>
            <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 space-y-1'>
              <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>Token ID</p>
              <p className='text-sm text-white font-mono'>#{booking.tokenId}</p>
            </div>
            <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 space-y-1'>
              <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>Price Paid</p>
              <p className='text-sm text-emerald-400 font-mono font-bold'>{booking.pricePaid} ETH</p>
            </div>
            <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 space-y-1'>
              <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>Mint Date</p>
              <p className='text-sm text-white'>{formatDate(booking.createdAt)}</p>
            </div>
            <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 space-y-1'>
              <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>Network</p>
              <p className='text-sm text-violet-400 font-mono'>Sepolia</p>
            </div>
          </div>
          <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-2.5'>
            <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>On-Chain Details</p>
            <div className='space-y-2'>
              <div>
                <p className='text-[10px] text-gray-600'>Transaction Hash</p>
                <p className='text-xs text-gray-300 font-mono break-all'>{booking.transactionHash}</p>
              </div>
              <div>
                <p className='text-[10px] text-gray-600'>Owner Wallet</p>
                <p className='text-xs text-gray-300 font-mono'>{shorten(booking.walletAddress, 12)}</p>
              </div>
            </div>
            <a href={`https://sepolia.etherscan.io/tx/${booking.transactionHash}`} target='_blank' rel='noopener noreferrer' className='inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors mt-1'>
              <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' /><polyline points='15 3 21 3 21 9' /><line x1='10' y1='14' x2='21' y2='3' />
              </svg>
              View on Sepolia Etherscan
            </a>
          </div>
          <button onClick={onViewBooking} className='w-full py-2.5 text-center text-xs font-medium rounded-lg glass-card-hover text-violet-300 cursor-pointer'>
            Linked Booking →
          </button>
        </div>
    </Modal>
  );
}

/* ─── Booking History Tab ─── */
function BookingHistoryView({ bookings, onSelect, onViewNft }: { bookings: BookingRecord[]; onSelect: (b: BookingRecord) => void; onViewNft: (b: BookingRecord) => void }) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
      {bookings.map((b) => {
        const body = getBody(b.destinationId);
        return (
          <div
            key={b._id}
            className='bg-gray-900/60 border border-gray-800 rounded-xl p-4 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all cursor-pointer w-full space-y-2'
            onClick={() => onSelect(b)}
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='w-2.5 h-2.5 rounded-full' style={{ backgroundColor: body?.color ?? '#666' }} />
                <p className='text-sm font-bold text-white'>{body?.name ?? `#${b.destinationId}`}</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                b.status === 'Confirmed' ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/40' : 'bg-gray-800/60 text-gray-400 border border-gray-700/40'
              }`}>
                {b.status}
              </span>
            </div>
            <div className='space-y-1 text-[11px]'>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Flight</span>
                <span className='text-gray-300 font-mono'>{b.flightNumber ?? '—'}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Reference</span>
                <span className='text-gray-300 font-mono'>{b.bookingReference ?? '—'}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Departure</span>
                <span className='text-gray-300'>{b.departureDate ? formatDate(b.departureDate) : '—'}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Time</span>
                <span className='text-gray-300 font-mono'>{b.departureTime ? `${b.departureTime} UTC` : '—'}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Seat</span>
                <span className='text-gray-300 font-mono'>{b.seatNumber ?? '—'}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Class</span>
                <span className='text-gray-300 capitalize'>{b.travelClass ?? 'economy'}</span>
              </div>
            </div>
            <div className='pt-2 border-t border-gray-800 flex items-center justify-between text-[10px]'>
              <span className='text-gray-600 font-mono'>Token #{b.tokenId}</span>
              <span className='text-emerald-400 font-mono'>{b.pricePaid} ETH</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onViewNft(b); }}
              className='w-full py-2 text-center text-[10px] font-medium rounded-lg btn-violet cursor-pointer'
            >
              View NFT Ticket
            </button>
          </div>
        );
      })}
    </div>
  );
}

function BookingDetailModal({ booking, onClose, onViewNft }: { booking: BookingRecord; onClose: () => void; onViewNft: () => void }) {
  const body = getBody(booking.destinationId);
  const route = getTravelRoute(booking.destinationId);
  return (
    <Modal open onClose={onClose}>
        <div className='px-6 pt-6 sm:px-8 sm:pt-8 space-y-5'>
          <div>
            <div className='flex items-center gap-3'>
              <span className='w-4 h-4 rounded-full shrink-0' style={{ backgroundColor: body?.color ?? '#666' }} />
              <div>
                <h2 className='text-2xl font-bold text-white'>{body?.name ?? `#${booking.destinationId}`}</h2>
                <p className='text-sm text-gray-500 mt-1'>Flight {booking.flightNumber ?? '—'} &middot; {booking.bookingReference ?? '—'}</p>
              </div>
            </div>
          </div>
          <div className='h-px bg-gradient-to-r from-violet-500/20 via-gray-700/50 to-transparent' />
          <div className='grid grid-cols-2 gap-3'>
            <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 space-y-1'>
              <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>Flight Number</p>
              <p className='text-sm text-white font-mono'>{booking.flightNumber ?? '—'}</p>
            </div>
            <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 space-y-1'>
              <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>Booking Reference</p>
              <p className='text-sm text-white font-mono'>{booking.bookingReference ?? '—'}</p>
            </div>
            <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 space-y-1'>
              <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>Departure Date</p>
              <p className='text-sm text-white'>{booking.departureDate ? formatDate(booking.departureDate) : '—'}</p>
            </div>
            <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 space-y-1'>
              <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>Launch Time</p>
              <p className='text-sm text-white font-mono'>{booking.departureTime ? `${booking.departureTime} UTC` : '—'}</p>
            </div>
            <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 space-y-1'>
              <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>Launch Terminal</p>
              <p className='text-sm text-white'>{booking.launchTerminal ?? '—'}</p>
            </div>
            <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 space-y-1'>
              <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>Seat Number</p>
              <p className='text-sm text-white font-mono'>{booking.seatNumber ?? '—'}</p>
            </div>
            <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 space-y-1'>
              <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>Passenger Class</p>
              <p className='text-sm text-white capitalize'>{booking.travelClass ?? 'economy'}</p>
            </div>
            <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 space-y-1'>
              <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>Wallet</p>
              <p className='text-sm text-white font-mono truncate'>{shorten(booking.walletAddress, 10)}</p>
            </div>
          </div>
          {/* Route Timeline */}
          <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-2'>
            <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>Route Timeline</p>
            <div className='space-y-0'>
              <div className='flex items-center gap-2 text-xs'>
                <span className='w-2 h-2 rounded-full bg-violet-400 shrink-0' />
                <span className='text-gray-300'>Earth</span>
              </div>
              <div className='ml-1 pl-3 border-l border-violet-500/20 py-1'>
                <div className='flex items-center gap-2 text-xs py-0.5'>
                  <span className='w-1.5 h-1.5 rounded-full bg-violet-500/50 shrink-0' />
                  <span className='text-gray-500'>{booking.launchTerminal ?? 'Launch Terminal'}</span>
                </div>
              </div>
              <div className='flex items-center gap-2 text-xs'>
                <span className='w-2 h-2 rounded-full bg-emerald-400 shrink-0' />
                <span className='text-gray-300 font-medium'>{body?.name ?? `#${booking.destinationId}`}</span>
              </div>
            </div>
          </div>
          <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-2.5'>
            <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>Transaction</p>
            <div className='space-y-1 text-xs'>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Token ID</span>
                <span className='text-white font-mono'>#{booking.tokenId}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Price</span>
                <span className='text-emerald-400 font-mono'>{booking.pricePaid} ETH</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Status</span>
                <span className='text-emerald-400'>{booking.status}</span>
              </div>
            </div>
            <a href={`https://sepolia.etherscan.io/tx/${booking.transactionHash}`} target='_blank' rel='noopener noreferrer' className='inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors mt-1'>
              <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' /><polyline points='15 3 21 3 21 9' /><line x1='10' y1='14' x2='21' y2='3' />
              </svg>
              View on Sepolia Etherscan
            </a>
          </div>
          <button onClick={onViewNft} className='w-full py-2.5 text-center text-xs font-medium rounded-lg btn-violet cursor-pointer'>
            View NFT Ticket
          </button>
        </div>
    </Modal>
  );
}

/* ─── Main Page ─── */
export default function MyTicketsPage() {
  const router = useRouter();
  const { user, checkingSession } = useAuth();
  const { data: bookings, isLoading, isError, error } = useBookingHistory();
  const [tab, setTab] = useState<Tab>('nft-gallery');
  const [selectedNft, setSelectedNft] = useState<BookingRecord | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);

  useEffect(() => {
    if (!checkingSession && !user) router.replace('/signin');
  }, [checkingSession, user, router]);

  const handleViewNft = (b: BookingRecord) => {
    setSelectedBooking(null);
    setTab('nft-gallery');
    setSelectedNft(b);
  };

  if (checkingSession || !user) {
    return <LoadingScreen visible message='Checking session...' />;
  }

  return (
    <div className='h-full w-full overflow-hidden bg-[#09090b] text-white flex flex-col'>
      <NavBar />
      <div className='flex-1 overflow-y-auto scrollbar-thin'>
        <div className='max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-8'>
          {/* Header */}
          <div className='flex items-center gap-3 mb-6'>
            <div className='w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center'>
              <svg className='w-5 h-5 text-violet-400' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <rect x='3' y='11' width='18' height='11' rx='2' ry='2' /><path d='M7 11V7a5 5 0 0 1 10 0v4' />
              </svg>
            </div>
            <div>
              <h1 className='text-xl font-bold'>My Tickets</h1>
              <p className='text-xs text-gray-500 mt-0.5'>{bookings?.length ?? 0} ticket{(bookings?.length ?? 0) !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className='flex gap-1 mb-6 p-1 bg-gray-900/60 rounded-xl border border-gray-800 w-fit'>
            <button
              onClick={() => { setTab('nft-gallery'); setSelectedNft(null); setSelectedBooking(null); }}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                tab === 'nft-gallery' ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              NFT Gallery
            </button>
            <button
              onClick={() => { setTab('booking-history'); setSelectedNft(null); setSelectedBooking(null); }}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                tab === 'booking-history' ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Booking History
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className='flex items-center justify-center py-12'>
              <LoadingSpinner size={32} />
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className='p-4 bg-red-900/20 border border-red-800/40 rounded-xl space-y-2'>
              <p className='text-sm text-red-300'>Could not load tickets.</p>
              <p className='text-xs text-red-400/70'>{(error as Error)?.message || 'Network error. Ensure your wallet browser allows cross-site cookies.'}</p>
              <button onClick={() => window.location.reload()} className='text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2 cursor-pointer'>
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && bookings && bookings.length === 0 && (
            <div className='text-center py-16'>
              <div className='w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 mx-auto flex items-center justify-center mb-4'>
                <svg className='w-7 h-7 text-violet-400' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'>
                  <rect x='3' y='11' width='18' height='11' rx='2' ry='2' /><path d='M7 11V7a5 5 0 0 1 10 0v4' />
                </svg>
              </div>
              <p className='text-sm text-gray-400'>No tickets yet.</p>
              <p className='text-xs text-gray-600 mt-1'>Book a destination to mint your first NFT ticket.</p>
            </div>
          )}

          {/* Content */}
          {!isLoading && !isError && bookings && bookings.length > 0 && (
            <>
              {tab === 'nft-gallery' && (
                <NFTGalleryView bookings={bookings} onSelect={setSelectedNft} />
              )}
              {tab === 'booking-history' && (
                <BookingHistoryView bookings={bookings} onSelect={setSelectedBooking} onViewNft={handleViewNft} />
              )}
            </>
          )}

          {/* Modals */}
          {selectedNft && (
            <NFTDetailModal
              booking={selectedNft}
              onClose={() => setSelectedNft(null)}
              onViewBooking={() => { setSelectedNft(null); setTab('booking-history'); setSelectedBooking(selectedNft); }}
            />
          )}
          {selectedBooking && (
            <BookingDetailModal
              booking={selectedBooking}
              onClose={() => setSelectedBooking(null)}
              onViewNft={() => { setSelectedBooking(null); setTab('nft-gallery'); setSelectedNft(selectedBooking); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
