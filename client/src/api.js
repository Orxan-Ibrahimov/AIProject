const API = "/api";

export async function getHealth() {
  const res = await fetch(`${API}/health`);
  return res.json();
}

export async function getUpcoming() {
  const res = await fetch(`${API}/matches/upcoming`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load upcoming matches");
  return data.matches;
}

export async function getLive() {
  const res = await fetch(`${API}/matches/live`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load live matches");
  return data.matches;
}

export async function getAnalysis(id) {
  const res = await fetch(`${API}/matches/${id}/analysis`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load analysis");
  return data;
}

export async function getLiveDetail(id) {
  const res = await fetch(`${API}/matches/${id}/live`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load live match");
  return data;
}
