function toOdd(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 1 ? n : null;
}

function implied(odd) {
  return 1 / odd;
}

function average(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stddev(nums) {
  if (nums.length < 2) return 0;
  const mean = average(nums);
  const variance = average(nums.map((n) => (n - mean) ** 2));
  return Math.sqrt(variance);
}

function collectBookmakerBets(payload) {
  const rows = [];
  for (const item of payload || []) {
    const bookmakers = item.bookmakers || item.odds || [];
    for (const book of bookmakers) {
      const bets = book.bets || [];
      for (const bet of bets) {
        for (const val of bet.values || []) {
          const odd = toOdd(val.odd);
          if (!odd) continue;
          rows.push({
            bookmaker: book.name || "Bookmaker",
            market: bet.name || "Market",
            outcome: [val.value, val.handicap].filter(Boolean).join(" ").trim(),
            odd,
          });
        }
      }
    }
  }
  return rows;
}

function groupOutcomes(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.market}||${row.outcome}`;
    if (!map.has(key)) {
      map.set(key, {
        market: row.market,
        outcome: row.outcome,
        odds: [],
        books: new Set(),
      });
    }
    const entry = map.get(key);
    entry.odds.push(row.odd);
    entry.books.add(row.bookmaker);
  }
  return [...map.values()];
}

function normalizeByMarket(outcomes) {
  const byMarket = new Map();
  for (const o of outcomes) {
    if (!byMarket.has(o.market)) byMarket.set(o.market, []);
    byMarket.get(o.market).push(o);
  }

  const normalized = [];
  for (const [market, list] of byMarket) {
    const withRaw = list.map((item) => ({
      ...item,
      avgOdd: average(item.odds),
      raw: implied(average(item.odds)),
      books: item.books.size,
      disagreement: stddev(item.odds.map(implied)),
    }));
    const total = withRaw.reduce((s, i) => s + i.raw, 0) || 1;
    for (const item of withRaw) {
      normalized.push({
        market,
        outcome: item.outcome,
        probability: item.raw / total,
        impliedRaw: item.raw,
        avgOdd: Number(item.avgOdd.toFixed(3)),
        books: item.books,
        confidence: Math.max(0, 1 - item.disagreement * 4),
      });
    }
  }
  return normalized.sort((a, b) => b.probability - a.probability);
}

export function buildProbabilities(oddsPayload) {
  const rows = collectBookmakerBets(oddsPayload);
  const grouped = groupOutcomes(rows);
  const all = normalizeByMarket(grouped);

  const markets = [];
  const seen = new Set();
  for (const item of all) {
    if (seen.has(item.market)) continue;
    seen.add(item.market);
    markets.push({
      name: item.market,
      outcomes: all.filter((o) => o.market === item.market),
    });
  }

  const safer = [...all]
    .map((o) => ({
      ...o,
      safetyScore: o.probability * 0.75 + o.confidence * 0.25,
    }))
    .filter((o) => o.probability >= 0.42)
    .sort((a, b) => b.safetyScore - a.safetyScore)
    .slice(0, 10);

  return { markets, all, safer, sampleSize: rows.length };
}

export function mapPrediction(payload) {
  const pred = payload?.[0];
  if (!pred) return null;
  const percent = pred.predictions?.percent || {};
  return {
    winner: pred.predictions?.winner || null,
    winOrDraw: pred.predictions?.win_or_draw,
    underOver: pred.predictions?.under_over,
    goalsHome: pred.predictions?.goals?.home,
    goalsAway: pred.predictions?.goals?.away,
    advice: pred.predictions?.advice,
    percent: {
      home: Number(String(percent.home || "0").replace("%", "")),
      draw: Number(String(percent.draw || "0").replace("%", "")),
      away: Number(String(percent.away || "0").replace("%", "")),
    },
    comparison: pred.comparison || null,
    teams: pred.teams || null,
    h2h: pred.h2h || [],
  };
}

export function mapRecent(fixtures) {
  return (fixtures || []).map((item) => ({
    id: item.fixture?.id,
    date: item.fixture?.date,
    status: item.fixture?.status?.short,
    league: item.league?.name,
    home: item.teams?.home,
    away: item.teams?.away,
    goals: item.goals,
    winnerHome: item.teams?.home?.winner,
    winnerAway: item.teams?.away?.winner,
  }));
}
