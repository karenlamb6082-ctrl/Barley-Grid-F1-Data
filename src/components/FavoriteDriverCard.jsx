import { useState } from "react";
import { ChevronDown, RotateCcw, Star } from "lucide-react";
import { getDriverImage } from "../services/f1api";

const FAVORITE_DRIVER_KEY = "barley-grid:favorite-driver";

function getDriverShortName(driver) {
  if (!driver) return "";
  return `${driver.firstName?.[0] || ""}. ${driver.lastName}`;
}

function getDriverSeasonStats(driverId, data) {
  const races = data?.allRaces || [];
  const finishes = races
    .map((race) => {
      const result = race.Results?.find((item) => item.Driver.driverId === driverId);
      if (!result) return null;
      const position = Number.parseInt(result.position, 10);
      return {
        round: race.round,
        name: race.raceName,
        position,
        points: Number.parseFloat(result.points) || 0,
        status: result.status,
      };
    })
    .filter(Boolean);

  const wins = finishes.filter((race) => race.position === 1).length;
  const podiums = finishes.filter((race) => race.position <= 3).length;
  const dnfs = finishes.filter((race) => race.status !== "Finished" && !race.status?.includes("Lap")).length;

  return {
    wins,
    podiums,
    dnfs,
    recent: finishes.slice(-5).reverse(),
    lastRace: finishes.at(-1),
  };
}

function getTeammateDelta(driver, standings) {
  if (!driver) return 0;
  const teammate = standings.find((item) => item.id !== driver.id && item.team === driver.team);
  return Math.round((driver.points || 0) - (teammate?.points || 0));
}

export default function FavoriteDriverCard({ data, onDriverClick }) {
  const drivers = data?.driverStandings || [];
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [favoriteId, setFavoriteId] = useState(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(FAVORITE_DRIVER_KEY);
  });

  const selectedDriver = drivers.find((driver) => driver.id === favoriteId) || drivers[0];
  const stats = getDriverSeasonStats(selectedDriver?.id, data);
  const teammateDelta = getTeammateDelta(selectedDriver, drivers);
  const driverImage = getDriverImage(selectedDriver?.id);

  if (!selectedDriver) return null;

  const handleSelect = (driverId) => {
    setFavoriteId(driverId);
    setSelectorOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FAVORITE_DRIVER_KEY, driverId);
    }
  };

  const statTiles = [
    ["排名", `P${selectedDriver.rank}`],
    ["积分", selectedDriver.points],
    ["最近一站", stats.lastRace ? `P${stats.lastRace.position}` : "--"],
    ["队友差", `${teammateDelta >= 0 ? "+" : ""}${teammateDelta}`],
  ];

  return (
    <section className="apple-card overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1fr_0.9fr]">
        <button
          onClick={() => onDriverClick?.(selectedDriver.id)}
          className="relative min-h-[230px] overflow-hidden bg-f1-graphite p-6 text-left text-white sm:p-7 race-cut"
        >
          <div className="absolute inset-0 timing-grid opacity-[0.10]"></div>
          <div className="absolute bottom-0 left-0 h-12 w-2/3 bg-gradient-to-r from-f1-red to-transparent"></div>
          <div className="absolute right-5 top-5 text-[108px] font-black leading-none text-white/[0.06]">
            {selectedDriver.number || selectedDriver.code}
          </div>
          {driverImage && (
            <img
              src={driverImage}
              alt={`${selectedDriver.firstName} ${selectedDriver.lastName}`}
              className="absolute bottom-3 right-5 h-[170px] w-auto object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.35)]"
              loading="lazy"
            />
          )}
          <div className="relative z-10 max-w-[68%]">
            <div className="mb-4 flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.24em] text-f1-lime">
              <Star size={14} fill="currentColor" />
              我的关注车手
            </div>
            <div className="text-[14px] font-bold text-white/60">{selectedDriver.firstName}</div>
            <h2 className="mt-1 text-[42px] font-black uppercase leading-[0.9] tracking-tight">
              {selectedDriver.lastName}
            </h2>
            <div className="mt-5 inline-flex items-center gap-3 rounded-md bg-white/10 px-3 py-2 text-[13px] font-black">
              <span className="h-6 w-1.5 rounded-full" style={{ backgroundColor: selectedDriver.teamColor }}></span>
              {selectedDriver.team}
            </div>
          </div>
        </button>

        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[12px] font-black uppercase tracking-[0.18em] text-f1-text-muted">Favorite Driver</div>
              <h3 className="mt-1 text-[22px] font-black text-f1-text">{getDriverShortName(selectedDriver)}</h3>
            </div>
            <button
              onClick={() => setSelectorOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] font-black text-f1-text hover:border-f1-red/40"
            >
              <RotateCcw size={15} />
              更换
              <ChevronDown size={15} className={selectorOpen ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {statTiles.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-black/10 bg-black/[0.025] px-4 py-3">
                <div className="text-[12px] font-bold text-f1-text-muted">{label}</div>
                <div className="mt-1 text-[26px] font-black leading-none text-f1-text tabular-nums">{value}</div>
              </div>
            ))}
          </div>

          {selectorOpen && (
            <div className="mt-4 rounded-lg border border-black/10 bg-white p-2 shadow-[0_12px_30px_rgba(16,16,16,0.08)]">
              {drivers.slice(0, 8).map((driver) => (
                <button
                  key={driver.id}
                  onClick={() => handleSelect(driver.id)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-black/[0.04]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="h-7 w-1.5 rounded-full" style={{ backgroundColor: driver.teamColor }}></span>
                    <span className="truncate text-[14px] font-black text-f1-text">{getDriverShortName(driver)}</span>
                  </span>
                  <span className="text-[13px] font-black text-f1-text-muted">{driver.points} pts</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-black/10 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-black text-f1-text">最近表现</h3>
            <span className="rounded bg-black/[0.05] px-2 py-1 text-[11px] font-black text-f1-text-muted">
              {stats.wins} 胜 · {stats.podiums} 登台
            </span>
          </div>
          <div className="space-y-3">
            {stats.recent.length > 0 ? stats.recent.map((race) => (
              <button
                key={race.round}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-lg bg-black/[0.025] px-3 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-black text-f1-text">{race.name}</span>
                  <span className="mt-1 block text-[11px] font-bold text-f1-text-muted">R{String(race.round).padStart(2, "0")} · +{race.points} pts</span>
                </span>
                <span
                  className="rounded px-2 py-1 text-[13px] font-black text-f1-text"
                  style={{ backgroundColor: race.position <= 3 ? selectedDriver.teamColor : "rgba(0,0,0,0.06)" }}
                >
                  P{race.position}
                </span>
              </button>
            )) : (
              <div className="rounded-lg bg-black/[0.025] px-3 py-6 text-[13px] font-bold text-f1-text-muted">
                暂无已完成分站数据
              </div>
            )}
          </div>
          <div className="mt-4 text-[12px] font-bold text-f1-text-muted">已保存到本机，下次打开自动显示</div>
        </div>
      </div>
    </section>
  );
}
