<<<<<<< HEAD
# KisanMandi Platform

React and Express demo for agricultural market dashboards, price forecasts, and administration screens.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and configure the required values.
3. Start the app with `npm run dev`.

## Current limitations

- Google sign-in uses Firebase Authentication. New users receive the farmer role; trader, analyst, and admin roles must be provisioned by a trusted server process.
- Email/password registration and verification are not configured. The registration screen is a preview.
- Administrative API routes require a signed admin token, but this repository does not yet connect Firebase identity tokens to the server token verifier. Admin operations remain unavailable until that trusted integration exists.
- Price feed fallbacks and model predictions are demo data. They are explicitly marked as unverified or simulated and must not be treated as current market quotes or validated forecasts.
- Pipeline status, retraining, and backfill screens include demo state; durable ingestion, model training, and historical backfill are not connected.
=======
# MandiLens
AI-Powered Mandi Price Intelligence for India See Tomorrow’s Mandi Price Today.
>>>>>>> 651c395d8d10ad7c8a35d80bb9a6edfee23dd1a6
