export default function StandingsWidget({ title, data, type, maxPoints, onViewAll, onItemClick }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="apple-card flex flex-col h-full">
      <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-f1-text tracking-tight">{title}</h3>
      </div>
      
      <div className="px-6 py-2 flex-1">
        <div className="divide-y divide-black/5">
          {data.map((item, index) => {
            const fillPercentage = Math.max(3, (item.points / maxPoints) * 100);
            return (
              <div 
                key={item.id} 
                className="py-3.5 flex items-center cursor-pointer hover:bg-black/[0.02] transition-colors rounded-xl px-2 -mx-2"
                onClick={() => onItemClick && onItemClick(item.id)}
              >
                <span className={`w-6 text-center text-[15px] font-medium mr-3 ${index === 0 ? 'text-f1-text font-bold' : 'text-f1-text-muted'}`}>
                  {item.rank}
                </span>
                
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center space-x-2.5 mb-1.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.teamColor || '#E6E5E3' }}></div>
                    <span className="font-semibold text-f1-text text-[14px] truncate">
                      {type === "driver" ? `${item.firstName} ${item.lastName}` : item.name}
                    </span>
                    {type === "driver" && (
                      <span className="text-[11px] text-f1-text-muted uppercase tracking-wider font-medium truncate">{item.team}</span>
                    )}
                  </div>
                  
                  <div className="h-[4px] w-full bg-black/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-700 ease-out" 
                      style={{ 
                        width: `${fillPercentage}%`,
                        backgroundColor: index === 0 ? '#D32F2F' : (item.teamColor || '#376b6d')
                      }}
                    ></div>
                  </div>
                </div>

                <div className="text-right pl-2">
                  <div className="font-semibold text-f1-text text-[15px]">{item.points}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-black/5 mt-2">
        <button onClick={onViewAll} className="w-full text-center text-[13px] font-medium text-f1-cyan hover:text-f1-text transition-colors py-4 cursor-pointer">
          查看完整榜单
        </button>
      </div>
    </div>
  )
}
