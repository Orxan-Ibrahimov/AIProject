import {
  getUpcoming,
  getLive,
  getFixtureById,
  getOdds,
  getLiveOdds,
  getPredictions,
  getHeadToHead,
  getTeamLast,
  mapFixture,
  hasApiKey,
} from "./services/apiFootball.js";
import { buildProbabilities, mapPrediction, mapRecent } from "./services/probabilities.js";

function apiGuard(req, res, next) {
  if (!hasApiKey()) {
    return res.status(503).json({
      error: "Missing API_FOOTBALL_KEY",
      hint: "Add your API-Football key to .env. Get one at https://dashboard.api-football.com",
    });
  }
  next();
}

export function registerRoutes(app) {
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, apiConfigured: hasApiKey() });
  });

  app.get("/api/matches/upcoming", apiGuard, async (_req, res, next) => {
    try {
      res.json({ matches: await getUpcoming() });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/matches/live", apiGuard, async (_req, res, next) => {
    try {
      res.json({ matches: await getLive() });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/matches/:id/analysis", apiGuard, async (req, res, next) => {
    try {
      const id = req.params.id;
      const raw = await getFixtureById(id);
      if (!raw) return res.status(404).json({ error: "Match not found" });

      const match = mapFixture(raw);
      const homeId = match.teams.home.id;
      const awayId = match.teams.away.id;

      const [odds, predictions, h2h, homeLast, awayLast] = await Promise.all([
        getOdds(id).catch(() => []),
        getPredictions(id).catch(() => []),
        getHeadToHead(homeId, awayId).catch(() => []),
        getTeamLast(homeId).catch(() => []),
        getTeamLast(awayId).catch(() => []),
      ]);

      const { markets, safer, sampleSize } = buildProbabilities(odds);
      res.json({
        match,
        prediction: mapPrediction(predictions),
        markets,
        safer,
        sampleSize,
        lastResults: {
          headToHead: mapRecent(h2h),
          home: mapRecent(homeLast),
          away: mapRecent(awayLast),
        },
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/matches/:id/live", apiGuard, async (req, res, next) => {
    try {
      const id = req.params.id;
      const raw = await getFixtureById(id);
      if (!raw) return res.status(404).json({ error: "Match not found" });

      const liveOdds = await getLiveOdds(id).catch(() => []);
      const { markets, safer, sampleSize } = buildProbabilities(liveOdds.length ? liveOdds : []);

      res.json({
        match: mapFixture(raw),
        events: raw.events || [],
        lineups: raw.lineups || [],
        statistics: raw.statistics || [],
        players: raw.players || [],
        liveMarkets: markets,
        liveSafer: safer,
        sampleSize,
      });
    } catch (err) {
      next(err);
    }
  });
}
