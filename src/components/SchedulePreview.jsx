import { format } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import { getCountryNameCN, getRaceNameCN } from "../services/f1api";

export default function SchedulePreview({ schedule = [], onRaceClick, onViewAll }) {
  if (!schedule.length) return null;
  const races = schedule.filter((race) => race.status === "upcoming").slice(0, 3);
  return (
    <section className="surface-card h-full p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div><p className="section-kicker text-f1-text-muted">Up next</p><h2 className="mt-2 text-[18px] font-extrabold tracking-[-0.03em]">接下来</h2></div>
        <button onClick={onViewAll} className="pressable flex h-9 w-9 items-center justify-center rounded-[11px] border border-black/10 bg-white" aria-label="查看完整赛程"><ArrowUpRight size={15} /></button>
      </div>
      <div className="mt-5 space-y-2">
        {races.map((race) => {
          const date = new Date(race.date);
          return (
            <button key={race.id} onClick={() => onRaceClick?.(race.round)} className="pressable grid w-full grid-cols-[46px_1fr_auto] items-center gap-3 rounded-[14px] border border-black/[0.07] bg-black/[0.018] p-3 text-left hover:bg-black/[0.04]">
              <div className="border-r border-black/[0.08] text-center"><div className="section-kicker text-[8px] text-f1-text-muted">{format(date, "MMM")}</div><div className="metric-value mt-1 text-[20px] font-extrabold">{format(date, "dd")}</div></div>
              <div className="min-w-0"><div className="truncate text-[12px] font-extrabold">{race.name}</div><div className="mt-1 truncate text-[10px] font-semibold text-f1-text-muted">{getRaceNameCN(race.name) || getCountryNameCN(race.country)}</div></div>
              <span className="section-kicker text-[8px] text-f1-text-muted">R{String(race.round).padStart(2, "0")}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
