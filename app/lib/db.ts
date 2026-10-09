import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FlightLogEx, FlightImage } from '../types';

interface TrackerDB extends DBSchema {
  logs: {
    key: string;
    value: FlightLogEx;
    indexes: { 'by-year': number };
  };
  images: {
    key: string;
    value: FlightImage;
  };
}

const DB_NAME = 'UltimateFlightTrackerDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TrackerDB>> | null = null;

if (typeof window !== 'undefined') {
  dbPromise = openDB<TrackerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('logs')) {
        const store = db.createObjectStore('logs', { keyPath: 'id' });
        store.createIndex('by-year', 'year');
      }
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'id' });
      }
    },
  });
}

// Migration from localStorage
export async function migrateFromLocalStorage() {
  if (typeof window === 'undefined' || !dbPromise) return;
  const db = await dbPromise;
  
  const savedLogs = localStorage.getItem("sfc_flight_logs");
  if (savedLogs) {
    try {
      const logs = JSON.parse(savedLogs);
      const tx = db.transaction('logs', 'readwrite');
      let migratedCount = 0;
      for (const log of logs) {
        const existing = await tx.store.get(log.id);
        if (!existing) {
          await tx.store.put({
            ...log,
            airline: 'ANA',
            lsp: 0,
          });
          migratedCount++;
        }
      }
      await tx.done;
      if (migratedCount > 0) {
        console.log(`Migrated ${migratedCount} logs from localStorage`);
      }
      // Optionally clear localStorage after successful migration? We might want to keep it temporarily.
    } catch (e) {
      console.error("Failed to migrate logs from localStorage", e);
    }
  }
}

// Logs API
export async function getAllLogs(): Promise<FlightLogEx[]> {
  if (!dbPromise) return [];
  const db = await dbPromise;
  return db.getAll('logs');
}

export async function saveLog(log: FlightLogEx): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.put('logs', log);
}

export async function deleteLog(id: string): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.delete('logs', id);
}

export async function getLogsByYear(year: number): Promise<FlightLogEx[]> {
  if (!dbPromise) return [];
  const db = await dbPromise;
  return db.getAllFromIndex('logs', 'by-year', year);
}

// Images API
export async function saveImage(imageId: string, dataUrl: string): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.put('images', { id: imageId, data: dataUrl });
}

export async function getImage(imageId: string): Promise<string | null> {
  if (!dbPromise) return null;
  const db = await dbPromise;
  const record = await db.get('images', imageId);
  return record ? record.data : null;
}

export async function deleteImage(imageId: string): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.delete('images', imageId);
}
