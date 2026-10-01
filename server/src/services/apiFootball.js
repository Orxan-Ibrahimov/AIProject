import { config } from "../config.js";
import { cacheGet, cacheSet } from "../db.js";

const inflight = new Map();

export function hasApiKey() {
  return Boolean(config.apiKey && config.apiKey.trim());
}

async function request(pathname, params = {}) {
  if (!hasApiKey()) {
    const err = new Error("API_FOOTBALL_KEY is missing");
    err.status = 503;
    throw err;
  }

  const url = new URL(pathname, config.apiBase);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url, {
    headers: {
      "x-apisports-key": config.apiKey,
    },
  });

  if (!res.ok) {
    const err = new Error(`API-Football ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length) {
    const err = new Error(JSON.stringify(json.errors));
    err.status = 502;
    throw err;
  }
  return json.response || [];
}

export async function cachedRequest(cacheKey, ttlMs, pathname, params) {
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  if (inflight.has(cacheKey)) return inflight.get(cacheKey);

  const pending = request(pathname, params)
    .then(async (data) => {
      await cacheSet(cacheKey, data, ttlMs);
      return data;
    })
    .finally(() => inflight.delete(cacheKey));

  inflight.set(cacheKey, pending);
  return pending;
}

export function mapFixture(item) {
  const { fixture, league, teams, goals, score } = item;
  return {
    id: fixture.id,
    referee: fixture.referee,
    timezone: fixture.timezone,
    date: fixture.date,
    timestamp: fixture.timestamp,
    venue: fixture.venue,
    status: {
      long: fixture.status?.long,
      short: fixture.status?.short,
      elapsed: fixture.status?.elapsed,
      extra: fixture.status?.extra,
    },
    league: {
      id: league.id,
      name: league.name,
      country: league.country,
      logo: league.logo,
      flag: league.flag,
      season: league.season,
      round: league.round,
    },
    teams: {
      home: teams.home,
      away: teams.away,
    },
    goals,
    score,
  };
}

export async function getUpcoming() {
  const data = await cachedRequest(
    "fixtures:upcoming",
    45_000,
    "/fixtures",
    { next: 40, timezone: config.timezone }
  );
  return data
    .map(mapFixture)
    .filter((m) => !["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"].includes(m.status.short));
}

export async function getLive() {
  const data = await cachedRequest(
    "fixtures:live",
    12_000,
    "/fixtures",
    { live: "all", timezone: config.timezone }
  );
  return data.map(mapFixture);
}

export async function getFixtureById(id) {
  const data = await cachedRequest(
    `fixture:${id}`,
    12_000,
    "/fixtures",
    { id, timezone: config.timezone }
  );
  return data[0] || null;
}

export async function getOdds(id) {
  return cachedRequest(`odds:${id}`, 90_000, "/odds", { fixture: id });
}

export async function getLiveOdds(id) {
  return cachedRequest(`odds-live:${id}`, 12_000, "/odds/live", { fixture: id });
}

export async function getPredictions(id) {
  return cachedRequest(`pred:${id}`, 120_000, "/predictions", { fixture: id });
}

export async function getHeadToHead(homeId, awayId) {
  return cachedRequest(
    `h2h:${homeId}-${awayId}`,
    180_000,
    "/fixtures/headtohead",
    { h2h: `${homeId}-${awayId}`, last: 10, timezone: config.timezone }
  );
}

export async function getTeamLast(teamId) {
  return cachedRequest(
    `team-last:${teamId}`,
    120_000,
    "/fixtures",
    { team: teamId, last: 5, timezone: config.timezone }
  );
}
