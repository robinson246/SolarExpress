'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Modal from '@/components/ui/Modal';

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SignInModal({ open, onClose }: SignInModalProps) {
  const { signIn, signUp, loading, error } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!open) return;
    setEmail('');
    setPassword('');
    setIsSignUp(false);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      onClose();
    } catch {
      // error is in context state
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth='max-w-sm'>
      <div className='p-6 space-y-5'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-white'>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-xs text-gray-400 mb-1'>Email</label>
            <input
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 transition-colors'
              placeholder='you@example.com'
            />
          </div>
          <div>
            <label className='block text-xs text-gray-400 mb-1'>Password</label>
            <input
              type='password'
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 transition-colors'
              placeholder='••••••••'
            />
          </div>

          {error && (
            <p className='text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2'>
              {error}
            </p>
          )}

          <button
            type='submit'
            disabled={loading}
            className='w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-wait text-white text-sm font-medium rounded-lg transition-colors cursor-pointer'
          >
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p className='text-xs text-center text-gray-500'>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className='text-violet-400 hover:text-violet-300 underline underline-offset-2 cursor-pointer'
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </Modal>
  );
}
