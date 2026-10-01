import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Modal from "./Modal.jsx";
import { getLiveDetail } from "./api.js";
import { scoreline } from "./format.js";

export default function LiveModal({ match, onClose }) {
  const [data, setData] = useState(null);
  const [liveMatch, setLiveMatch] = useState(match);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getLiveDetail(match.id)
        .then((res) => {
          if (cancelled) return;
          setData(res);
          setLiveMatch(res.match);
        })
        .catch((err) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

    load();
    const timer = setInterval(load, 15000);
    const socket = io("/", { transports: ["websocket"] });
    socket.emit("watch:fixture", match.id);
    socket.on("fixture:update", (updated) => {
      if (updated.id === match.id) setLiveMatch(updated);
    });

    return () => {
      cancelled = true;
      clearInterval(timer);
      socket.emit("unwatch:fixture", match.id);
      socket.disconnect();
    };
  }, [match.id]);

  const homeStats = pickStats(data?.statistics, liveMatch.teams.home.id);
  const awayStats = pickStats(data?.statistics, liveMatch.teams.away.id);

  return (
    <Modal
      title={`${liveMatch.teams.home.name} ${scoreline(liveMatch)} ${liveMatch.teams.away.name}`}
      subtitle={`${liveMatch.league.name} · ${liveMatch.status.long} ${
        liveMatch.status.elapsed ? `${liveMatch.status.elapsed}'` : ""
      }`}
      onClose={onClose}
    >
      <div className="modal-body">
        {loading && <p className="muted">Loading live match data…</p>}
        {error && <p className="error">{error}</p>}

        <section className="panel">
          <h3>Events</h3>
          {!data?.events?.length && <p className="muted">No events yet.</p>}
          <ul className="event-list">
            {data?.events?.map((ev, i) => (
              <li key={`${ev.time?.elapsed}-${i}`}>
                <span className="minute">{ev.time?.elapsed}'</span>
                <div>
                  <strong>{ev.type}</strong> {ev.detail}
                  <small>
                    {ev.team?.name}
                    {ev.player?.name ? ` · ${ev.player.name}` : ""}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h3>Match statistics</h3>
          {!homeStats.length && <p className="muted">Stats appear after the match has enough data.</p>}
          {mergeStatTypes(homeStats, awayStats).map((row) => (
            <div className="stat-row" key={row.type}>
              <span>{row.home}</span>
              <small>{row.type}</small>
              <span>{row.away}</span>
            </div>
          ))}
        </section>

        <section className="panel">
          <h3>Lineups</h3>
          <div className="lineups">
            {(data?.lineups || []).map((lu) => (
              <div key={lu.team?.id}>
                <strong>
                  {lu.team?.name} · {lu.formation}
                </strong>
                <ul>
                  {(lu.startXI || []).map((p) => (
                    <li key={p.player?.id}>
                      {p.player?.number} {p.player?.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}

function pickStats(statistics, teamId) {
  const block = (statistics || []).find((s) => s.team?.id === teamId);
  return block?.statistics || [];
}

function mergeStatTypes(home, away) {
  const types = [...new Set([...home, ...away].map((s) => s.type))];
  return types.map((type) => ({
    type,
    home: home.find((s) => s.type === type)?.value ?? "0",
    away: away.find((s) => s.type === type)?.value ?? "0",
  }));
}
