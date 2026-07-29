'use client';

import { useRef, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className='fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8'
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
    </div>,
    document.body
  );
}
