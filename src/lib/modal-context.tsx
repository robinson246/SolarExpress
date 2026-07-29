'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface ModalContextValue {
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextValue>({ isModalOpen: false, setModalOpen: () => {} });

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setModalOpen] = useState(false);
  return (
    <ModalContext.Provider value={{ isModalOpen, setModalOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModalOpen() {
  return useContext(ModalContext);
}
