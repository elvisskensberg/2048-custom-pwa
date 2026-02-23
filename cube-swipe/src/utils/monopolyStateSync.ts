// ---------------------------------------------------------------------------
// Monopoly Deal — IndexedDB persistence (same pattern as gameStateSync.ts)
// ---------------------------------------------------------------------------

const DB_NAME = 'MonopolyDealDB'
const STORE_NAME = 'gameState'
const DB_VERSION = 1
const STATE_KEY = 'currentGame'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (): void => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = (): void => resolve(request.result)
    request.onerror = (): void => reject(request.error)
  })
}

export async function saveMonopolyState(serializedState: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put({ state: serializedState, timestamp: Date.now() }, STATE_KEY)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = (): void => resolve()
      tx.onerror = (): void => reject(tx.error)
    })
    db.close()
  } catch {
    // Graceful degradation — persistence is not critical
  }
}

export async function loadMonopolyState(): Promise<string | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(STATE_KEY)
    const result = await new Promise<unknown>((resolve, reject) => {
      request.onsuccess = (): void => resolve(request.result)
      request.onerror = (): void => reject(request.error)
    })
    db.close()
    if (result && typeof result === 'object' && 'state' in result) {
      return (result as { state: string }).state
    }
    return null
  } catch {
    return null
  }
}

export async function clearMonopolyState(): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(STATE_KEY)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = (): void => resolve()
      tx.onerror = (): void => reject(tx.error)
    })
    db.close()
  } catch {
    // Graceful degradation
  }
}
