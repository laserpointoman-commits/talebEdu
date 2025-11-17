import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  getPendingSync, 
  markAsSynced, 
  clearSyncedItems,
  setLastSyncTime 
} from '@/utils/offlineStorage';
import { toast } from 'sonner';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing data...');
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Changes will be saved locally and synced when online.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync if online
    if (navigator.onLine) {
      syncPendingChanges();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncPendingChanges = async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    try {
      const pendingItems = await getPendingSync();
      
      if (pendingItems.length === 0) {
        setIsSyncing(false);
        return;
      }

      console.log(`Syncing ${pendingItems.length} pending changes...`);

      for (const item of pendingItems) {
        try {
          switch (item.operation) {
            case 'INSERT':
              await supabase.from(item.table as any).insert(item.data);
              break;
            case 'UPDATE':
              await supabase.from(item.table as any).update(item.data).eq('id', item.data.id);
              break;
            case 'DELETE':
              await supabase.from(item.table as any).delete().eq('id', item.data.id);
              break;
          }
          
          await markAsSynced(item.id);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
        }
      }

      await clearSyncedItems();
      await setLastSyncTime();
      
      toast.success(`Synced ${pendingItems.length} changes successfully!`);
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Some changes failed to sync. Will retry later.');
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    isSyncing,
    syncPendingChanges,
  };
}
