import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { getRaceNameCN, getCountryNameCN, getCircuitNameCN } from '../services/f1api';

export default function Schedule({ scheduleData = [], allRaces = [], onRaceClick }) {
  if (!scheduleData || scheduleData.length === 0) return null;

  // 哪些轮次有完整结果（统一转数字比较）
  const completedRoundNums = new Set(allRaces.map(r => parseInt(r.round, 10)));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="apple-card p-10 lg:p-14 mb-8">
         <h1 className="text-3xl sm:text-4xl font-semibold text-f1-text tracking-tight mb-4">2026 赛季赛程</h1>
         <p className="text-f1-text-muted text-[16px] max-w-2xl leading-relaxed">
           从揭幕战的初发到收官之夜的对决。全年 24 场顶级大奖赛的日程追踪，每一次引擎轰鸣都精确记录于此。
         </p>
      </div>

      <div className="grid gap-6">
        {scheduleData.map((race) => {
          const raceDate = new Date(race.date);
          const isCompleted = race.status === 'completed';
          const hasResults = completedRoundNums.has(parseInt(race.round, 10));
          
          return (
            <div 
              key={race.id} 
              className={`apple-card p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all duration-400 cursor-pointer ${isCompleted ? 'opacity-70 hover:opacity-100 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]' : 'hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]'}`}
              onClick={() => onRaceClick && onRaceClick(race.round)}
            >
              <div className="flex items-center space-x-8">
                <div className="text-center min-w-[64px]">
                  <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-1 ${isCompleted ? 'text-black/40' : 'text-f1-cyan'}`}>
                    {format(raceDate, "MMM", { locale: zhCN })}
                  </div>
                  <div className={`text-4xl font-bold tracking-tighter ${isCompleted ? 'text-black/40' : 'text-f1-text'}`}>
                    {format(raceDate, "dd")}
                  </div>
                </div>
                
                <div className="h-12 w-px bg-black/[0.08] hidden md:block"></div>
                
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-[11px] font-bold text-f1-text-muted uppercase tracking-[0.15em] bg-black/[0.04] px-2 py-0.5 rounded-sm">Round 0{race.round}</span>
                    {isCompleted && <span className="text-[11px] font-bold text-f1-text-muted uppercase tracking-wider">已完赛</span>}
                  </div>
                  <h3 className="text-[22px] font-bold text-f1-text tracking-tight mb-0.5">{race.name}</h3>
                  {getRaceNameCN(race.name) && (
                    <div className="text-[14px] text-f1-text-muted/70 font-medium mb-1">{getRaceNameCN(race.name)}</div>
                  )}
                  <p className="text-[14px] text-f1-text-muted font-medium">{getCircuitNameCN(race.circuit)} <span className="mx-2 text-black/10">|</span> {getCountryNameCN(race.country)}</p>
                </div>
              </div>
               
               <div className="mt-6 md:mt-0 md:ml-8 flex-shrink-0">
                 {hasResults ? (
                   <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-f1-cyan/10 text-[13px] font-semibold text-f1-cyan border border-f1-cyan/20 hover:bg-f1-cyan/20 transition-colors">
                     查看结果 →
                   </span>
                 ) : isCompleted ? (
                   <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-black/[0.03] text-[13px] font-semibold text-f1-text border border-black/5">
                     已完赛
                   </span>
                 ) : (
                   <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-f1-text text-white text-[13px] font-medium">
                     即将到来
                   </span>
                 )}
               </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
