export function formatKickoff(iso) {
  if (!iso) return "TBD";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function pct(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

export function pctInt(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${Number(n).toFixed(0)}%`;
}

export function scoreline(match) {
  const h = match?.goals?.home;
  const a = match?.goals?.away;
  if (h == null && a == null) return "vs";
  return `${h ?? 0} – ${a ?? 0}`;
}
