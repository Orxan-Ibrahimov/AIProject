import { useEffect, useState } from "react";
import Modal, { Tabs } from "./Modal.jsx";
import { getAnalysis } from "./api.js";
import { formatKickoff, pct, pctInt } from "./format.js";

const TABS = [
  { id: "all", label: "All possibilities" },
  { id: "safer", label: "Safer picks" },
  { id: "last", label: "Last results" },
];

export default function UpcomingModal({ match, onClose }) {
  const [tab, setTab] = useState("all");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAnalysis(match.id)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [match.id]);

  return (
    <Modal
      title={`${match.teams.home.name} vs ${match.teams.away.name}`}
      subtitle={`${match.league.name} · ${formatKickoff(match.date)}`}
      onClose={onClose}
    >
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {loading && <p className="muted">Loading real market data…</p>}
      {error && <p className="error">{error}</p>}
      {data && tab === "all" && <AllTab data={data} />}
      {data && tab === "safer" && <SaferTab data={data} />}
      {data && tab === "last" && <LastTab data={data} />}
    </Modal>
  );
}

function AllTab({ data }) {
  const p = data.prediction;
  return (
    <div className="modal-body">
      {p && (
        <section className="panel">
          <h3>Model forecast</h3>
          <div className="bars">
            <Bar label={`${data.match.teams.home.name} win`} value={p.percent.home} />
            <Bar label="Draw" value={p.percent.draw} />
            <Bar label={`${data.match.teams.away.name} win`} value={p.percent.away} />
          </div>
          {p.advice && <p className="advice">{p.advice}</p>}
        </section>
      )}
      {!data.markets.length && (
        <p className="muted">
          No bookmaker markets are published for this fixture yet. Odds usually appear closer to
          kickoff.
        </p>
      )}
      {data.markets.map((market) => (
        <section className="panel" key={market.name}>
          <h3>{market.name}</h3>
          <ul className="outcome-list">
            {market.outcomes.map((o) => (
              <li key={o.outcome}>
                <span>{o.outcome}</span>
                <strong>{pct(o.probability)}</strong>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SaferTab({ data }) {
  if (!data.safer.length) {
    return (
      <p className="muted">
        Not enough high-confidence outcomes yet. Safer picks appear when several bookmakers agree
        on a result above 42% after removing the bookmaker margin.
      </p>
    );
  }
  return (
    <div className="modal-body">
      <p className="muted">
        Top less-risky outcomes from real odds (de-vigged, averaged across bookmakers).
      </p>
      <ol className="safer-list">
        {data.safer.map((o, i) => (
          <li key={`${o.market}-${o.outcome}`}>
            <span className="rank">{i + 1}</span>
            <div>
              <strong>{o.outcome}</strong>
              <small>{o.market}</small>
            </div>
            <em>{pct(o.probability)}</em>
          </li>
        ))}
      </ol>
    </div>
  );
}

function LastTab({ data }) {
  return (
    <div className="modal-body">
      <ResultGroup title="Head to head" rows={data.lastResults.headToHead} />
      <ResultGroup title={`${data.match.teams.home.name} last 5`} rows={data.lastResults.home} />
      <ResultGroup title={`${data.match.teams.away.name} last 5`} rows={data.lastResults.away} />
    </div>
  );
}

function ResultGroup({ title, rows }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {!rows?.length && <p className="muted">No recent matches found.</p>}
      <ul className="result-list">
        {rows?.map((r) => (
          <li key={r.id}>
            <span className="when">{formatKickoff(r.date)}</span>
            <span>
              {r.home?.name} {r.goals?.home ?? "-"}–{r.goals?.away ?? "-"} {r.away?.name}
            </span>
            <small>{r.league}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Bar({ label, value }) {
  return (
    <div className="bar-row">
      <div className="bar-meta">
        <span>{label}</span>
        <span>{pctInt(value)}</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}
