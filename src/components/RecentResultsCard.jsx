export default function RecentResultsCard({ results, onRaceClick, onViewAll }) {
  if (!results || results.length === 0) return null;
  const race = results[0];

  return (
    <div className="apple-card h-full overflow-hidden">
      <div className="px-6 py-4 bg-f1-red text-white flex justify-between items-center">
        <h3 className="text-[18px] font-black tracking-tight">🏆 最近结果</h3>
        <button
          className="text-[13px] font-black text-white hover:text-f1-lime transition-colors"
          onClick={(event) => {
            event.stopPropagation();
            onViewAll?.();
          }}
        >
          查看完整结果 →
        </button>
      </div>

      <button className="block w-full p-6 text-left" onClick={() => onRaceClick?.(race.round)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[12px] font-black text-f1-text-muted uppercase tracking-[0.16em]">
              Round {String(race.round).padStart(2, "0")}
            </div>
            <div className="mt-2 text-[22px] font-black text-f1-text leading-tight">{race.name}</div>
            <div className="mt-1 text-[14px] font-semibold text-f1-text-muted">{race.country}</div>
          </div>
          <span className="rounded bg-f1-red px-2 py-1 text-[11px] font-black text-white">完成</span>
        </div>

        <div className="mt-8 grid grid-cols-3 divide-x divide-black/10">
          {race.podium?.map((pod) => (
            <div key={pod.position} className="min-w-0 px-3 first:pl-0 last:pr-0">
              <div
                className="mb-4 inline-flex h-8 w-8 items-center justify-center race-cut text-[18px] font-black text-f1-text"
                style={{ backgroundColor: pod.position === 1 ? "#D7FF38" : pod.teamColor }}
              >
                {pod.position}
              </div>
              <div className="truncate text-[16px] font-black text-f1-text">{pod.name}</div>
              <div className="mt-1 truncate text-[12px] font-bold uppercase tracking-wide text-f1-text-muted">{pod.team}</div>
              <div className="mt-4 text-[18px] font-black text-f1-text tabular-nums">{pod.time}</div>
            </div>
          ))}
        </div>
      </button>
    </div>
  );
}
