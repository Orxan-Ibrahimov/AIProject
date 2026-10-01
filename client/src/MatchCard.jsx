import { formatKickoff, scoreline } from "./format.js";

export default function MatchCard({ match, live, onClick }) {
  return (
    <button className="match-card" onClick={() => onClick(match)}>
      <div className="match-card-top">
        <div className="league">
          {match.league?.logo && <img src={match.league.logo} alt="" />}
          <span>
            {match.league?.country} · {match.league?.name}
          </span>
        </div>
        {live ? (
          <span className="live-pill">
            LIVE {match.status?.elapsed ? `${match.status.elapsed}'` : ""}
          </span>
        ) : (
          <span className="kickoff">{formatKickoff(match.date)}</span>
        )}
      </div>
      <div className="teams">
        <TeamSide team={match.teams.home} />
        <div className="score">{live ? scoreline(match) : "vs"}</div>
        <TeamSide team={match.teams.away} align="right" />
      </div>
      <div className="round">{match.league?.round}</div>
    </button>
  );
}

function TeamSide({ team, align }) {
  return (
    <div className={`team-side ${align || ""}`}>
      {team?.logo && <img src={team.logo} alt="" />}
      <strong>{team?.name}</strong>
    </div>
  );
}
