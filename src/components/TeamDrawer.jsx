import { ArrowLeft } from "lucide-react";
import { useDrawer } from "../hooks/useDrawer";
import { getDriverImage, getRaceNameCN, getTeamAbbr } from "../services/f1api";

function getTeamSeason(team, drivers, data) {
  let wins = 0;
  let podiums = 0;
  const rounds = (data?.allRaces || []).map((race) => {
    const results = drivers.map((driver) => race.Results?.find((entry) => entry.Driver?.driverId === driver.id)).filter(Boolean);
    if (!results.length) return null;
    const best = Math.min(...results.map((result) => Number(result.position)));
    const points = results.reduce((sum, result) => sum + (Number(result.points) || 0), 0);
    if (best === 1) wins += 1;
    if (best <= 3) podiums += 1;
    return { round: race.round, name: getRaceNameCN(race.raceName) || race.raceName, best, points };
  }).filter(Boolean).slice(-6).reverse();
  return { wins, podiums, rounds, points: team?.points || 0 };
}

export default function TeamDrawer({ teamId, data, onClose }) {
  const { isOpen, activeId, handleClose, isVisible, drawerProps } = useDrawer(teamId, onClose);
  const team = data?.teamStandings?.find((entry) => entry.id === activeId);
  const drivers = data?.driverStandings?.filter((driver) => driver.constructorId === team?.id) || [];
  const season = getTeamSeason(team, drivers, data);

  if (!data) return null;

  return (
    <div className={`fixed inset-0 z-[100] ${isVisible ? "pointer-events-auto" : "pointer-events-none"}`}>
      <button type="button" aria-label="关闭车队详情" className={`absolute inset-0 bg-black/30 transition-opacity duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? "opacity-100" : "opacity-0"}`} onClick={handleClose} />
      <section {...drawerProps} aria-label="车队详情" className={`detail-drawer absolute inset-y-0 right-0 flex transform-gpu flex-col overflow-hidden border-l border-f1-text bg-f1-bg transition-transform duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        {team && (
          <>
            <header className="relative z-20 flex shrink-0 items-center justify-between px-5 pb-3 pt-[calc(var(--app-safe-top)+14px)]">
              <button type="button" onClick={handleClose} className="pressable flex h-9 w-9 items-center justify-center rounded-[10px] border border-f1-text" aria-label="返回"><ArrowLeft size={17} /></button>
              <span className="race-mono text-[9px] font-extrabold tracking-[0.14em] text-f1-text-muted">TEAM DOSSIER</span>
              <span className="h-10 w-10" aria-hidden="true" />
            </header>

            <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(var(--app-safe-bottom)+28px)]">
              <section className="surface-card relative min-h-[250px] border-l-[5px] p-6" style={{ borderLeftColor: team.teamColor }}>
                <span className="race-mono absolute bottom-4 right-5 text-[88px] font-black leading-none text-[#dedbd2]">{getTeamAbbr(team.id)}</span>
                <div className="relative z-10 max-w-[76%] pt-2">
                  <p className="race-mono text-[9px] font-extrabold tracking-[0.12em] text-f1-text-muted">CONSTRUCTORS P{team.rank}</p>
                  <h1 className="mt-4 text-[39px] font-black leading-[0.98] tracking-[-0.055em]">{team.name}</h1>
                  <div className="race-mono mt-6 inline-flex border-b border-f1-text py-1 text-[11px] font-extrabold">{season.points} PTS</div>
                </div>
              </section>

              <section className="surface-card mt-4 grid grid-cols-3 divide-x divide-black/[0.07] p-5">
                {[["积分", season.points], ["胜场", season.wins], ["领奖台", season.podiums]].map(([label, value]) => <div key={label} className="text-center"><div className="metric-value text-[25px] font-extrabold">{value}</div><div className="mt-1 text-[9px] font-semibold text-f1-text-muted">{label}</div></div>)}
              </section>

              <section className="surface-card mt-4 overflow-hidden">
                <div className="flex items-end justify-between border-b border-f1-text px-4 py-3"><h2 className="text-[13px] font-black">车手阵容</h2><span className="race-mono text-[8px] font-bold tracking-[0.12em] text-f1-text-muted">LINE-UP / 02</span></div>
                <div className="grid grid-cols-2 divide-x divide-[#dedbd2]">
                  {drivers.map((driver) => (
                    <div key={driver.id} className="relative min-h-[166px] overflow-hidden p-4">
                      <div className="relative z-10 max-w-[65%]"><div className="text-[12px] font-extrabold leading-snug">{driver.firstName} {driver.lastName}</div><div className="race-mono mt-2 border-t border-f1-text pt-1 text-[8px] font-black text-f1-text-muted">P{driver.rank} / {driver.points} PTS</div></div>
                      <img src={getDriverImage(driver.id)} alt={`${driver.firstName} ${driver.lastName}`} className="absolute bottom-0 right-0 h-[132px] w-[98px] object-contain object-bottom" />
                    </div>
                  ))}
                </div>
              </section>

              {season.rounds.length > 0 && (
                <section className="surface-card mt-4 p-3">
                  <h2 className="px-3 pb-2 pt-1 text-[12px] font-bold">最近分站</h2>
                  <div className="divide-y divide-black/[0.07]">{season.rounds.map((round) => <div key={round.round} className="grid grid-cols-[34px_1fr_auto] items-center gap-3 px-3 py-3"><span className="metric-value text-[13px] font-bold text-f1-text-muted">{String(round.round).padStart(2, "0")}</span><span className="text-[12px] font-bold">{round.name}</span><span className="text-[10px] font-bold">P{round.best} · +{round.points}</span></div>)}</div>
                </section>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
