import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { SavedScenario, WatchlistItem, UserProfile } from '../types/mandi';

const LOCAL_STORAGE_SCENARIOS_KEY = 'mandi_local_scenarios';
const LOCAL_STORAGE_WATCHLIST_KEY = 'mandi_local_watchlist';

/**
 * Persists or updates user profile in Firestore
 */
export async function syncUserProfile(profile: UserProfile): Promise<void> {
  if (!auth.currentUser) return;
  const path = `users/${profile.id}`;
  try {
    await setDoc(doc(db, 'users', profile.id), profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Saves a custom cultivation scenario with real-time Firestore sync
 */
export async function saveCultivationScenario(
  scenario: Omit<SavedScenario, 'id' | 'createdAt'>
): Promise<SavedScenario> {
  const user = auth.currentUser;
  const id = `scenario_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullScenario: SavedScenario = {
    ...scenario,
    id,
    createdAt: new Date().toISOString(),
  };

  if (user) {
    const path = `users/${user.uid}/savedScenarios/${id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'savedScenarios', id), fullScenario);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    // Local fallback for guests
    const existing = getLocalScenarios();
    const updated = [fullScenario, ...existing];
    localStorage.setItem(LOCAL_STORAGE_SCENARIOS_KEY, JSON.stringify(updated));
  }

  return fullScenario;
}

/**
 * Deletes a scenario
 */
export async function deleteCultivationScenario(scenarioId: string): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    const path = `users/${user.uid}/savedScenarios/${scenarioId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'savedScenarios', scenarioId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  } else {
    const existing = getLocalScenarios();
    const updated = existing.filter((s) => s.id !== scenarioId);
    localStorage.setItem(LOCAL_STORAGE_SCENARIOS_KEY, JSON.stringify(updated));
  }
}

/**
 * Subscribes to real-time scenarios for current user
 */
export function subscribeToScenarios(
  userId: string | null,
  callback: (scenarios: SavedScenario[]) => void
): () => void {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    callback(getLocalScenarios());
    const interval = setInterval(() => callback(getLocalScenarios()), 2000);
    return () => clearInterval(interval);
  }

  const path = `users/${userId}/savedScenarios`;
  const q = query(collection(db, 'users', userId, 'savedScenarios'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items: SavedScenario[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as SavedScenario);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

/**
 * Adds or updates a mandi to user's real-time watchlist
 */
export async function addToWatchlist(
  item: Omit<WatchlistItem, 'id' | 'addedAt' | 'userId'> & { userId?: string }
): Promise<WatchlistItem> {
  const user = auth.currentUser;
  const id = `wl_${item.state}_${item.market}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fullItem: WatchlistItem = {
    ...item,
    userId: item.userId || user?.uid || 'guest',
    id,
    addedAt: new Date().toISOString(),
  };

  if (user && user.uid === fullItem.userId) {
    const path = `users/${user.uid}/watchlists/${id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'watchlists', id), fullItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    const existing = getLocalWatchlist();
    const filtered = existing.filter((w) => w.id !== id);
    const updated = [fullItem, ...filtered];
    localStorage.setItem(LOCAL_STORAGE_WATCHLIST_KEY, JSON.stringify(updated));
  }

  return fullItem;
}

/**
 * Removes a mandi from watchlist
 */
export async function removeFromWatchlist(watchlistId: string): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    const path = `users/${user.uid}/watchlists/${watchlistId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'watchlists', watchlistId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  } else {
    const existing = getLocalWatchlist();
    const updated = existing.filter((w) => w.id !== watchlistId);
    localStorage.setItem(LOCAL_STORAGE_WATCHLIST_KEY, JSON.stringify(updated));
  }
}

/**
 * Subscribes to real-time watchlist items
 */
export function subscribeToWatchlist(
  userId: string | null,
  callback: (items: WatchlistItem[]) => void
): () => void {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    callback(getLocalWatchlist());
    const interval = setInterval(() => callback(getLocalWatchlist()), 2000);
    return () => clearInterval(interval);
  }

  const path = `users/${userId}/watchlists`;
  const q = query(collection(db, 'users', userId, 'watchlists'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items: WatchlistItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as WatchlistItem);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

// Helpers for localStorage fallback
function getLocalScenarios(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SCENARIOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_WATCHLIST_KEY);
    if (raw) return JSON.parse(raw);
    // Default seeded watchlist for demonstration
    return [
      {
        id: 'wl_maharashtra_satara',
        userId: 'guest',
        state: 'Maharashtra',
        market: 'Satara',
        targetPrice: 150,
        alertCondition: 'above',
        addedAt: new Date().toISOString(),
      },
      {
        id: 'wl_karnataka_shimoga',
        userId: 'guest',
        state: 'Karnataka',
        market: 'Shimoga',
        targetPrice: 200,
        alertCondition: 'above',
        addedAt: new Date().toISOString(),
      },
    ];
  } catch {
    return [];
  }
}
