# MatchPulse

MERN football app: upcoming fixtures with full market probabilities, safer high-likelihood picks, recent results, and live match details. Scores and odds come from **API-Football** (not simulated). The server polls live matches every 15 seconds and pushes updates over Socket.io.

## What you get

- **Upcoming** — next fixtures that have not started. Click a match for a modal with:
  1. **All possibilities** — every published bookmaker market, converted from decimal odds to implied probabilities and de-vigged (bookmaker margin removed) per market.
  2. **Safer picks** — top outcomes with probability ≥ 42% after de-vigging, ranked by probability and bookmaker agreement.
  3. **Last results** — head-to-head plus each team’s last five matches.
- **Live** — in-play scores. Click a match for events, statistics, and lineups, refreshed in near real time.

## Setup

1. Get a key at [API-Football dashboard](https://dashboard.api-football.com) (API-Sports account).
2. Copy env and fill the key:

```bash
cp .env.example .env
```

3. Start MongoDB (optional but recommended for the MERN cache). Without it the API still runs with an in-memory cache:

```bash
docker compose up -d
```

4. Install and run:

```bash
npm install
npm run install:all
npm run dev
```

- Client: http://localhost:5173  
- API: http://localhost:5050

## How probabilities are computed

Bookmaker odds are not fair probabilities. For each market the app:

1. Collects every bookmaker’s decimal odds for each outcome.
2. Averages those odds, converts to implied probability `1 / odds`.
3. Normalizes outcomes in that market so they sum to 100% (removes overround).

Safer picks keep only the highest-probability normalized outcomes so long shots are excluded.

## Rate limits

Free API-Football plans are limited. The server caches upcoming lists (~45s), live lists (~12s), and per-match odds/predictions so many clients share one upstream call.
