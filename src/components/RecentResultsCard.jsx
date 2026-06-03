export default function RecentResultsCard({ results, onRaceClick, onViewAll }) {
  if (!results || results.length === 0) return null;
  const race = results[0];

  return (
    <div className="apple-card h-full overflow-hidden animate-in">
      <div className="px-6 py-4 bg-f1-red text-white flex justify-between items-center">
        <h3 className="font-headline-md text-[17px] font-bold tracking-tight">🏆 最近分站结果</h3>
        <button
          className="font-label-caps text-[11px] tracking-[0.16em] text-white hover:opacity-80 transition-opacity"
          onClick={(event) => {
            event.stopPropagation();
            onViewAll?.();
          }}
        >
          FULL →
        </button>
      </div>

      <button className="block w-full p-6 text-left" onClick={() => onRaceClick?.(race.round)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-label-caps text-f1-text-muted tracking-[0.16em]">
              Round {String(race.round).padStart(2, "0")}
            </div>
            <div className="mt-2 font-headline-md text-[22px] font-bold text-f1-text leading-tight">{race.name}</div>
            <div className="mt-1 font-sans text-[13px] font-semibold text-f1-text-muted">{race.country}</div>
          </div>
          <span className="rounded bg-f1-red/10 border border-f1-red/25 px-2.5 py-0.5 font-label-caps text-[9px] font-bold text-f1-red">完成</span>
        </div>

        <div className="mt-8 grid grid-cols-3 divide-x divide-black/[0.05]">
          {race.podium?.map((pod) => (
            <div key={pod.position} className="min-w-0 px-3.5 first:pl-0 last:pr-0">
              <div
                className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[16px] font-black text-f1-text border border-black/[0.03]"
                style={{ backgroundColor: pod.position === 1 ? "#C5A880" : pod.teamColor + "15", color: pod.position === 1 ? "#ffffff" : pod.teamColor }}
              >
                {pod.position}
              </div>
              <div className="truncate font-sans text-[14px] font-bold text-f1-text">{pod.name}</div>
              <div className="mt-1 truncate font-label-caps text-[9px] tracking-wide text-f1-text-muted">{pod.team}</div>
              <div className="mt-4 font-data-numeric text-[16px] text-f1-text tabular-nums">{pod.time}</div>
            </div>
          ))}
        </div>
      </button>
    </div>
  );
}
