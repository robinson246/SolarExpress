'use client';

import { useRef, useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className='fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8'
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className='absolute inset-0 bg-[#09090b]/95 animate-modal-fade' />
      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-modal-scale bg-gray-900/95 backdrop-blur-xl border border-gray-700/60 rounded-3xl shadow-2xl shadow-black/50`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className='absolute top-5 right-5 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 text-gray-400 hover:text-white hover:bg-gray-700 text-sm cursor-pointer backdrop-blur-sm border border-gray-700/50 transition-colors'
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
