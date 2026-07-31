import { ArrowLeft } from "lucide-react";
import { useDrawer } from "../hooks/useDrawer";
import { getDriverImage, getRaceNameCN } from "../services/f1api";

function getDriverSeason(driverId, data) {
  let wins = 0;
  let podiums = 0;
  let dnfs = 0;

  const results = (data?.allRaces || []).map((race) => {
    const result = race.Results?.find((entry) => entry.Driver?.driverId === driverId);
    if (!result) return null;
    const position = Number(result.position);
    const finished = result.status === "Finished" || result.status?.includes("Lap");
    if (position === 1) wins += 1;
    if (position <= 3) podiums += 1;
    if (!finished) dnfs += 1;
    return {
      round: race.round,
      name: getRaceNameCN(race.raceName) || race.raceName,
      position: result.position,
      points: Number(result.points) || 0,
      finished,
    };
  }).filter(Boolean).slice(-6).reverse();

  return { wins, podiums, dnfs, results };
}

export default function DriverDrawer({ driverId, data, onClose }) {
  const { isOpen, activeId, handleClose, isVisible, drawerProps } = useDrawer(driverId, onClose);
  const driver = data?.driverStandings?.find((entry) => entry.id === activeId);
  const season = getDriverSeason(activeId, data);

  if (!data) return null;

  return (
    <div className={`fixed inset-0 z-[100] ${isVisible ? "pointer-events-auto" : "pointer-events-none"}`}>
      <button type="button" aria-label="关闭车手详情" className={`absolute inset-0 bg-black/30 transition-opacity duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? "opacity-100" : "opacity-0"}`} onClick={handleClose} />

      <section
        {...drawerProps}
        aria-label="车手详情"
        className={`detail-drawer absolute inset-y-0 right-0 flex transform-gpu flex-col overflow-hidden border-l border-f1-text bg-f1-bg transition-transform duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {driver && (
          <>
            <header className="relative z-20 flex shrink-0 items-center justify-between px-5 pb-3 pt-[calc(var(--app-safe-top)+14px)]">
              <button type="button" onClick={handleClose} className="pressable flex h-9 w-9 items-center justify-center rounded-[10px] border border-f1-text" aria-label="返回"><ArrowLeft size={17} /></button>
              <span className="race-mono text-[9px] font-extrabold tracking-[0.14em] text-f1-text-muted">DRIVER DOSSIER</span>
              <span className="h-10 w-10" aria-hidden="true" />
            </header>

            <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(var(--app-safe-bottom)+28px)]">
              <section className="surface-card relative min-h-[340px] border-l-[5px] p-6" style={{ borderLeftColor: driver.teamColor || "#4c5566" }}>
                <span className="race-mono absolute -right-2 top-5 text-[124px] font-black leading-none text-[#dedbd2]">#{driver.number}</span>
                <div className="relative z-10 max-w-[58%] pt-2">
                  <p className="race-mono text-[9px] font-extrabold tracking-[0.12em] text-f1-text-muted">P{driver.rank} · {driver.team}</p>
                  <h1 className="mt-3 text-[38px] font-black leading-[0.98] tracking-[-0.055em]">{driver.firstName} {driver.lastName}</h1>
                  <div className="race-mono mt-5 inline-flex border-b border-f1-text py-1 text-[11px] font-extrabold">DRIVER #{driver.number}</div>
                </div>
                <img src={getDriverImage(driver.id)} alt={`${driver.firstName} ${driver.lastName}`} className="absolute bottom-0 right-0 h-[270px] w-[210px] object-contain object-bottom" />
              </section>

              <section className="surface-card mt-4 grid grid-cols-3 divide-x divide-black/[0.07] p-5">
                {[["积分", driver.points], ["胜场", season.wins], ["领奖台", season.podiums]].map(([label, value]) => (
                  <div key={label} className="text-center"><div className="metric-value text-[25px] font-extrabold">{value}</div><div className="mt-1 text-[9px] font-semibold text-f1-text-muted">{label}</div></div>
                ))}
              </section>

              {season.results.length > 0 && (
                <section className="surface-card mt-4 p-3">
                  <h2 className="px-3 pb-2 pt-1 text-[12px] font-bold">最近分站</h2>
                  <div className="divide-y divide-black/[0.07]">
                    {season.results.map((result) => (
                      <div key={result.round} className="grid grid-cols-[34px_1fr_auto] items-center gap-3 px-3 py-3">
                        <span className="metric-value text-[13px] font-bold text-f1-text-muted">{String(result.round).padStart(2, "0")}</span>
                        <span className="text-[12px] font-bold leading-snug">{result.name}</span>
                        <span className={`race-mono border-l-2 pl-2 text-[10px] font-black ${result.finished ? "border-f1-text text-f1-text" : "border-f1-red text-f1-red"}`}>P{result.position}{result.points > 0 ? ` · +${result.points}` : ""}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
