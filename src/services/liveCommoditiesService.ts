export interface LiveCommodityRecord {
  commodity: string;
  group: string;
  modalPriceQuintal: number;
  minPriceQuintal: number;
  maxPriceQuintal: number;
  arrivalQuantityTonne: number;
  momChangePercent: number;
  trend: 'up' | 'down' | 'flat';
  mandiStatus?: string;
}

export interface LiveCommoditiesResponse {
  success: boolean;
  is_live?: boolean;
  disclaimer?: string;
  source: string;
  timestamp: string;
  state: string;
  market: string;
  data: LiveCommodityRecord[];
}

export interface PanIndiaBenchmark {
  commodity: string;
  state: string;
  market: string;
  modalPriceQuintal: number;
  trend: 'up' | 'down' | 'flat';
  changePercent: number;
}

/**
 * Fetches real-time commodity data from the backend proxy route
 */
export async function fetchLiveCommodities(
  state: string,
  market: string,
  group: string = 'All'
): Promise<LiveCommoditiesResponse> {
  try {
    const res = await fetch('/api/commodities/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, market, group }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('Live API request error, returning local calibrated fallback:', err);
    return {
      success: false,
      is_live: false,
      disclaimer: 'Fixed sample values only; not current market quotes.',
      source: 'Sample data (fallback; not a live market feed)',
      timestamp: new Date().toISOString(),
      state,
      market,
      data: [
        { commodity: 'Wheat (Mill Quality)', group: 'Cereals', modalPriceQuintal: 2420, minPriceQuintal: 2280, maxPriceQuintal: 2550, arrivalQuantityTonne: 340, momChangePercent: 1.8, trend: 'up', mandiStatus: 'Peak Arrival' },
        { commodity: 'Rice (Paddy Common)', group: 'Cereals', modalPriceQuintal: 2250, minPriceQuintal: 2100, maxPriceQuintal: 2380, arrivalQuantityTonne: 420, momChangePercent: -0.6, trend: 'down', mandiStatus: 'Steady' },
        { commodity: 'Onion (Red)', group: 'Vegetables', modalPriceQuintal: 1950, minPriceQuintal: 1600, maxPriceQuintal: 2300, arrivalQuantityTonne: 580, momChangePercent: 4.2, trend: 'up', mandiStatus: 'Active Trading' },
        { commodity: 'Potato (Jyoti)', group: 'Vegetables', modalPriceQuintal: 1450, minPriceQuintal: 1250, maxPriceQuintal: 1650, arrivalQuantityTonne: 310, momChangePercent: -2.1, trend: 'down', mandiStatus: 'Steady' },
        { commodity: 'Tomato (Hybrid)', group: 'Vegetables', modalPriceQuintal: 1800, minPriceQuintal: 1400, maxPriceQuintal: 2200, arrivalQuantityTonne: 190, momChangePercent: 6.5, trend: 'up', mandiStatus: 'Active Trading' },
        { commodity: 'Soybean (Yellow)', group: 'Oil Seeds', modalPriceQuintal: 4650, minPriceQuintal: 4400, maxPriceQuintal: 4850, arrivalQuantityTonne: 280, momChangePercent: 2.3, trend: 'up', mandiStatus: 'Steady' },
        { commodity: 'Mustard (Seed)', group: 'Oil Seeds', modalPriceQuintal: 5400, minPriceQuintal: 5150, maxPriceQuintal: 5650, arrivalQuantityTonne: 210, momChangePercent: 3.1, trend: 'up', mandiStatus: 'Peak Arrival' },
        { commodity: 'Gram (Chana Desi)', group: 'Pulses', modalPriceQuintal: 6200, minPriceQuintal: 5900, maxPriceQuintal: 6450, arrivalQuantityTonne: 160, momChangePercent: 1.4, trend: 'up', mandiStatus: 'Steady' },
        { commodity: 'Tur (Arhar)', group: 'Pulses', modalPriceQuintal: 9800, minPriceQuintal: 9200, maxPriceQuintal: 10400, arrivalQuantityTonne: 120, momChangePercent: 5.2, trend: 'up', mandiStatus: 'Active Trading' },
        { commodity: 'Cotton (Medium Staple)', group: 'Fibre Crops', modalPriceQuintal: 7100, minPriceQuintal: 6800, maxPriceQuintal: 7400, arrivalQuantityTonne: 390, momChangePercent: -1.2, trend: 'down', mandiStatus: 'Steady' },
        { commodity: 'Turmeric (Finger)', group: 'Spices', modalPriceQuintal: 13500, minPriceQuintal: 12400, maxPriceQuintal: 14600, arrivalQuantityTonne: 95, momChangePercent: 8.4, trend: 'up', mandiStatus: 'Peak Arrival' },
        { commodity: 'Chilli (Dry Red)', group: 'Spices', modalPriceQuintal: 18200, minPriceQuintal: 16500, maxPriceQuintal: 19800, arrivalQuantityTonne: 140, momChangePercent: 4.8, trend: 'up', mandiStatus: 'Active Trading' },
      ],
    };
  }
}

/**
 * Fetches Pan-India benchmark prices
 */
export async function fetchPanIndiaBenchmarks(): Promise<PanIndiaBenchmark[]> {
  try {
    const res = await fetch('/api/commodities/pan-india', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.is_live === true ? json.data || [] : [];
  } catch (err) {
    console.warn('Pan-India benchmarks fetch error:', err);
    return [];
  }
}
