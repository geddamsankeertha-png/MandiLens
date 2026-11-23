"""
Generates an educational sample agricultural commodity price dataset
modeled on AGMARKNET / data.gov.in daily mandi reporting schema.

NOTE: This is structured DEMONSTRATION data for offline college project
development and testing. It is explicitly tagged as sample data and must
not be presented as live government market feeds.
"""

import csv
import math
import os
import random
from datetime import date, timedelta

COMMODITY_PROFILES = [
    # (commodity, variety, grade, base_kg_price, amplitude, volatility, base_arrival_t, shelf_days)
    ("Tomato", "Hybrid", "FAQ", 36.0, 9.5, 2.1, 1250, 4),
    ("Onion", "Red Nasik", "FAQ", 25.0, 5.5, 1.4, 1900, 30),
    ("Potato", "Jyoti", "FAQ", 21.5, 3.2, 0.9, 1400, 60),
    ("Rice", "Sona Masoori", "Super", 42.0, 2.0, 0.6, 3600, 365),
    ("Wheat", "Sharbati", "FAQ", 26.5, 1.6, 0.5, 3200, 365),
    ("Toor Dal", "Desi Bold", "FAQ", 142.0, 9.0, 2.4, 620, 180),
    ("Edible Oils", "Groundnut Oil", "Refined", 136.0, 5.0, 1.5, 450, 180),
    ("Sugar", "M-30 Grade", "Medium", 39.0, 1.2, 0.4, 980, 365),
    ("Milk", "Buffalo Standard", "Grade-A", 56.0, 1.5, 0.4, 1500, 2),
    ("Salt", "Iodized Crystal", "Standard", 16.0, 0.4, 0.15, 820, 720),
    ("Cotton", "Medium Staple", "FAQ", 71.0, 5.5, 1.8, 2100, 240),
    ("Chilli", "Guntur Teja", "Best", 182.0, 14.0, 3.5, 950, 180),
]

MARKET_PROFILES = [
    # (market, district, state, multiplier, rain_base, temp_base)
    ("Guntur", "Guntur", "Andhra Pradesh", 1.00, 72.0, 31.5),
    ("Vijayawada", "NTR", "Andhra Pradesh", 1.055, 78.0, 31.0),
    ("Kurnool", "Kurnool", "Andhra Pradesh", 0.94, 58.0, 33.0),
    ("Rajahmundry", "East Godavari", "Andhra Pradesh", 1.02, 92.0, 30.5),
    ("Visakhapatnam", "Visakhapatnam", "Andhra Pradesh", 1.09, 88.0, 29.8),
    ("Tirupati", "Tirupati", "Andhra Pradesh", 1.06, 75.0, 31.2),
    ("Bhimavaram", "West Godavari", "Andhra Pradesh", 0.98, 95.0, 30.2),
    ("Madanapalle", "Annamayya", "Andhra Pradesh", 0.92, 62.0, 28.5),
    ("Lasalgaon", "Nashik", "Maharashtra", 0.89, 65.0, 29.0),
    ("Agra", "Agra", "Uttar Pradesh", 0.86, 55.0, 27.5),
]

# Primary commodity x market pairs plus full state coverage anchors
FEATURED_PAIRS = [
    ("Tomato", "Guntur"),
    ("Tomato", "Vijayawada"),
    ("Tomato", "Madanapalle"),
    ("Onion", "Guntur"),
    ("Onion", "Kurnool"),
    ("Onion", "Lasalgaon"),
    ("Potato", "Vijayawada"),
    ("Potato", "Agra"),
    ("Rice", "Vijayawada"),
    ("Rice", "Rajahmundry"),
    ("Wheat", "Agra"),
    ("Wheat", "Guntur"),
    ("Toor Dal", "Guntur"),
    ("Toor Dal", "Kurnool"),
    ("Edible Oils", "Kurnool"),
    ("Sugar", "Vijayawada"),
    ("Milk", "Guntur"),
    ("Salt", "Visakhapatnam"),
    ("Cotton", "Guntur"),
    ("Cotton", "Kurnool"),
    ("Chilli", "Guntur"),
    ("Chilli", "Kurnool"),
]


def generate_dataset(output_path: str, num_days: int = 400, seed: int = 2026) -> int:
    rng = random.Random(seed)
    end_dt = date.today()
    start_dt = end_dt - timedelta(days=num_days - 1)

    comm_map = {c[0]: c for c in COMMODITY_PROFILES}
    mkt_map = {m[0]: m for m in MARKET_PROFILES}

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    fieldnames = [
        "arrival_date",
        "state",
        "district",
        "market",
        "commodity",
        "variety",
        "grade",
        "min_price",
        "max_price",
        "modal_price",
        "arrival_tonnes",
        "rainfall_mm",
        "temp_c",
        "data_source",
    ]

    rows_written = 0
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for comm_name, mkt_name in FEATURED_PAIRS:
            _, variety, grade, base_p, amp, vol, base_arr, _ = comm_map[comm_name]
            _, district, state, mult, rain_b, temp_b = mkt_map[mkt_name]

            # Autocorrelated realistic price walk + seasonality + weather/arrival elasticity
            prev_price = base_p * mult
            phase = rng.uniform(0, 2 * math.pi)

            for day_idx in range(num_days):
                cur_dt = start_dt + timedelta(days=day_idx)
                doy = cur_dt.timetuple().tm_yday

                seasonal = amp * math.sin((2 * math.pi * doy / 365.0) + phase)
                weekly_cycle = (vol * 0.35) * math.sin(2 * math.pi * day_idx / 7.0)
                rainfall = max(0.0, round(rain_b * (0.4 + 0.8 * max(0.0, math.sin(2 * math.pi * doy / 365.0))) + rng.gauss(0, 8), 1))
                temp_c = round(temp_b + 3.5 * math.cos(2 * math.pi * doy / 365.0) + rng.gauss(0, 1.2), 1)
                arrival = max(50.0, round(base_arr * (1.0 - 0.15 * math.sin(2 * math.pi * doy / 365.0 + phase)) + rng.gauss(0, base_arr * 0.09), 1))

                # Supply-demand feedback: higher arrivals gently dampen price; heavy rain tightens perishable price
                arrival_shock = -0.0025 * (arrival - base_arr) / max(1.0, base_arr / 100.0)
                rain_shock = (0.015 * (rainfall - rain_b) / 25.0) if comm_name in ("Tomato", "Onion", "Chilli") else 0.0
                target_mean = max(5.0, (base_p * mult) + seasonal + weekly_cycle)
                modal = 0.72 * prev_price + 0.28 * target_mean + arrival_shock * base_p * 0.2 + rain_shock * base_p + rng.gauss(0, vol * 0.45)
                modal = max(round(base_p * 0.45, 2), round(modal, 2))
                prev_price = modal

                # Inject ~0.8% controlled realistic anomalies/missing values for pipeline testing
                roll = rng.random()
                arrival_str = str(arrival)
                if roll < 0.004:
                    # Single-day entry spike outlier
                    modal = round(modal * 1.95, 2)
                elif roll < 0.009:
                    # Missing arrival quantity record
                    arrival_str = ""

                spread = max(1.0, round(modal * (0.08 + rng.uniform(0.01, 0.05)), 2))
                min_p = max(1.0, round(modal - spread, 2))
                max_p = round(modal + spread, 2)

                writer.writerow({
                    "arrival_date": cur_dt.isoformat(),
                    "state": state,
                    "district": district,
                    "market": mkt_name,
                    "commodity": comm_name,
                    "variety": variety,
                    "grade": grade,
                    "min_price": min_p,
                    "max_price": max_p,
                    "modal_price": modal,
                    "arrival_tonnes": arrival_str,
                    "rainfall_mm": rainfall,
                    "temp_c": temp_c,
                    "data_source": "sample",
                })
                rows_written += 1

    return rows_written


if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(root, "data", "sample_agmarknet_prices.csv")
    count = generate_dataset(out)
    print(f"Generated {count} educational sample rows at {out}")
