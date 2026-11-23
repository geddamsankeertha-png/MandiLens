/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Market Sync Service (SQLite-First Offline Sync + In-Memory Guest Fallback)
 * Replaces mandatory Firebase/Firestore calls with SQLite-backed /api/watchlists & /api/scenarios.
 */

import { SavedScenario, WatchlistItem, UserProfile } from '../types/mandi';
import { predictionApi } from './predictionApi';

let guestScenarios: SavedScenario[] = [];
let guestWatchlist: WatchlistItem[] = [
  {
    id: 'wl_ap_guntur',
    userId: 'guest',
    state: 'Andhra Pradesh',
    market: 'Guntur',
    commodity: 'Tomato',
    targetPrice: 40,
    alertCondition: 'above',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'wl_mh_lasalgaon',
    userId: 'guest',
    state: 'Maharashtra',
    market: 'Lasalgaon',
    commodity: 'Onion',
    targetPrice: 25,
    alertCondition: 'below',
    addedAt: new Date().toISOString(),
  },
];

export async function syncUserProfile(profile: UserProfile): Promise<void> {
  if (!predictionApi.hasToken()) return;
  try {
    await predictionApi.updateProfile(profile);
  } catch (err) {
    console.warn('Profile sync notice:', err);
  }
}

export async function saveCultivationScenario(
  scenario: Omit<SavedScenario, 'id' | 'createdAt'>
): Promise<SavedScenario> {
  if (predictionApi.hasToken()) {
    const res = await predictionApi.addScenario(scenario);
    return res.item;
  }

  const fallback: SavedScenario = {
    ...scenario,
    id: `scenario_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  guestScenarios = [fallback, ...guestScenarios];
  return fallback;
}

export async function deleteCultivationScenario(scenarioId: string): Promise<void> {
  if (predictionApi.hasToken()) {
    await predictionApi.deleteScenario(scenarioId);
    return;
  }
  guestScenarios = guestScenarios.filter((s) => s.id !== scenarioId);
}

export function subscribeToScenarios(
  userId: string | null,
  callback: (scenarios: SavedScenario[]) => void
): () => void {
  let cancelled = false;

  const refresh = async () => {
    if (cancelled) return;
    if (userId && predictionApi.hasToken()) {
      try {
        const res = await predictionApi.getScenarios();
        if (!cancelled) callback(res.items || []);
        return;
      } catch {
        // fallback cleanly
      }
    }
    if (!cancelled) callback([...guestScenarios]);
  };

  refresh();
  const interval = setInterval(refresh, 4000);
  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

export async function addToWatchlist(
  item: Omit<WatchlistItem, 'id' | 'addedAt' | 'userId'> & { userId?: string; commodity?: string }
): Promise<WatchlistItem> {
  if (predictionApi.hasToken()) {
    const res = await predictionApi.addWatchlist({
      state: item.state,
      market: item.market,
      commodity: item.commodity || 'Tomato',
      targetPrice: item.targetPrice,
      alertCondition: item.alertCondition,
    });
    return res.item;
  }

  const id = `wl_${item.state}_${item.market}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fullItem: WatchlistItem = {
    ...item,
    userId: item.userId || 'guest',
    id,
    addedAt: new Date().toISOString(),
  };
  guestWatchlist = [fullItem, ...guestWatchlist.filter((w) => w.id !== id)];
  return fullItem;
}

export async function removeFromWatchlist(watchlistId: string): Promise<void> {
  if (predictionApi.hasToken()) {
    await predictionApi.deleteWatchlist(watchlistId);
    return;
  }
  guestWatchlist = guestWatchlist.filter((w) => w.id !== watchlistId);
}

export function subscribeToWatchlist(
  userId: string | null,
  callback: (items: WatchlistItem[]) => void
): () => void {
  let cancelled = false;

  const refresh = async () => {
    if (cancelled) return;
    if (userId && predictionApi.hasToken()) {
      try {
        const res = await predictionApi.getWatchlists();
        if (!cancelled) callback(res.items || []);
        return;
      } catch {
        // fallback cleanly
      }
    }
    if (!cancelled) callback([...guestWatchlist]);
  };

  refresh();
  const interval = setInterval(refresh, 4000);
  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}
