import { supabase } from '@/integrations/supabase/client';
import {
  saveToOffline,
  getAllFromOffline,
  addToSyncQueue,
  initDB,
} from './offlineStorage';

type StoreName = 'students' | 'teachers' | 'fees' | 'attendance';

export class OfflineDataManager {
  private isOnline = navigator.onLine;

  constructor() {
    initDB();
    
    window.addEventListener('online', () => {
      this.isOnline = true;
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async fetch<T>(
    table: string,
    storeName: StoreName,
    query?: any
  ): Promise<T[] | null> {
    if (this.isOnline) {
      try {
        const { data, error } = await supabase.from(table as any).select(query || '*');

        if (error) throw error;

        // Cache data offline
        if (data && Array.isArray(data)) {
          for (const item of data) {
            await saveToOffline(storeName, item);
          }
        }

        return data as T[];
      } catch (error) {
        console.warn('Online fetch failed, using offline data:', error);
        return this.getOfflineData<T>(storeName);
      }
    } else {
      return this.getOfflineData<T>(storeName);
    }
  }

  private async getOfflineData<T>(storeName: StoreName): Promise<T[] | null> {
    try {
      const data = await getAllFromOffline(storeName);
      return data as T[];
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  }

  async insert(table: string, storeName: StoreName, data: any) {
    if (this.isOnline) {
      try {
        const { data: result, error } = await supabase
          .from(table as any)
          .insert(data)
          .select();

        if (error) throw error;

        // Cache the inserted data
        if (result && result[0]) {
          await saveToOffline(storeName, result[0]);
        }

        return { data: result, error: null };
      } catch (error: any) {
        // If online insert fails, queue for later sync
        await addToSyncQueue(table, 'INSERT', data);
        await saveToOffline(storeName, { ...data, id: crypto.randomUUID() });
        return { data: [data], error: null };
      }
    } else {
      // Offline: save locally and queue for sync
      const localData = { ...data, id: crypto.randomUUID() };
      await saveToOffline(storeName, localData);
      await addToSyncQueue(table, 'INSERT', localData);
      return { data: [localData], error: null };
    }
  }

  async update(table: string, storeName: StoreName, id: string, data: any) {
    if (this.isOnline) {
      try {
        const { data: result, error } = await supabase
          .from(table as any)
          .update(data)
          .eq('id', id)
          .select();

        if (error) throw error;

        // Update offline cache
        if (result && result[0]) {
          await saveToOffline(storeName, result[0]);
        }

        return { data: result, error: null };
      } catch (error: any) {
        // If online update fails, queue for later sync
        await addToSyncQueue(table, 'UPDATE', { ...data, id });
        await saveToOffline(storeName, { ...data, id });
        return { data: [{ ...data, id }], error: null };
      }
    } else {
      // Offline: update locally and queue for sync
      await saveToOffline(storeName, { ...data, id });
      await addToSyncQueue(table, 'UPDATE', { ...data, id });
      return { data: [{ ...data, id }], error: null };
    }
  }

  async delete(table: string, storeName: StoreName, id: string) {
    if (this.isOnline) {
      try {
        const { error } = await supabase
          .from(table as any)
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Remove from offline cache
        await saveToOffline(storeName, { id, _deleted: true });

        return { error: null };
      } catch (error: any) {
        // If online delete fails, queue for later sync
        await addToSyncQueue(table, 'DELETE', { id });
        await saveToOffline(storeName, { id, _deleted: true });
        return { error: null };
      }
    } else {
      // Offline: mark as deleted locally and queue for sync
      await saveToOffline(storeName, { id, _deleted: true });
      await addToSyncQueue(table, 'DELETE', { id });
      return { error: null };
    }
  }
}

export const offlineDataManager = new OfflineDataManager();
