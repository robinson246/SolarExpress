'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import SolarExpressLogo from '@/components/ui/SolarExpressLogo';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function SignInPage() {
  const router = useRouter();
  const { signIn, signUp, loading, error, user, checkingSession } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!checkingSession && user) {
      router.replace('/');
    }
  }, [checkingSession, user, router]);

  if (checkingSession || user) {
    return <LoadingScreen visible message='Checking session...' />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && password.length < 8) return;
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      router.replace('/');
    } catch {
      // error is shown from context
    }
  };

  return (
    <div className='h-full w-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black'>
      <div className='w-full max-w-sm space-y-5 p-6'>
        <div className='flex flex-col items-center space-y-4'>
          <SolarExpressLogo size='lg' />
          <h1 className='text-xl font-semibold text-white text-center'>SolarExpress</h1>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4 bg-gray-900 border border-gray-700 rounded-xl p-6'>
          <h2 className='text-lg font-semibold text-white'>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

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
              placeholder='&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;'
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
    </div>
  );
}
