import { useState, useEffect } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { getRaceNameCN, getCountryNameCN, getCircuitNameCN } from '../services/f1api';

export default function NextRaceCard({ race, onClick }) {
  if (!race) return null;
  const raceDate = new Date(race.sessions.race);
  
  // 实时倒计时
  const [countdown, setCountdown] = useState(getCountdown(raceDate));
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdown(raceDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [raceDate.getTime()]);

  return (
    <div 
      className="apple-card p-8 lg:p-10 flex flex-col justify-between bg-gradient-to-br from-white to-[#FAFAFA] cursor-pointer group transition-all hover:shadow-lg hover:scale-[1.002]"
      onClick={() => onClick && onClick(race.round)}
    >
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center space-x-2.5 mb-3.5">
             <div className="w-1.5 h-1.5 rounded-full bg-f1-red animate-pulse"></div>
             <span className="text-[11px] font-bold text-f1-red tracking-[0.15em] uppercase">Next Grand Prix</span>
          </div>
          <h2 className="text-3xl font-bold text-f1-text tracking-tight mb-1 leading-tight">{race.name}</h2>
          {getRaceNameCN(race.name) && (
            <p className="text-[14px] text-f1-text-muted/60 font-medium mb-2">{getRaceNameCN(race.name)}</p>
          )}
          <p className="text-[13px] text-f1-text-muted font-medium tracking-wide">
            {getCircuitNameCN(race.circuit)} <span className="mx-2 text-black/10">|</span> {getCountryNameCN(race.country)}
          </p>
        </div>
      </div>
      
      {/* 倒计时 */}
      {countdown && (
        <div className="flex gap-3 mb-8">
          {[
            { value: countdown.days, label: '天' },
            { value: countdown.hours, label: '时' },
            { value: countdown.minutes, label: '分' },
            { value: countdown.seconds, label: '秒' },
          ].map((item) => (
            <div key={item.label} className="flex-1 bg-black/[0.03] rounded-xl py-3 text-center border border-black/[0.03]">
              <div className="text-[24px] sm:text-[28px] font-bold text-f1-text tracking-tighter leading-none tabular-nums">
                {String(item.value).padStart(2, '0')}
              </div>
              <div className="text-[11px] font-bold text-f1-text-muted mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-6 border-t border-black/5 flex justify-between items-end">
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-bold text-f1-text-muted tracking-[0.1em] uppercase mb-1">排位赛</div>
            <div className="text-[15px] font-semibold text-f1-text tracking-tight">
              {race.sessions?.qualifying ? format(new Date(race.sessions.qualifying), "MM/dd HH:mm") : 'TBD'}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-f1-text-muted tracking-[0.1em] uppercase mb-1">正赛</div>
            <div className="text-[15px] font-bold text-f1-text tracking-tight">
              {race.sessions?.race ? format(new Date(race.sessions.race), "MM/dd HH:mm") : 'TBD'}
            </div>
          </div>
          <div className="text-[12px] text-f1-cyan font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            查看详情 →
          </div>
        </div>
        
        <div className="text-right flex flex-col items-end">
          <div className="text-[72px] font-bold text-f1-text tracking-tighter leading-none -mr-1.5 mb-1.5">
            {format(raceDate, "dd")}
          </div>
          <div className="text-[16px] font-bold text-f1-cyan tracking-[0.2em] uppercase">
            {format(raceDate, "MMM", { locale: zhCN })}
          </div>
        </div>
      </div>
    </div>
  );
}

// 倒计时计算
function getCountdown(targetDate) {
  const now = new Date();
  const diff = targetDate - now;
  if (diff <= 0) return null;
  
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}
