import { createContext, useContext, useState, useCallback } from 'react';

interface LoadingContextType {
  isPageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
  registerLoader: (id: string) => void;
  unregisterLoader: (id: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [activeLoaders, setActiveLoaders] = useState<Set<string>>(new Set());

  const setPageLoading = useCallback((loading: boolean) => {
    setIsPageLoading(loading);
  }, []);

  const registerLoader = useCallback((id: string) => {
    setActiveLoaders(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
    setIsPageLoading(true);
  }, []);

  const unregisterLoader = useCallback((id: string) => {
    setActiveLoaders(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      if (newSet.size === 0) {
        setIsPageLoading(false);
      }
      return newSet;
    });
  }, []);

  return (
    <LoadingContext.Provider value={{ 
      isPageLoading, 
      setPageLoading, 
      registerLoader, 
      unregisterLoader 
    }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// Hook to track component loading
export function usePageLoader(id: string) {
  const { registerLoader, unregisterLoader } = useLoading();

  const startLoading = useCallback(() => {
    registerLoader(id);
  }, [id, registerLoader]);

  const stopLoading = useCallback(() => {
    unregisterLoader(id);
  }, [id, unregisterLoader]);

  return { startLoading, stopLoading };
}