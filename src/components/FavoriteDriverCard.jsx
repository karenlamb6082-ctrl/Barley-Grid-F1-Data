import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAVORITE_DRIVER_KEY = "barley-grid:favorite-driver";

function getPodiums(driverId, data) {
  return (data?.allRaces || []).reduce((total, race) => {
    const result = race.Results?.find((item) => item.Driver.driverId === driverId);
    return total + (result && Number(result.position) <= 3 ? 1 : 0);
  }, 0);
}

export default function FavoriteDriverCard({ data, onDriverClick }) {
  const drivers = data?.driverStandings || [];
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [favoriteId, setFavoriteId] = useState(() => typeof window === "undefined" ? null : window.localStorage.getItem(FAVORITE_DRIVER_KEY));
  const driver = drivers.find((item) => item.id === favoriteId) || drivers[0];
  if (!driver) return null;

  const choose = (id) => {
    setFavoriteId(id);
    setSelectorOpen(false);
    window.localStorage.setItem(FAVORITE_DRIVER_KEY, id);
  };

  return (
    <section className="surface-card !overflow-visible mt-6 border-l-[5px] p-4" style={{ borderLeftColor: driver.teamColor || "#173f8f" }}>
      <div className="flex items-start justify-between gap-4">
        <button type="button" onClick={() => onDriverClick?.(driver.id)} className="pressable min-w-0 flex-1 text-left">
          <p className="race-mono text-[11px] font-extrabold tracking-[0.14em]">DRIVER WATCH</p>
          <h2 className="mt-2 truncate text-[19px] font-black tracking-[-0.04em]">{driver.firstName} {driver.lastName}</h2>
          <p className="race-mono mt-0.5 truncate text-[10px] font-bold tracking-[0.12em] text-f1-text-muted">{driver.team}</p>
        </button>
        <div className="race-mono pointer-events-none absolute right-4 top-2 text-[62px] font-black leading-none text-[#dedbd2]">#{driver.number || driver.code}</div>
        <div className="relative z-10">
          <button onClick={() => setSelectorOpen((value) => !value)} aria-expanded={selectorOpen} className="pressable flex items-center gap-1 border-b border-f1-text px-1 py-1 text-[11px] font-bold">更换 <ChevronDown size={11} /></button>
          {selectorOpen && (
            <div className="driver-selector-popover popover-enter absolute bottom-[calc(100%+8px)] right-0 z-30 max-h-[320px] w-[238px] overflow-y-auto rounded-[12px] border border-f1-text bg-f1-card p-1 custom-scrollbar sm:bottom-auto sm:top-[calc(100%+8px)]">
              {drivers.map((item) => <button key={item.id} onClick={() => choose(item.id)} className={`pressable flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[13px] font-bold ${item.id === driver.id ? "bg-f1-text text-white" : "hover:bg-black/[0.04]"}`}><span className="min-w-0 truncate">{item.firstName} {item.lastName}</span><span className="shrink-0">P{item.rank}</span></button>)}
            </div>
          )}
        </div>
      </div>
      <button type="button" onClick={() => onDriverClick?.(driver.id)} className="pressable mt-4 grid w-full grid-cols-3 divide-x divide-[#dedbd2] text-left">
        {[["排名", `P${driver.rank}`], ["积分", driver.points], ["领奖台", getPodiums(driver.id, data)]].map(([label, value]) => (
          <span key={label} className="pl-3 first:pl-0"><strong className="race-mono block text-[18px] font-black leading-none">{value}</strong><small className="mt-1 block text-[10px] font-semibold text-f1-text-muted">{label}</small></span>
        ))}
      </button>
    </section>
  );
}
