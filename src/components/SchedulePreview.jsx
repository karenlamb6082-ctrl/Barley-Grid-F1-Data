import { format } from "date-fns";
import { getCountryNameCN, getRaceNameCN } from "../services/f1api";

export default function SchedulePreview({ schedule = [], onRaceClick, onViewAll }) {
  if (!schedule || schedule.length === 0) return null;
  const upcoming = schedule.filter((race) => race.status === "upcoming").slice(0, 4);
  const races = upcoming.length > 0 ? upcoming : schedule.slice(-4);

  return (
    <div className="apple-card h-full overflow-hidden">
      <div className="px-6 py-4 bg-f1-cyan text-f1-text flex justify-between items-center">
        <h3 className="text-[18px] font-black tracking-tight">▣ 接下来赛程</h3>
        <button className="text-[13px] font-black text-f1-text hover:text-white transition-colors" onClick={() => onViewAll?.()}>
          查看完整赛程 →
        </button>
      </div>

      <div className="p-5 space-y-2">
        {races.map((race) => {
          const date = new Date(race.date);
          return (
            <button
              key={race.id}
              onClick={() => onRaceClick?.(race.round)}
              className="w-full grid grid-cols-[54px_54px_1fr_auto] items-center gap-3 rounded-lg bg-black/[0.035] px-3 py-3 text-left hover:bg-black/[0.06] transition-colors"
            >
              <div className="text-center">
                <div className="text-[12px] font-black text-f1-text-muted">{format(date, "M月")}</div>
                <div className="text-[28px] font-black leading-none text-f1-text tabular-nums">{format(date, "dd")}</div>
              </div>
              <div className="text-[12px] font-black text-f1-text-muted">R{String(race.round).padStart(2, "0")}</div>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-black text-f1-text">{race.name}</div>
                <div className="truncate text-[12px] font-semibold text-f1-text-muted">
                  {getRaceNameCN(race.name) || getCountryNameCN(race.country)}
                </div>
              </div>
              <div className="text-[13px] font-bold text-f1-text-muted tabular-nums">{format(date, "HH:mm")}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
