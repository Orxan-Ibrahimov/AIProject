import { getLive, getUpcoming, hasApiKey } from "./services/apiFootball.js";

export function startPoller(io) {
  if (!hasApiKey()) {
    console.warn("Poller idle: API_FOOTBALL_KEY not set");
    return;
  }

  let liveBusy = false;
  let upcomingBusy = false;

  async function tickLive() {
    if (liveBusy) return;
    liveBusy = true;
    try {
      const matches = await getLive();
      io.emit("live:update", { matches, at: Date.now() });
      for (const match of matches) {
        io.to(`fixture:${match.id}`).emit("fixture:update", match);
      }
    } catch (err) {
      console.error("Live poll failed:", err.message);
    } finally {
      liveBusy = false;
    }
  }

  async function tickUpcoming() {
    if (upcomingBusy) return;
    upcomingBusy = true;
    try {
      const matches = await getUpcoming();
      io.emit("upcoming:update", { matches, at: Date.now() });
    } catch (err) {
      console.error("Upcoming poll failed:", err.message);
    } finally {
      upcomingBusy = false;
    }
  }

  tickLive();
  tickUpcoming();
  setInterval(tickLive, 15_000);
  setInterval(tickUpcoming, 45_000);
}
