import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TalebEduDB extends DBSchema {
  students: {
    key: string;
    value: any;
    indexes: { 'by-updated': string };
  };
  teachers: {
    key: string;
    value: any;
  };
  fees: {
    key: string;
    value: any;
  };
  attendance: {
    key: string;
    value: any;
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      table: string;
      operation: 'INSERT' | 'UPDATE' | 'DELETE';
      data: any;
      timestamp: number;
      synced: boolean;
    };
  };
  metadata: {
    key: string;
    value: {
      lastSync: number;
      isOnline: boolean;
    };
  };
}

let db: IDBPDatabase<TalebEduDB> | null = null;

export async function initDB() {
  if (db) return db;

  db = await openDB<TalebEduDB>('talebedu-offline', 1, {
    upgrade(db) {
      // Students store
      if (!db.objectStoreNames.contains('students')) {
        const studentStore = db.createObjectStore('students', { keyPath: 'id' });
        studentStore.createIndex('by-updated', 'updated_at');
      }

      // Teachers store
      if (!db.objectStoreNames.contains('teachers')) {
        db.createObjectStore('teachers', { keyPath: 'id' });
      }

      // Fees store
      if (!db.objectStoreNames.contains('fees')) {
        db.createObjectStore('fees', { keyPath: 'id' });
      }

      // Attendance store
      if (!db.objectStoreNames.contains('attendance')) {
        db.createObjectStore('attendance', { keyPath: 'id' });
      }

      // Sync queue
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }

      // Metadata
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
  });

  return db;
}

// Generic CRUD operations
export async function saveToOffline(storeName: keyof TalebEduDB, data: any) {
  const database = await initDB();
  await database.put(storeName as any, data);
}

export async function getAllFromOffline(storeName: keyof TalebEduDB) {
  const database = await initDB();
  return database.getAll(storeName as any);
}

export async function getFromOffline(storeName: keyof TalebEduDB, id: string) {
  const database = await initDB();
  return database.get(storeName as any, id);
}

export async function deleteFromOffline(storeName: keyof TalebEduDB, id: string) {
  const database = await initDB();
  await database.delete(storeName as any, id);
}

// Sync queue operations
export async function addToSyncQueue(
  table: string,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  data: any
) {
  const database = await initDB();
  await database.add('syncQueue', {
    id: crypto.randomUUID(),
    table,
    operation,
    data,
    timestamp: Date.now(),
    synced: false,
  });
}

export async function getPendingSync() {
  const database = await initDB();
  const queue = await database.getAll('syncQueue');
  return queue.filter(item => !item.synced);
}

export async function markAsSynced(id: string) {
  const database = await initDB();
  const item = await database.get('syncQueue', id);
  if (item) {
    item.synced = true;
    await database.put('syncQueue', item);
  }
}

export async function clearSyncedItems() {
  const database = await initDB();
  const tx = database.transaction('syncQueue', 'readwrite');
  const index = await tx.store.getAll();
  
  for (const item of index) {
    if (item.synced) {
      await tx.store.delete(item.id);
    }
  }
  
  await tx.done;
}

// Metadata operations
export async function setLastSyncTime() {
  const database = await initDB();
  await database.put('metadata', {
    lastSync: Date.now(),
    isOnline: navigator.onLine,
  } as any);
}

export async function getLastSyncTime() {
  const database = await initDB();
  const metadata = await database.get('metadata', 'lastSync' as any);
  return (metadata as any)?.lastSync || 0;
}
