import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { getRaceNameCN, getCountryNameCN, getCircuitNameCN } from '../services/f1api';

export default function Schedule({ scheduleData = [], allRaces = [], onRaceClick, onBack }) {
  if (!scheduleData || scheduleData.length === 0) return null;

  // 哪些轮次有完整结果（统一转数字比较）
  const completedRoundNums = new Set(allRaces.map(r => parseInt(r.round, 10)));

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-5xl mx-auto px-4 pb-20">
      
      {/* 头部导航与切换 */}
      <div className="flex justify-between items-center border-b border-black/[0.05] pb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-black/[0.05] bg-white px-4 py-2 text-[13px] font-bold text-f1-text hover:bg-f1-bg transition-colors"
        >
          <ArrowLeft size={15} />
          返回概览
        </button>
      </div>

      {/* 社论级页面标题 */}
      <div className="text-center">
        <p className="font-label-caps text-[10px] text-f1-text-muted tracking-[0.2em] mb-3">2026 RACE CALENDAR</p>
        <h1 className="font-display-hero text-[40px] sm:text-[60px] text-f1-text leading-none uppercase">
          赛程追踪
        </h1>
        <p className="font-sans text-[15px] text-f1-text-muted max-w-2xl mx-auto mt-4 leading-relaxed">
          从揭幕战的初发到收官之夜的对决。全年 24 场顶级大奖赛的日程追踪，每一次引擎轰鸣都精确记录于此。
        </p>
      </div>

      {/* 赛程列表区域 */}
      <div className="grid gap-6">
        {scheduleData.map((race) => {
          const raceDate = new Date(race.date);
          const isCompleted = race.status === 'completed';
          const hasResults = completedRoundNums.has(parseInt(race.round, 10));
          
          return (
            <div 
              key={race.id} 
              className={`apple-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 cursor-pointer ${
                isCompleted ? 'opacity-85 hover:opacity-100' : ''
              }`}
              onClick={() => onRaceClick && onRaceClick(race.round)}
            >
              <div className="flex items-center space-x-6 sm:space-x-8 min-w-0">
                {/* 质感日期列 */}
                <div className="text-center min-w-[56px] border-r border-black/[0.05] pr-5 sm:pr-8">
                  <div className={`font-label-caps text-[10px] tracking-[0.16em] mb-1 ${isCompleted ? 'text-black/35' : 'text-f1-lime'}`}>
                    {format(raceDate, "MMM", { locale: zhCN })}
                  </div>
                  <div className={`font-data-numeric text-[30px] sm:text-[34px] leading-none ${isCompleted ? 'text-black/30' : 'text-f1-text'}`}>
                    {format(raceDate, "dd")}
                  </div>
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center space-x-3 mb-2.5">
                    <span className="font-label-caps text-[9px] tracking-[0.12em] bg-black/[0.04] px-2.5 py-0.5 rounded text-f1-text-muted font-bold">
                      Round {String(race.round).padStart(2, '0')}
                    </span>
                    {isCompleted && (
                      <span className="font-label-caps text-[9px] tracking-[0.1em] text-f1-text-muted font-bold">
                        · COMPLETED
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-headline-md text-[20px] sm:text-[23px] text-f1-text leading-tight group-hover:text-f1-red transition-colors">
                    {race.name}
                  </h3>
                  
                  {getRaceNameCN(race.name) && (
                    <div className="text-[13px] text-f1-text-muted/70 font-semibold mt-1">
                      {getRaceNameCN(race.name)}
                    </div>
                  )}
                  
                  <p className="font-sans text-[13px] text-f1-text-muted mt-2">
                    {getCircuitNameCN(race.circuit)} <span className="mx-2 text-black/10">|</span> {getCountryNameCN(race.country)}
                  </p>
                </div>
              </div>
               
               {/* 右侧交互标签按钮 (圆角16px以保持理性架构) */}
               <div className="md:ml-8 flex-shrink-0 flex items-center">
                 {hasResults ? (
                   <span className="btn-bounce inline-flex items-center px-5 py-2.5 rounded-lg bg-f1-lime/10 text-[13px] font-bold text-f1-lime border border-f1-lime/25 hover:bg-f1-lime/20 transition-all">
                     查看结果 →
                   </span>
                 ) : isCompleted ? (
                   <span className="inline-flex items-center px-5 py-2.5 rounded-lg bg-black/[0.03] text-[13px] font-semibold text-f1-text-muted border border-black/5">
                     已完赛
                   </span>
                 ) : (
                   <span className="inline-flex items-center px-5 py-2.5 rounded-lg bg-f1-graphite text-white text-[13px] font-semibold hover:bg-f1-text transition-colors">
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
