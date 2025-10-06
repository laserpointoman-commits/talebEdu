import { useEffect } from 'react';
import { usePageLoader } from '@/contexts/LoadingContext';

// Hook to wrap async operations and track loading state
export function useAsyncLoading(id: string = 'default') {
  const { startLoading, stopLoading } = usePageLoader(id);

  const executeAsync = async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
    startLoading();
    try {
      const result = await asyncFn();
      return result;
    } finally {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        stopLoading();
      }, 100);
    }
  };

  // Auto-stop loading on unmount
  useEffect(() => {
    return () => {
      stopLoading();
    };
  }, [stopLoading]);

  return { executeAsync, startLoading, stopLoading };
}