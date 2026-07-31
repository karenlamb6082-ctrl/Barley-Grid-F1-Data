import { useState } from "react";

function displayName(item, type) {
  return type === "driver" ? `${item.firstName} ${item.lastName}` : item.name;
}

export default function Standings({ driverData = [], teamData = [], onDriverClick, onTeamClick }) {
  const [activeTab, setActiveTab] = useState("driver");
  const list = activeTab === "driver" ? driverData : teamData;
  if (!list.length) return null;
  const open = (item) => activeTab === "driver" ? onDriverClick?.(item.id) : onTeamClick?.(item.id);
  const leaderPoints = Number(list[0]?.points || 0);

  return (
    <div className="app-page-top mx-auto max-w-3xl pb-4">
      <header className="border-b border-f1-text pb-3">
        <div className="flex items-end justify-between gap-4">
          <div><p className="race-mono text-[11px] font-extrabold tracking-[0.14em] text-f1-text-muted">2026 CHAMPIONSHIP</p><h1 className="mt-1 text-[38px] font-black leading-none tracking-[-0.06em]">积分</h1></div>
          <span className="race-mono whitespace-nowrap text-[11px] font-bold tracking-[0.12em]">LIVE TABLE</span>
        </div>
        <div className="mt-4 flex gap-6">
          {[["driver", "车手"], ["team", "车队"]].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)} className={`pressable relative pb-1 text-[14px] font-extrabold ${activeTab === id ? "text-f1-text after:absolute after:inset-x-0 after:-bottom-[13px] after:h-[3px] after:bg-f1-red" : "text-f1-text-muted"}`}>{label}</button>
          ))}
        </div>
      </header>

      <section className="mt-5 overflow-hidden rounded-[16px] border border-f1-text bg-f1-card">
        <div className="grid grid-cols-[40px_4px_1fr_auto] gap-3 border-b border-f1-text px-4 py-2 text-[10px] font-extrabold tracking-[0.12em] text-f1-text-muted">
          <span>POS</span><span /><span>{activeTab === "driver" ? "DRIVER / TEAM" : "CONSTRUCTOR"}</span><span>PTS / GAP</span>
        </div>
        {list.slice(0, 3).map((item, index) => {
          const gap = leaderPoints - Number(item.points || 0);
          return (
            <button key={item.id} type="button" onClick={() => open(item)} className={`tap-row grid min-h-[82px] w-full grid-cols-[40px_4px_1fr_auto] items-center gap-3 border-b border-[#dedbd2] px-4 py-3 text-left last:border-b-0 ${index === 0 ? "bg-[#151615] text-white" : ""}`}>
              <span className={`race-mono text-[27px] font-black ${index === 0 ? "text-f1-lime" : "text-[#aaa79f]"}`}>{String(index + 1).padStart(2, "0")}</span>
              <span className="h-9" style={{ backgroundColor: item.teamColor || "#77766f" }} />
              <span className="min-w-0"><span className="block truncate text-[15px] font-black leading-tight tracking-[-0.025em]">{displayName(item, activeTab)}</span>{activeTab === "driver" && <span className={`race-mono mt-1 block truncate text-[10px] font-bold tracking-[0.08em] ${index === 0 ? "text-white/55" : "text-f1-text-muted"}`}>{item.team}</span>}</span>
              <span className="shrink-0 text-right"><strong className="race-mono block text-[21px] font-black leading-none">{item.points}</strong><small className={`race-mono mt-1 block text-[10px] font-bold ${index === 0 ? "text-white/55" : "text-f1-text-muted"}`}>{index === 0 ? "LEADER" : `-${gap}`}</small></span>
            </button>
          );
        })}
      </section>

      <section className="mt-6">
        <div className="grid grid-cols-[34px_4px_1fr_auto] gap-3 border-b border-f1-text pb-2 text-[10px] font-extrabold tracking-[0.12em] text-f1-text-muted"><span>POS</span><span /><span>CLASSIFICATION</span><span>POINTS</span></div>
        {list.slice(3).map((item, index) => {
          const rank = Number(item.rank || index + 4);
          const gap = leaderPoints - Number(item.points || 0);
          return (
            <button key={item.id} type="button" onClick={() => open(item)} className="tap-row grid min-h-[62px] w-full grid-cols-[34px_4px_1fr_auto] items-center gap-3 border-b border-[#dedbd2] py-2.5 text-left">
              <span className="race-mono text-[17px] font-black text-[#aaa79f]">{String(rank).padStart(2, "0")}</span>
              <span className="h-7" style={{ backgroundColor: item.teamColor || "#77766f" }} />
              <span className="min-w-0"><span className="block truncate text-[15px] font-extrabold">{displayName(item, activeTab)}</span>{activeTab === "driver" && <span className="race-mono mt-0.5 block truncate text-[10px] font-bold tracking-[0.06em] text-f1-text-muted">{item.team}</span>}</span>
              <span className="shrink-0 text-right"><strong className="race-mono block text-[17px] font-black leading-none">{item.points}</strong><small className="race-mono mt-1 block text-[10px] font-bold text-f1-text-muted">-{gap}</small></span>
            </button>
          );
        })}
      </section>
    </div>
  );
}
