export default function RecentResultsCard({ results, onRaceClick }) {
  if (!results || results.length === 0) return null;

  return (
    <div className="apple-card h-full flex flex-col">
      <div className="px-8 py-6 border-b border-black/5 flex justify-between items-center">
        <h3 className="text-[19px] font-semibold text-f1-text tracking-tight">分站结果总览</h3>
        <button className="text-[14px] font-medium text-f1-cyan hover:text-f1-text transition-colors">
          查看全部
        </button>
      </div>
      
      <div className="flex-1 divide-y divide-black/5">
        {results.map((race) => (
          <div key={race.id} className="p-8 hover:bg-[#FDFDFD] transition-colors cursor-pointer group" onClick={() => onRaceClick && onRaceClick(race.round)}>
            <div className="mb-6 flex justify-between items-end">
              <div>
                <div className="text-[11px] font-bold text-f1-text-muted uppercase tracking-[0.15em] mb-2">
                  Round 0{race.round}
                </div>
                <div className="text-[20px] font-bold text-f1-text tracking-tight">
                  {race.name}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {race.podium.map((pod) => (
                <div key={pod.position} className="flex items-center space-x-3.5 bg-white border border-black/5 group-hover:border-black/10 group-hover:shadow-[0_2px_12px_rgba(0,0,0,0.02)] rounded-2xl p-3.5 transition-all">
                  <div className={`text-[18px] font-bold w-6 text-center flex-shrink-0 ${
                    pod.position === 1 ? 'text-f1-red' : 
                    pod.position === 2 ? 'text-f1-text' : 
                    'text-f1-cyan'
                  }`}>{pod.position}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-f1-text truncate">{pod.name}</div>
                    <div className="text-[11px] text-f1-text-muted uppercase tracking-[0.05em] font-medium truncate mt-0.5">{pod.team}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
