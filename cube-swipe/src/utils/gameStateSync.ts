// Game State Sync - IndexedDB for offline persistence
const DB_NAME = 'CubeSwipe2048DB';
const STORE_NAME = 'gameState';
const DB_VERSION = 1;

export interface GameState {
  grid: number[][];
  score: number;
  bestScore: number;
  gameMode: 'classic' | 'fibonacci';
  timestamp: number;
}

// Initialize IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Save game state to IndexedDB
export const saveGameState = async (state: GameState): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const stateWithId = {
      id: 'currentGame',
      ...state,
      timestamp: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(stateWithId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('Failed to save game state:', error);
    throw error;
  }
};

// Load game state from IndexedDB
export const loadGameState = async (): Promise<GameState | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const state = await new Promise<GameState | null>((resolve, reject) => {
      const request = store.get('currentGame');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return state;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
};

// Clear game state
export const clearGameState = async (): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete('currentGame');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('Failed to clear game state:', error);
    throw error;
  }
};

// Check if IndexedDB is supported
export const isIndexedDBSupported = (): boolean => {
  return 'indexedDB' in window;
};
