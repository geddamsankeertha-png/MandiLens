# Mandi Price Predictor & Agricultural Analytics Platform

A production-grade agricultural market intelligence platform based on the comprehensive research paper *"Mandi Price Prediction"* by Sudhansu Taparia. The application empowers farmers, traders, APMC commission agents, and agricultural policy makers with multi-variable predictive modeling, time series forecasting, clustering insights, and real-time market synchronization.

***

### User Review & Critical Decisions

> [!IMPORTANT]
> The application directly implements the full methodology and statistical findings presented in the research document:
> 1. **Dual-View Experience**: An authentic interactive Mobile App Simulator recreating the exact wireframes from Page 30 of the paper (State/Market dropdowns, Go action, crop group price table with MoM % indicators, SMS/email/social sharing), alongside a comprehensive Desktop Analytical Workstation for deep-dive modeling and data analysis.
> 2. **Prioritized User Authentication & Real-Time Synchronization**: Firebase Auth with role-based profiles (Farmer, Trader/Commission Agent, Policy Analyst) and real-time Firestore synchronization for personalized watchlists, custom cultivation cost scenario models, and price alerts.
> 3. **Exact Mathematical Modeling Engines**: Implements the paper's Multiple Linear Regression Model 1 ($\beta_0 = 1.026148$, $R^2 = 0.5706$, RMSE $= 0.206989$, with log10 transformations), K-Means Clustering ($K=3$, 77% accuracy), and Time Series Forecasting Suite (Mean, Naïve, Drift, Holt-Winters Exponential Smoothing, and ARIMA(4,0,2)).

- **Confirmed Mode**: Responsive dual-mode layout (interactive Page 30 Mobile Wireframe simulator + Full Analytical Dashboard).
- **Confirmed Personas**: Multi-role support for **Farmers** (quick prices, SMS/share, input cost calculator), **Traders** (market trends, arrival volume impacts, price alerts), and **Policy Analysts** (full EDA, regression diagnostic plots, time series benchmarks).
- **Real-Time Data**: Firestore real-time synchronization for saved prediction scenarios, custom mandi watchlists, and live simulated APMC arrival updates.

***

## 1. Overview & Core Concept

### What It Does
In developing countries like India, agricultural commodities suffer from high price volatility and lack of standardized transparent rate mechanisms, often placing smallholder farmers at a disadvantage against middlemen and traders. 

This platform bridges the information asymmetry by combining three core datasets analyzed in the research paper:
1. **Mandi Prices Dataset** (arrivals, minimum, maximum, modal prices across 820+ markets and 4 major agricultural states: Maharashtra, Gujarat, Karnataka, Punjab).
2. **Monthly Rainfall Dataset** (district-level historical precipitation and seasonal monsoon patterns).
3. **Cost of Cultivation Dataset** (78 granular input attributes including farm labor hours/cost, animal labor, machinery hours/cost, seeds, fertilizers N-P-K, manure, insecticides, and total capital investment).

### Target Personas
- **The Smallholder Farmer**: Needs immediate, accessible price intelligence for their specific local mandi (e.g. Satara, Shimoga, Aurangabad) before harvesting or transporting crops, with clear Month-over-Month (MoM) trend arrows and simple sharing via SMS or WhatsApp.
- **The APMC Trader / Commission Agent**: Needs multi-commodity spread analysis, arrival volume vs price elasticity projections, and real-time price threshold notifications.
- **The Agricultural Policy Maker & Researcher**: Needs transparent empirical models, exploratory scatter/box plots, regression diagnostic curves (Residuals vs Fitted, Cook's Distance, Q-Q Normal plot), and time-series benchmark comparisons (Mean, Naïve, Holt-Winters, ARIMA).

***

## 2. User Experience & Visual Design

### Key User Flows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             TOP NAVIGATION BAR                              │
│  [ Mandi Price Predictor ]     Overview · Simulator · Models · Analysis    │
│                                           [ Role: Farmer / Trader ] [Login] │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
┌───────────────────────────────────┐         ┌───────────────────────────────────┐
│     PAGE 30 MOBILE SIMULATOR      │         │   ANALYTICAL WORKBENCH & EDA      │
│  • Authentic iPhone Wireframe     │         │  • Multi-Variable MLR Calculator  │
│  • Auspicious Golden Emblem & Sun │         │  • Dynamic Scatter & Box-Whiskers │
│  • State & Mandi Selectors        │         │  • Correlation & Covariance Matrix│
│  • "Go" Prediction Trigger        │         │  • K-Means Cluster Inspector      │
│  • Group Price Table + MoM %      │         │  • Time Series Forecasting Suite  │
│  • SMS, Social & Email Actions    │         │  • Diagnostic Plots (Cook's, Q-Q) │
└───────────────────────────────────┘         └───────────────────────────────────┘
```

1. **Quick Price Inquiry (Mobile Simulator / Wireframe View)**:
   - Select State (e.g., Maharashtra, Gujarat, Karnataka, Punjab).
   - Select Market (e.g., Satara, Shimoga, Aurangabad, Bangalore, Tumkur, Davangere).
   - Click **"Go"**: Instant table appears with 13 crop groups (Cereals, Vegetables, Oil Seeds, Pulses, Fruits, Spices, Fibre Crops, etc.), displaying estimated price in both ₹/Quintal and ₹/Tonne, accompanied by color-coded MoM% trend arrows.
   - Tap **SMS**, **Share**, or **Email** to generate formatted market advisories.

2. **Interactive Multiple Linear Regression (MLR) Scenario Simulator**:
   - Tune cultivation input variables (Farm Labor Hours/Cost, Machinery, Fertilizer N/P/K, Manure, Rainfall, Arrival Quantity).
   - See predicted price output updated in real-time with lower bound, fit, and upper bound confidence intervals using the exact paper regression formula:
     $$\log_{10}(\text{Price} + 1) = \beta_0 + \sum \beta_i \log_{10}(X_i + 1)$$
   - Toggle log-transformed view vs. normalized ₹/Quintal values.

3. **Exploratory Data Analysis (EDA) & Diagnostics**:
   - Interactive monthly box-and-whiskers charts (Rainfall, Fertilizer Cost, Farm Labor, Crop Area, Main Product).
   - Dynamic scatter plots with crop-group color coding.
   - Interactive Correlation & Covariance Heatmap with cell inspection.
   - Regression diagnostics viewer: Residuals vs. Fitted value plot, Cook's Distance influential observations (highlighting outlier points #53858, #44595, #60011 identified in R Studio), and Normal Q-Q plot.

4. **Time Series Forecasting Lab**:
   - Compare all 4 forecasting methods evaluated in the paper:
     - Model 1: **Mean Method** (historical average horizontal forecast).
     - Model 2: **Naïve & Drift Method** (last-observation baseline with positive price drift).
     - Model 3: **Holt-Winters Exponential Smoothing** (level $\alpha=0.2$ vs level+trend $\alpha=0.2, \beta=0.1$ capturing upward trajectory).
     - Model 4: **AUTO.ARIMA $(4,0,2)$** with ACF, PACF plots and Ljung-Box test results ($p\text{-value} = 6.024\times 10^{-9}$).

5. **User Profile & Real-Time Sync**:
   - Google Sign-In / Demo Persona Quick Switcher.
   - Saved custom cost scenarios and watchlist of preferred mandis.
   - Real-time cloud sync across devices using Firebase Firestore.

### Visual Identity & Theme
- **Aesthetic Direction**: Dignified agricultural editorial style with modern clean ergonomics. Warm earth tones inspired by Indian harvests (wheat gold, rich terracotta, deep forest moss, crisp natural linen neutral background).
- **Color Palette**:
  - Background Canvas: Crisp warm linen (`#FBFBFA` / dark `#0F1715`).
  - Structural Surfaces: Ivory card backgrounds with subtle borders (`#EBE9E1` / dark `#1A2522`).
  - Primary Accent: Rich Agricultural Ochre Gold (`#D97706` / `#B45309`) and Emerald Leaf (`#15803D`).
  - Semantic Trends: Crisp Forest Green (`#16A34A` for upward MoM gain) and Terracotta Rust (`#DC2626` for downward trend).
- **Typography**:
  - Display / Headings: `Plus Jakarta Sans` / `Outfit` for confident editorial clarity.
  - Body Prose: `Public Sans` / `DM Sans` for clean legibility.
  - Financials & Statistical Metrics: Strict tabular numerals (`font-mono tabular-nums`).

***

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| **Mobile Wireframe Fidelity** | Embedded high-fidelity smartphone frame + full-bleed tablet/desktop mode | Faithfully honors the wireframe in Page 30 of the research paper while offering modern responsive accessibility on any screen size. | Discarding the wireframe in favor of standard desktop table only. |
| **Statistical Model Engine** | Client/Server mathematical engine pre-loaded with exact R Studio coefficients and formulas | Zero latency, instant recalculation, deterministic outputs matching the paper's exact summary tables and RMSE benchmarks ($0.206989$). | Generic dummy random number generator (unacceptable for research-backed app). |
| **Persistence & Real-Time Sync** | Firebase Firestore + Firebase Auth | Satisfies user priority for authentication and real-time multi-device synchronization of watchlists and scenarios. | LocalStorage only (lacks multi-device sync and real auth). |
| **Diagnostic & EDA Visualizations** | Custom interactive SVG charts and data matrices | Lightweight, responsive, theme-consistent, and directly reproduces the R plots (ACF, PACF, Cook's distance, Q-Q plot). | Heavy canvas-only library that fails mobile pinch and responsiveness. |

***

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               USER INTERFACE                                │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│  Page 30 Simulator   │   MLR Calculator     │    EDA & Time Series Hub      │
│  (State/Mandi Drop)  │ (What-If Cultivation)│ (Box Plots, ARIMA, Cook's, QQ)│
└──────────┬───────────┴──────────┬───────────┴───────────────┬───────────────┘
           │                      │                           │
           ▼                      ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ANALYTICAL ENGINE & STATISTICAL STORE                    │
│  • MLR Model 1 Formula: log10(Price+1) = β0 + Σ βi * log10(Xi+1)            │
│  • K-Means Cluster Engine (K=3, 13 Groups, 77% accuracy)                    │
│  • Time Series Generators: Mean, Naïve, Drift, Holt-Winters, ARIMA(4,0,2)   │
│  • Historical Datasets: 4 States, 12 Mandis, 13 Groups, 2004-2010 benchmarks│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FIREBASE REAL-TIME INTEGRATION                          │
│  • Firebase Auth (Google Sign-In + Session Management)                      │
│  • Firestore DB:                                                            │
│    - /users/{userId} (profile, role: farmer/trader/analyst)                 │
│    - /users/{userId}/savedScenarios/{scenarioId} (custom cultivation costs) │
│    - /users/{userId}/watchlists/{mandiId} (starred markets & alert bounds)  │
│    - /marketUpdates/{updateId} (real-time APMC price broadcast feed)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Models & Schemas (`firebase-blueprint.json`)

1. **`User`**:
   - `id`: string (UID)
   - `email`: string
   - `displayName`: string
   - `role`: enum (`"farmer" | "trader" | "analyst"`)
   - `preferredState`: string
   - `preferredMarket`: string
   - `createdAt`: string
2. **`SavedScenario`**:
   - `id`: string
   - `userId`: string
   - `cropGroup`: string
   - `cropName`: string
   - `state`: string
   - `market`: string
   - `inputs`: object (rainfall, laborHours, laborCost, fertilizerKg, etc.)
   - `predictedPriceQuintal`: number
   - `predictedPriceTonne`: number
   - `createdAt`: string
3. **`WatchlistMandi`**:
   - `id`: string
   - `userId`: string
   - `state`: string
   - `market`: string
   - `targetPrice`: number
   - `alertCondition`: enum (`"above" | "below"`)
   - `addedAt`: string
4. **`LiveMarketUpdate`**:
   - `id`: string
   - `state`: string
   - `market`: string
   - `group`: string
   - `currentPrice`: number
   - `momChangePercent`: number
   - `direction`: enum (`"up" | "down" | "flat"`)
   - `updatedAt`: string

***

## 5. Verification Plan

1. **Mobile Wireframe Parity Test**:
   - Verify State/Market dropdowns load Satara, Shimoga, Aurangabad, Bangalore, Tumkur, Davangere, etc.
   - Verify "Go" triggers the exact table with Group, Price, and MoM% with up/down arrows.
   - Verify SMS, Share, and Email action triggers.
2. **Mathematical Accuracy Test**:
   - Input baseline mean values from Page 9–10 into MLR Model 1; verify predicted baseline price aligns with research paper mean (~181.51 ₹/Tonne log scale and transformed prices).
   - Verify Holt-Winters level vs trend forecast curves match Page 26–27.
   - Verify ARIMA(4,0,2) parameter coefficients and Ljung-Box test statistic match Page 28–29.
3. **Authentication & Persistence Test**:
   - Verify Google Sign-in flow and persona switching.
   - Save a custom scenario; verify real-time sync in Firestore.
   - Add a market to watchlist; verify immediate update and alert badge.
4. **Build & Lint Verification**:
   - Run `compile_applet` and `lint_applet` to ensure zero compilation or type errors.
