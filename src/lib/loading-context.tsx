'use client';

import { createContext, useState, useCallback, type ReactNode } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';

type LoadingContextType = {
  isLoading: boolean;
  setLoading: (v: boolean, msg?: string) => void;
  message: string | undefined;
};

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setLoading: () => {},
  message: undefined,
});

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  const setLoading = useCallback((v: boolean, msg?: string) => {
    setIsLoading(v);
    if (msg) setMessage(msg);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading, message }}>
      {children}
      <LoadingScreen visible={isLoading} message={message} />
    </LoadingContext.Provider>
  );
}


