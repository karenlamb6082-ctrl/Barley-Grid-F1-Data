import { ArrowUpRight, Flag } from "lucide-react";

export default function RecentResultsCard({ results, onRaceClick, onViewAll }) {
  if (!results?.length) return null;
  const race = results[0];
  return (
    <section className="surface-card h-full p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div><p className="section-kicker text-f1-text-muted">Latest result</p><h2 className="mt-2 text-[18px] font-extrabold tracking-[-0.03em]">最近完赛</h2></div>
        <button onClick={onViewAll} className="pressable flex h-9 w-9 items-center justify-center rounded-[11px] border border-black/10 bg-white" aria-label="查看完整赛程"><ArrowUpRight size={15} /></button>
      </div>
      <button onClick={() => onRaceClick?.(race.round)} className="pressable mt-5 block w-full rounded-[16px] bg-f1-text p-4 text-left text-white">
        <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">Round {String(race.round).padStart(2, "0")}</span><Flag size={14} className="text-[#d7ff3f]" /></div>
        <div className="mt-2 text-[17px] font-extrabold tracking-[-0.03em]">{race.name}</div>
      </button>
      <div className="mt-4 space-y-2">
        {race.podium?.map((pod) => (
          <button key={pod.position} onClick={() => onRaceClick?.(race.round)} className="pressable grid w-full grid-cols-[28px_5px_1fr_auto] items-center gap-3 rounded-[12px] px-2 py-2 text-left hover:bg-black/[0.035]">
            <span className="metric-value text-[16px] font-extrabold text-f1-text-muted">{pod.position}</span><span className="h-6 rounded-full" style={{ backgroundColor: pod.teamColor }} /><span className="truncate text-[12px] font-bold">{pod.name}</span><span className="text-[10px] font-bold text-f1-text-muted">{pod.team}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
