import { format } from "date-fns";
import { getCountryNameCN, getRaceNameCN } from "../services/f1api";

export default function SchedulePreview({ schedule = [], onRaceClick, onViewAll }) {
  if (!schedule || schedule.length === 0) return null;
  const upcoming = schedule.filter((race) => race.status === "upcoming").slice(0, 4);
  const races = upcoming.length > 0 ? upcoming : schedule.slice(-4);

  return (
    <div className="apple-card h-full overflow-hidden animate-in">
      <div className="border-b border-black/[0.05] px-6 py-4 flex justify-between items-center bg-white">
        <h3 className="font-headline-md text-[17px] font-bold text-f1-text">▣ 下一站赛程</h3>
        <button className="font-label-caps text-[11px] tracking-[0.16em] text-f1-text-muted hover:text-f1-text transition-colors" onClick={() => onViewAll?.()}>
          FULL →
        </button>
      </div>

      <div className="p-5 space-y-2.5">
        {races.map((race) => {
          const date = new Date(race.date);
          return (
            <button
              key={race.id}
              onClick={() => onRaceClick?.(race.round)}
              className="w-full grid grid-cols-[54px_42px_1fr_auto] items-center gap-3 rounded-xl bg-f1-bg/40 border border-black/[0.02] px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
            >
              <div className="text-center border-r border-black/[0.05] pr-2">
                <div className="font-label-caps text-[9px] text-f1-text-muted leading-none mb-1">{format(date, "MMM")}</div>
                <div className="font-data-numeric text-[22px] leading-none text-f1-text tabular-nums">{format(date, "dd")}</div>
              </div>
              <div className="font-label-caps text-[10px] text-f1-text-muted pl-1">R{String(race.round).padStart(2, "0")}</div>
              <div className="min-w-0">
                <div className="truncate font-sans text-[14px] font-bold text-f1-text">{race.name}</div>
                <div className="truncate font-sans text-[12px] text-f1-text-muted">
                  {getRaceNameCN(race.name) || getCountryNameCN(race.country)}
                </div>
              </div>
              <div className="font-data-numeric text-[13px] text-f1-text-muted tabular-nums">{format(date, "HH:mm")}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
