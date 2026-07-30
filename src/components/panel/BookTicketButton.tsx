'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useConnection } from 'wagmi';
import { useAuth } from '@/lib/auth-context';
import { setIsModalOpen } from '@/lib/modal-store';
import { useBuyTicket, type TicketStep } from '@/hooks/useBuyTicket';
import { useSyncBooking } from '@/hooks/useSyncBooking';
import { useQueryClient } from '@tanstack/react-query';
import { generateNFTMetadata } from '@/lib/nft-service';
import { bodies, type Body } from '@/data/bodies';
import { getTravelRoute, generateFlightDetails, PASSENGER_CLASSES, type FlightDetails } from '@/data/travel';
import NFTTicket from '@/components/nft/NFTTicket';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import Link from 'next/link';

interface BookTicketButtonProps {
  selectedBodyId: number | null;
}

const SEPOLIA_ETHERSCAN = 'https://sepolia.etherscan.io/tx';

type WizardStep = 'travel-info' | 'departure-date' | 'availability' | 'flight' | 'passenger-class' | 'agreement' | 'review' | 'payment' | 'confirmation';

const STEP_LABELS: Record<WizardStep, string> = {
  'travel-info': 'Travel Information',
  'departure-date': 'Departure Date',
  'availability': 'Check Availability',
  'flight': 'Available Flight',
  'passenger-class': 'Passenger Class',
  'agreement': 'Travel Agreement',
  'review': 'Review Booking',
  'payment': 'Payment',
  'confirmation': 'Confirmation',
};

const WIZARD_ORDER: WizardStep[] = [
  'travel-info', 'departure-date', 'availability', 'flight',
  'passenger-class', 'agreement', 'review', 'payment', 'confirmation',
];

/* ─── Progress Indicator ─── */
function BookingProgress({ currentStep }: { currentStep: WizardStep }) {
  const showSteps: WizardStep[] = ['travel-info', 'departure-date', 'availability', 'review', 'payment', 'confirmation'];
  const currentIdx = showSteps.indexOf(currentStep);
  const activeLabel = STEP_LABELS[currentStep];

  return (
    <div className='w-full overflow-x-hidden'>
      {/* Dot track — always visible */}
      <div className='flex items-center gap-0 sm:gap-1'>
        {showSteps.map((s, i) => {
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;
          return (
            <div key={s} className='flex items-center gap-0 sm:gap-1 min-w-0'>
              {/* Step dot */}
              <div className='flex items-center justify-center shrink-0'>
                {isPast ? (
                  <div className='w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center'>
                    <svg className='w-3 h-3 text-emerald-400' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3'>
                      <polyline points='20 6 9 17 4 12' />
                    </svg>
                  </div>
                ) : isCurrent ? (
                  <div className='w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/50 flex items-center justify-center'>
                    <span className='text-[10px] font-bold text-violet-300'>{i + 1}</span>
                  </div>
                ) : (
                  <div className='w-5 h-5 rounded-full bg-gray-800/60 border border-gray-700/50 flex items-center justify-center'>
                    <span className='text-[10px] font-medium text-gray-500'>{i + 1}</span>
                  </div>
                )}
              </div>
              {/* Chevron between dots */}
              {i < showSteps.length - 1 && (
                <svg className={`w-3 h-3 shrink-0 mx-0.5 sm:mx-1 ${isPast ? 'text-emerald-400/60' : 'text-gray-700'}`} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                  <polyline points='9 18 15 12 9 6' />
                </svg>
              )}
            </div>
          );
        })}
      </div>
      {/* Active step label */}
      <div className='text-[10px] sm:text-xs font-medium text-violet-300 mt-1.5 truncate'>{activeLabel}</div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function BookTicketButton({ selectedBodyId }: BookTicketButtonProps) {
  const { isConnected, address } = useConnection();
  const { user } = useAuth();
  const { buyTicket, step: txStep, txHash, tokenId, error: txError, reset: resetTx, checkReceipt } = useBuyTicket();
  const syncMutation = useSyncBooking();
  const queryClient = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('travel-info');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime] = useState('');
  const [seatNumber] = useState('');
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [travelClass, setTravelClass] = useState('economy');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [metadataUri, setMetadataUri] = useState<string>('');
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const metadataGeneratingRef = useRef(false);
  const triggeredRef = useRef(false);

  const body = selectedBodyId ? bodies.find(b => b.id === selectedBodyId) ?? null : null;
  const route = body && body.id !== 3 ? getTravelRoute(body.id) : null;

  const flightDetailsRef = useRef<FlightDetails | null>(null);
  if (!flightDetailsRef.current && body) {
    flightDetailsRef.current = generateFlightDetails(body.id);
  }
  const fd = flightDetailsRef.current;
  const autoLaunchTime = fd?.departureTime ?? '12:00';
  const autoLaunchTerminal = fd?.launchTerminal ?? 'Earth Orbital Gateway';
  const autoFlightNumber = fd?.flightNumber ?? 'SX000';
  const generatedSeat = fd?.seatNumber ?? '1A';
  const bookingRef = fd?.bookingReference ?? '';
  const depDate = fd?.departureDate ?? '';

  const goToStep = useCallback((step: WizardStep) => {
    setWizardStep(step);
  }, []);

  const nextStep = useCallback(() => {
    const idx = WIZARD_ORDER.indexOf(wizardStep);
    if (idx < WIZARD_ORDER.length - 1) {
      setWizardStep(WIZARD_ORDER[idx + 1]);
    }
  }, [wizardStep]);

  const handleOpenWizard = () => {
    if (!body) return;
    setWizardOpen(true);
    setIsModalOpen(true);
    setWizardStep('travel-info');
    setDepartureDate('');
    setAvailabilityChecked(false);
    setTravelClass('economy');
    setAgreementAccepted(false);
    setDbStatus('idle');
    setMetadataUri('');
    setMetadataError(null);
    metadataGeneratingRef.current = false;
    triggeredRef.current = false;
    flightDetailsRef.current = generateFlightDetails(body.id);
  };

  const handleCloseWizard = () => {
    setWizardOpen(false);
    setIsModalOpen(false);
    resetTx();
    setDbStatus('idle');
    setMetadataUri('');
    setMetadataError(null);
    metadataGeneratingRef.current = false;
    triggeredRef.current = false;
  };

  const handleCheckAvailability = () => {
    setAvailabilityLoading(true);
    setTimeout(() => {
      setAvailabilityChecked(true);
      setAvailabilityLoading(false);
      nextStep();
    }, 1500 + Math.random() * 1000);
  };

  /* ─── Blockchain sync (same as before) ─── */
  useEffect(() => {
    if (txStep === 'confirming' && txHash && !triggeredRef.current) {
      const timer = setTimeout(() => checkReceipt(), 8000);
      return () => clearTimeout(timer);
    }
  }, [txStep, txHash, checkReceipt]);

  useEffect(() => {
    if (triggeredRef.current) return;
    if (txStep !== 'success' || !tokenId || !address || !user || !txHash) return;
    if (!selectedBodyId || !body) return;

    triggeredRef.current = true;
    setDbStatus('syncing');
    setWizardStep('payment');

    syncMutation.mutate(
      {
        walletAddress: address,
        destinationId: body.id,
        transactionHash: txHash,
        tokenId,
        pricePaid: body.priceEth,
        bookingReference: bookingRef,
        departureDate,
        departureTime: autoLaunchTime,
        travelClass,
        seatNumber: generatedSeat,
        availabilityStatus: 'confirmed',
        availabilityCheckedAt: new Date().toISOString(),
        flightNumber: autoFlightNumber,
        launchTerminal: autoLaunchTerminal,
      },
      {
        onSuccess: () => {
          setDbStatus('success');
          setWizardStep('confirmation');
          queryClient.invalidateQueries({ queryKey: ['booking-history'] });
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          queryClient.invalidateQueries({ queryKey: ['nfts'] });
        },
        onError: () => {
          setDbStatus('error');
          setWizardStep('confirmation');
        },
      },
    );
  }, [txStep, tokenId, address, user, txHash, selectedBodyId, body, syncMutation, queryClient, departureDate, autoLaunchTime, travelClass, generatedSeat, autoFlightNumber, autoLaunchTerminal, bookingRef]);

  const handleRetrySync = () => {
    if (!address || !user || !txHash || tokenId == null || !selectedBodyId || !body) return;

    setDbStatus('syncing');
    syncMutation.mutate(
      {
        walletAddress: address,
        destinationId: body.id,
        transactionHash: txHash,
        tokenId,
        pricePaid: body.priceEth,
        bookingReference: bookingRef,
        departureDate,
        departureTime: autoLaunchTime,
        travelClass,
        seatNumber: generatedSeat,
        availabilityStatus: 'confirmed',
        availabilityCheckedAt: new Date().toISOString(),
        flightNumber: autoFlightNumber,
        launchTerminal: autoLaunchTerminal,
      },
      {
        onSuccess: () => {
          setDbStatus('success');
          setWizardStep('confirmation');
          queryClient.invalidateQueries({ queryKey: ['booking-history'] });
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          queryClient.invalidateQueries({ queryKey: ['nfts'] });
        },
        onError: () => {
          setDbStatus('error');
        },
      },
    );
  };

  /* ─── Empty state ─── */
  if (!selectedBodyId || !body) {
    return (
      <div className='text-center text-gray-500 mt-6'>
        <p className='text-sm'>Select a destination to see details</p>
      </div>
    );
  }

  const canProceedFromTravelInfo = true;
  const canProceedFromDate = departureDate !== '';
  const canProceedFromAvailability = availabilityChecked;
  const canProceedFromClass = true;
  const canProceedFromAgreement = agreementAccepted;

  return (
    <>
      {/* Booking button */}
      <button
        onClick={handleOpenWizard}
        disabled={!isConnected}
        className='w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer bg-violet-600/80 hover:bg-violet-500 text-white border border-violet-500/50 disabled:bg-gray-700/60 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-700'
      >
        {!isConnected ? 'Connect wallet to book' : `Book Now — ${body.priceEth} ETH`}
      </button>

      {/* ─── WIZARD MODAL ─── */}
      {wizardOpen && createPortal(
        <div className='fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4' onClick={handleCloseWizard}>
          <div className='absolute inset-0 bg-[#09090b]/95 animate-modal-fade' />
          <div
            className='relative w-full sm:max-w-xl max-h-[85vh] sm:max-h-[90vh] flex flex-col animate-modal-scale bg-gray-900/95 backdrop-blur-xl border border-gray-700/60 shadow-2xl shadow-black/50 sm:rounded-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className='shrink-0 sticky top-0 z-20 bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 px-4 sm:px-6 py-3 sm:py-4 overflow-x-hidden'>
              <div className='flex items-center justify-between mb-2'>
                <h2 className='text-sm sm:text-base font-bold text-white'>Book Your Flight</h2>
                <button onClick={handleCloseWizard} className='w-7 h-7 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-white text-xs cursor-pointer border border-gray-700 shrink-0'>✕</button>
              </div>
              <BookingProgress currentStep={wizardStep} />
            </div>

            {/* Scrollable content */}
            <div className='flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6'>
              <div className='space-y-5'>
              {/* ─── Step 1: Travel Information ─── */}
              {wizardStep === 'travel-info' && (
                <div className='space-y-4'>
                  <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-3'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-lg font-bold text-white'>{body.name}</h3>
                      <span className='text-xs font-medium text-gray-400 capitalize bg-gray-800/60 px-2.5 py-0.5 rounded-full'>{body.type}</span>
                    </div>
                    <p className='text-xs text-gray-500'>{body.description}</p>
                    <div className='h-px bg-gradient-to-r from-gray-800 via-gray-700/50 to-transparent' />
                    <div className='grid grid-cols-2 gap-3 text-xs'>
                      {route && (
                        <>
                          <div>
                            <p className='text-[10px] text-gray-600 uppercase tracking-wider'>Route</p>
                            <p className='text-sm text-white font-medium'>{route.origin} → {body.name}</p>
                          </div>
                          <div>
                            <p className='text-[10px] text-gray-600 uppercase tracking-wider'>Distance</p>
                            <p className='text-sm text-white font-mono'>{route.distanceAU} AU</p>
                          </div>
                          <div>
                            <p className='text-[10px] text-gray-600 uppercase tracking-wider'>Est. Travel Time</p>
                            <p className='text-sm text-white font-mono'>{route.estimatedTravelDays.toLocaleString()} days</p>
                          </div>
                          <div>
                            <p className='text-[10px] text-gray-600 uppercase tracking-wider'>Launch Terminal</p>
                            <p className='text-sm text-white'>{autoLaunchTerminal}</p>
                          </div>
                        </>
                      )}
                      <div>
                        <p className='text-[10px] text-gray-600 uppercase tracking-wider'>Ticket Price</p>
                        <p className='text-sm text-emerald-400 font-mono font-bold'>{body.priceEth} ETH</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Step 2: Departure Date ─── */}
              {wizardStep === 'departure-date' && (
                <div className='space-y-4'>
                  <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-3'>
                    <h3 className='text-sm font-bold text-white'>Select Departure Date</h3>
                    <p className='text-[11px] text-gray-500'>Choose your preferred departure date from Earth Orbital Gateway.</p>
                    <input
                      type='date'
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className='w-full px-3 py-2.5 bg-gray-800/80 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors [color-scheme:dark]'
                    />
                    {departureDate && (
                      <p className='text-xs text-gray-400'>Departure: {new Date(departureDate).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} at {autoLaunchTime} UTC</p>
                    )}
                  </div>
                </div>
              )}

              {/* ─── Step 3: Check Availability ─── */}
              {wizardStep === 'availability' && (
                <div className='space-y-4'>
                  <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-3'>
                    <h3 className='text-sm font-bold text-white'>Launch Availability</h3>
                    <p className='text-[11px] text-gray-500'>Checking departure availability for {new Date(departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.</p>
                    {availabilityLoading && (
                      <div className='space-y-3 py-4'>
                        <div className='flex items-center gap-3'>
                          <LoadingSpinner size={20} />
                          <span className='text-sm text-violet-300'>Checking launch availability...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── Step 4: Available Flight ─── */}
              {wizardStep === 'flight' && availabilityChecked && (
                <div className='space-y-4'>
                  <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-3'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-sm font-bold text-white'>Available Launch</h3>
                      <span className='text-[10px] font-medium text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-700/40'>✓ Available</span>
                    </div>
                    <div className='bg-gray-800/40 rounded-lg p-3 space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs font-bold text-white font-mono'>{autoFlightNumber}</span>
                        <span className='text-[10px] text-gray-500'>SolarExpress</span>
                      </div>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-white font-medium'>{route?.origin ?? 'Earth'}</span>
                        <svg className='w-4 h-4 text-gray-600' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><polyline points='9 18 15 12 9 6' /></svg>
                        <span className='text-white font-medium'>{body.name}</span>
                      </div>
                      <div className='h-px bg-gray-700/50' />
                      <div className='grid grid-cols-2 gap-2 text-[11px]'>
                        <div>
                          <p className='text-gray-500'>Departure</p>
                          <p className='text-white'>{new Date(departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          <p className='text-gray-400 font-mono'>{autoLaunchTime} UTC</p>
                        </div>
                        <div>
                          <p className='text-gray-500'>Arrival</p>
                          <p className='text-white'>{route ? new Date(new Date(departureDate).getTime() + route.estimatedTravelDays * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                          <p className='text-gray-400 font-mono'>{route ? `${route.estimatedTravelDays.toLocaleString()} days` : '—'}</p>
                        </div>
                        <div>
                          <p className='text-gray-500'>Terminal</p>
                          <p className='text-white'>{autoLaunchTerminal}</p>
                        </div>
                        <div>
                          <p className='text-gray-500'>Seats Remaining</p>
                          <p className='text-white font-mono'>43 / 120</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Step 5: Passenger Class ─── */}
              {wizardStep === 'passenger-class' && (
                <div className='space-y-4'>
                  <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-3'>
                    <h3 className='text-sm font-bold text-white'>Select Passenger Class</h3>
                    <div className='space-y-2'>
                      {PASSENGER_CLASSES.map((pc) => {
                        const isSelected = travelClass === pc.id;
                        const isDisabled = !pc.available;
                        return (
                          <button
                            key={pc.id}
                            disabled={isDisabled}
                            onClick={() => setTravelClass(pc.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-violet-500/50 bg-violet-500/10'
                                : isDisabled
                                  ? 'border-gray-700/30 bg-gray-800/20 opacity-50 cursor-not-allowed'
                                  : 'border-gray-700/50 bg-gray-800/40 hover:border-gray-600'
                            }`}
                            title={isDisabled ? 'This travel class will be available in a future update.' : pc.label}
                          >
                            <div>
                              <p className={`text-sm font-medium ${isSelected ? 'text-violet-300' : isDisabled ? 'text-gray-600' : 'text-white'}`}>
                                {pc.label}
                              </p>
                              <p className={`text-[11px] ${isDisabled ? 'text-gray-600' : 'text-gray-500'}`}>
                                {pc.description}
                              </p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-violet-500 bg-violet-500' : isDisabled ? 'border-gray-700' : 'border-gray-600'
                            }`}>
                              {isSelected && <div className='w-2 h-2 rounded-full bg-white' />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Step 6: Travel Agreement ─── */}
              {wizardStep === 'agreement' && (
                <div className='space-y-4'>
                  <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-3'>
                    <h3 className='text-sm font-bold text-white'>Travel Agreement</h3>
                    <div className='bg-gray-800/40 rounded-lg p-3 space-y-2 text-[11px] text-gray-400'>
                      <p>• This is a fictional educational booking platform.</p>
                      <p>• NFT tickets represent proof of booking on the Sepolia test network.</p>
                      <p>• Blockchain transactions cannot be reversed once confirmed.</p>
                      <p>• Launch schedules are simulated for educational purposes.</p>
                      <p>• Users are responsible for confirming MetaMask transactions.</p>
                    </div>
                    <label className='flex items-start gap-3 cursor-pointer group'>
                      <input
                        type='checkbox'
                        checked={agreementAccepted}
                        onChange={(e) => setAgreementAccepted(e.target.checked)}
                        className='mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-800 text-violet-500 focus:ring-violet-500/30 cursor-pointer accent-violet-500'
                      />
                      <span className='text-xs text-gray-300 group-hover:text-white transition-colors'>
                        I agree to the SolarExpress Travel Terms.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* ─── Step 7: Review Booking ─── */}
              {wizardStep === 'review' && (
                <div className='space-y-4'>
                  <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-3'>
                    <h3 className='text-sm font-bold text-white'>Review Your Booking</h3>
                    <div className='space-y-2 text-xs'>
                      <div className='flex justify-between py-1.5 border-b border-gray-800/60'>
                        <span className='text-gray-500'>Destination</span>
                        <span className='text-white font-medium'>{body.name}</span>
                      </div>
                      <div className='flex justify-between py-1.5 border-b border-gray-800/60'>
                        <span className='text-gray-500'>Route</span>
                        <span className='text-white font-medium'>{route?.origin ?? 'Earth'} → {body.name}</span>
                      </div>
                      <div className='flex justify-between py-1.5 border-b border-gray-800/60'>
                        <span className='text-gray-500'>Distance</span>
                        <span className='text-white font-mono'>{route?.distanceAU ?? '—'} AU</span>
                      </div>
                      <div className='flex justify-between py-1.5 border-b border-gray-800/60'>
                        <span className='text-gray-500'>Est. Travel Time</span>
                        <span className='text-white font-mono'>{route ? `${route.estimatedTravelDays.toLocaleString()} days` : '—'}</span>
                      </div>
                      <div className='flex justify-between py-1.5 border-b border-gray-800/60'>
                        <span className='text-gray-500'>Departure Date</span>
                        <span className='text-white'>{departureDate ? new Date(departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                      </div>
                      <div className='flex justify-between py-1.5 border-b border-gray-800/60'>
                        <span className='text-gray-500'>Launch Time</span>
                        <span className='text-white font-mono'>{autoLaunchTime} UTC</span>
                      </div>
                      <div className='flex justify-between py-1.5 border-b border-gray-800/60'>
                        <span className='text-gray-500'>Flight Number</span>
                        <span className='text-white font-mono'>{autoFlightNumber}</span>
                      </div>
                      <div className='flex justify-between py-1.5 border-b border-gray-800/60'>
                        <span className='text-gray-500'>Passenger Class</span>
                        <span className='text-white capitalize'>{travelClass}</span>
                      </div>
                      <div className='flex justify-between py-1.5 border-b border-gray-800/60'>
                        <span className='text-gray-500'>Seat Number</span>
                        <span className='text-white font-mono'>{generatedSeat}</span>
                      </div>
                      <div className='flex justify-between py-1.5 border-b border-gray-800/60'>
                        <span className='text-gray-500'>Booking Reference</span>
                        <span className='text-white font-mono'>{bookingRef}</span>
                      </div>
                      <div className='flex justify-between py-1.5 border-b border-gray-800/60'>
                        <span className='text-gray-500'>Wallet Address</span>
                        <span className='text-white font-mono text-[10px]'>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '—'}</span>
                      </div>
                      <div className='flex justify-between py-1.5 border-b border-gray-800/60'>
                        <span className='text-gray-500'>Price</span>
                        <span className='text-emerald-400 font-mono font-bold'>{body.priceEth} ETH</span>
                      </div>
                      <div className='flex justify-between py-1.5 border-b border-gray-800/60'>
                        <span className='text-gray-500'>Network</span>
                        <span className='text-gray-300 font-mono'>Sepolia</span>
                      </div>
                      <div className='flex justify-between py-1.5'>
                        <span className='text-gray-500'>Launch Terminal</span>
                        <span className='text-white text-right max-w-[200px]'>{autoLaunchTerminal}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => goToStep('agreement')} className='w-full text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer bg-transparent border-none'>
                    Back
                  </button>
                </div>
              )}

              {/* ─── Step 8: Payment / Blockchain Flow ─── */}
              {wizardStep === 'payment' && (
                <div className='space-y-4'>
                  {(metadataGeneratingRef.current || metadataError) && txStep === 'idle' && (
                    metadataError ? (
                      <div className='bg-red-900/20 border border-red-700/30 rounded-xl p-4 space-y-3'>
                        <p className='text-sm font-medium text-red-300'>Metadata Generation Failed</p>
                        <p className='text-xs text-red-200/70'>{metadataError}</p>
                        <button
                          onClick={() => { setWizardStep('review'); metadataGeneratingRef.current = false; setMetadataError(null); }}
                          className='text-xs text-gray-400 hover:text-white underline underline-offset-2 cursor-pointer'
                        >
                          Back to review
                        </button>
                      </div>
                    ) : (
                      <div className='bg-violet-900/20 border border-violet-700/30 rounded-xl p-4 text-center space-y-3'>
                        <LoadingSpinner size={32} className='mx-auto' />
                        <p className='text-sm text-violet-300'>Generating NFT Artwork...</p>
                        <p className='text-[11px] text-violet-200/60'>Creating ticket image and uploading to IPFS.</p>
                      </div>
                    )
                  )}
                  {(txStep === 'idle' || txStep === 'preparing') && !metadataGeneratingRef.current && !metadataError && (
                    <div className='bg-violet-900/20 border border-violet-700/30 rounded-xl p-4 text-center space-y-3'>
                      <LoadingSpinner size={32} className='mx-auto' />
                      <p className='text-sm text-violet-300'>Preparing Transaction...</p>
                    </div>
                  )}
                  {txStep === 'pending' && (
                    <div className='bg-amber-900/20 border border-amber-700/30 rounded-xl p-4 text-center space-y-3'>
                      <LoadingSpinner size={32} className='mx-auto' />
                      <p className='text-sm text-amber-300'>Waiting for MetaMask...</p>
                      <p className='text-[11px] text-amber-200/60'>Please confirm the transaction in your wallet.</p>
                    </div>
                  )}
                  {txStep === 'broadcasting' && (
                    <div className='bg-violet-900/20 border border-violet-700/30 rounded-xl p-4 text-center space-y-3'>
                      <LoadingSpinner size={32} className='mx-auto' />
                      <p className='text-sm text-violet-300'>Broadcasting Transaction...</p>
                    </div>
                  )}
                  {txStep === 'confirming' && (
                    <div className='bg-purple-900/20 border border-purple-700/30 rounded-xl p-4 text-center space-y-3'>
                      <LoadingSpinner size={32} className='mx-auto' />
                      <p className='text-sm text-purple-300'>Waiting for Block Confirmation...</p>
                      {txHash && (
                        <a href={`${SEPOLIA_ETHERSCAN}/${txHash}`} target='_blank' rel='noopener noreferrer' className='text-[11px] text-violet-400 hover:text-violet-300 underline underline-offset-2 inline-block'>
                          View transaction on Etherscan
                        </a>
                      )}
                    </div>
                  )}
                  {txStep === 'error' && txError && (
                    <div className='bg-red-900/20 border border-red-700/30 rounded-xl p-4 space-y-3'>
                      <p className='text-sm font-medium text-red-300'>Transaction Failed</p>
                      <p className='text-xs text-red-200/70'>{formatError(txError)}</p>
                      <button onClick={() => setWizardStep('review')} className='text-xs text-gray-400 hover:text-white underline underline-offset-2 cursor-pointer'>
                        Back to review
                      </button>
                    </div>
                  )}
                  {dbStatus === 'syncing' && (
                    <div className='bg-violet-900/20 border border-violet-700/30 rounded-xl p-4 text-center space-y-3'>
                      <LoadingSpinner size={28} className='mx-auto' />
                      <p className='text-xs text-violet-300'>Saving booking to database...</p>
                    </div>
                  )}
                  {dbStatus === 'error' && (
                    <div className='bg-amber-900/20 border border-amber-700/30 rounded-xl p-4 space-y-3'>
                      <p className='text-sm font-medium text-amber-300'>Booking saved on blockchain</p>
                      <p className='text-xs text-amber-200/70'>Database sync failed. Your NFT is safe on-chain.</p>
                      <button onClick={handleRetrySync} className='text-xs text-amber-300 hover:text-amber-200 underline underline-offset-2 cursor-pointer'>
                        Retry sync
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ─── Step 9: Confirmation ─── */}
              {wizardStep === 'confirmation' && dbStatus === 'success' && tokenId != null && txHash && (
                <div className='space-y-4'>
                  <div className='bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4 text-center space-y-2'>
                    <svg className='w-10 h-10 mx-auto text-emerald-400' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                      <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14' /><polyline points='22 4 12 14.01 9 11.01' />
                    </svg>
                    <p className='text-base font-bold text-emerald-300'>Booking Confirmed!</p>
                    <p className='text-xs text-emerald-200/70'>Your NFT ticket has been minted and saved.</p>
                  </div>

                  <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl overflow-hidden'>
                    <NFTTicket destinationId={body.id} tokenId={tokenId} priceEth={body.priceEth} />
                  </div>

                  <div className='bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 space-y-2 text-xs'>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Booking Reference</span>
                      <span className='text-white font-mono'>{bookingRef}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Flight</span>
                      <span className='text-white font-mono'>{autoFlightNumber}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Departure</span>
                      <span className='text-white'>{departureDate ? new Date(departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} at {autoLaunchTime} UTC</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Seat</span>
                      <span className='text-white font-mono'>{generatedSeat}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Class</span>
                      <span className='text-white capitalize'>{travelClass}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Token ID</span>
                      <span className='text-white font-mono'>#{tokenId}</span>
                    </div>
                  </div>

                  <a
                    href={`${SEPOLIA_ETHERSCAN}/${txHash}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='block w-full py-2.5 text-center text-xs font-medium bg-gray-800 hover:bg-gray-700 text-violet-400 border border-gray-700 rounded-lg transition-colors'
                  >
                    View on Sepolia Etherscan
                  </a>

                  <div className='flex flex-col gap-2'>
                    <Link
                      href='/booking-history'
                      className='block w-full py-2.5 text-center text-xs font-medium bg-violet-600/80 hover:bg-violet-500 text-white border border-violet-500/50 rounded-lg transition-colors'
                    >
                      Go to My Tickets
                    </Link>
                    <button
                      onClick={() => { handleCloseWizard(); resetTx(); setDbStatus('idle'); triggeredRef.current = false; }}
                      className='w-full py-2 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg transition-colors cursor-pointer'
                    >
                      Book Another Flight
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 'confirmation' && dbStatus === 'error' && (
                <div className='space-y-4 text-center'>
                  <p className='text-sm font-medium text-amber-300'>NFT Minted — Sync Pending</p>
                  <p className='text-xs text-gray-400'>Your NFT was minted successfully. Retry database sync to see it in your tickets.</p>
                  <button onClick={handleRetrySync} className='text-xs text-amber-300 hover:text-amber-200 underline underline-offset-2 cursor-pointer'>Retry sync</button>
                  <button onClick={handleCloseWizard} className='text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 cursor-pointer'>Close</button>
                </div>
              )}
            </div>
          </div>

          {/* Sticky bottom bar — always visible, shows current step action */}
          <div className='shrink-0 sticky bottom-0 z-20 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 px-4 sm:px-6 py-3.5'>
            {wizardStep !== 'confirmation' && wizardStep !== 'payment' && (
              <button
                onClick={() => {
                  if (wizardStep === 'travel-info') goToStep('departure-date');
                  else if (wizardStep === 'departure-date') { if (canProceedFromDate) goToStep('availability'); }
                  else if (wizardStep === 'availability') { if (!availabilityChecked && !availabilityLoading) handleCheckAvailability(); else if (availabilityChecked) goToStep('flight'); }
                  else if (wizardStep === 'flight') goToStep('passenger-class');
                  else if (wizardStep === 'passenger-class') goToStep('agreement');
                  else if (wizardStep === 'agreement') { if (canProceedFromAgreement) goToStep('review'); }
                  else if (wizardStep === 'review') {
                    if (isConnected && body && !metadataGeneratingRef.current) {
                      setWizardStep('payment');
                      metadataGeneratingRef.current = true;
                      setMetadataError(null);
                      generateNFTMetadata(body.id, body.priceEth, address)
                        .then((result) => {
                          setMetadataUri(result.metadataUri);
                          metadataGeneratingRef.current = false;
                          buyTicket(body.id, body.priceEth, result.metadataUri);
                        })
                        .catch((err) => {
                          console.error('[metadata] generation failed:', err);
                          setMetadataError(err instanceof Error ? err.message : 'Failed to generate NFT metadata');
                          metadataGeneratingRef.current = false;
                        });
                    }
                  }
                }}
                disabled={
                  (wizardStep === 'departure-date' && !canProceedFromDate) ||
                  (wizardStep === 'agreement' && !canProceedFromAgreement) ||
                  (wizardStep === 'review' && !isConnected)
                }
                className='w-full py-2.5 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-all cursor-pointer disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed'
              >
                {wizardStep === 'travel-info' && 'Continue — Departure Date'}
                {wizardStep === 'departure-date' && 'Check Availability'}
                {wizardStep === 'availability' && (availabilityChecked ? 'View Flight Details' : 'Check Availability')}
                {wizardStep === 'flight' && 'Select Passenger Class'}
                {wizardStep === 'passenger-class' && 'Review Travel Agreement'}
                {wizardStep === 'agreement' && 'Review Booking'}
                {wizardStep === 'review' && (isConnected ? `Confirm & Pay — ${body.priceEth} ETH` : 'Connect Wallet to Book')}
              </button>
            )}
          </div>
        </div>
      </div>
      , document.body)}
    </>
  );
}

function formatError(err: Error): string {
  const msg = err.message || '';
  if (msg.includes('User denied') || msg.includes('user rejected') || msg.includes('ethers://'))
    return 'Transaction cancelled.';
  if (msg.includes('insufficient funds') || msg.includes('Insufficient balance'))
    return 'Insufficient funds for this transaction.';
  if (msg.includes('wrong network') || msg.includes('chain'))
    return 'Please switch to the Sepolia network.';
  if (msg.includes('0x'))
    return `Contract error: ${msg.slice(0, 120)}`;
  return msg.length > 150 ? msg.slice(0, 150) + '...' : msg;
}
