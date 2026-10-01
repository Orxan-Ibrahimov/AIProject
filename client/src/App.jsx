import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getHealth, getLive, getUpcoming } from "./api.js";
import MatchCard from "./MatchCard.jsx";
import UpcomingModal from "./UpcomingModal.jsx";
import LiveModal from "./LiveModal.jsx";

export default function App() {
  const [tab, setTab] = useState("upcoming");
  const [upcoming, setUpcoming] = useState([]);
  const [live, setLive] = useState([]);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");
  const [selectedUpcoming, setSelectedUpcoming] = useState(null);
  const [selectedLive, setSelectedLive] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [u, l] = await Promise.all([getUpcoming(), getLive()]);
        if (cancelled) return;
        setUpcoming(u);
        setLive(l);
        setError("");
        setUpdatedAt(Date.now());
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    load();
    const socket = io("/", { transports: ["websocket"] });
    socket.on("upcoming:update", (payload) => {
      setUpcoming(payload.matches);
      setUpdatedAt(payload.at);
    });
    socket.on("live:update", (payload) => {
      setLive(payload.matches);
      setUpdatedAt(payload.at);
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, []);

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Real-time football intelligence</p>
          <h1>MatchPulse</h1>
          <p className="lede">
            Upcoming markets, live scores, and de-vigged probabilities from live bookmaker odds.
          </p>
        </div>
        <div className="status">
          <span className={`dot ${health?.apiConfigured ? "on" : "off"}`} />
          {health?.apiConfigured ? "API connected" : "API key required"}
          {updatedAt && <small>Updated {new Date(updatedAt).toLocaleTimeString()}</small>}
        </div>
      </header>

      {!health?.apiConfigured && (
        <div className="banner">
          Add <code>API_FOOTBALL_KEY</code> to <code>.env</code> (from dashboard.api-football.com),
          then restart the server. Live scores and odds are not simulated.
        </div>
      )}

      <nav className="main-tabs">
        <button className={tab === "upcoming" ? "active" : ""} onClick={() => setTab("upcoming")}>
          Upcoming
        </button>
        <button className={tab === "live" ? "active" : ""} onClick={() => setTab("live")}>
          Live {live.length ? `(${live.length})` : ""}
        </button>
      </nav>

      {error && <p className="error">{error}</p>}

      {tab === "upcoming" && (
        <div className="grid">
          {!upcoming.length && !error && <p className="muted">No upcoming fixtures in the feed.</p>}
          {upcoming.map((m) => (
            <MatchCard key={m.id} match={m} onClick={setSelectedUpcoming} />
          ))}
        </div>
      )}

      {tab === "live" && (
        <div className="grid">
          {!live.length && !error && <p className="muted">No matches are live right now.</p>}
          {live.map((m) => (
            <MatchCard key={m.id} match={m} live onClick={setSelectedLive} />
          ))}
        </div>
      )}

      {selectedUpcoming && (
        <UpcomingModal match={selectedUpcoming} onClose={() => setSelectedUpcoming(null)} />
      )}
      {selectedLive && <LiveModal match={selectedLive} onClose={() => setSelectedLive(null)} />}
    </div>
  );
}
