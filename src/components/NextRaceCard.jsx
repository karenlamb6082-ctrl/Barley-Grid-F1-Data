import { useState, useEffect } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { getRaceNameCN, getCountryNameCN, getCircuitNameCN } from '../services/f1api';

// Session 中文名映射
const SESSION_LABELS = {
  fp1: '练习赛 FP1',
  fp2: '练习赛 FP2',
  fp3: '练习赛 FP3',
  sprintQualifying: '冲刺排位赛',
  sprint: '冲刺赛',
  qualifying: '排位赛',
  race: '正赛',
};

// Session 持续时间估计（分钟）
const SESSION_DURATION = {
  fp1: 60, fp2: 60, fp3: 60,
  sprintQualifying: 45, sprint: 60,
  qualifying: 60, race: 120,
};

// 找到下一个即将开始或正在进行的 Session
function getNextSession(sessions, isSprint) {
  if (!sessions) return null;
  const now = new Date();

  // 按照赛程顺序排列 Session
  let sessionOrder;
  if (isSprint) {
    sessionOrder = ['fp1', 'sprintQualifying', 'sprint', 'qualifying', 'race'];
  } else {
    sessionOrder = ['fp1', 'fp2', 'fp3', 'qualifying', 'race'];
  }

  for (const key of sessionOrder) {
    const time = sessions[key];
    if (!time) continue;
    
    const startTime = new Date(time);
    const durationMs = (SESSION_DURATION[key] || 60) * 60 * 1000;
    const estimatedEndTime = new Date(startTime.getTime() + durationMs);

    if (startTime > now) {
      // 尚未开始 → 倒计时到开始时间
      return {
        key,
        label: SESSION_LABELS[key] || key,
        time: startTime,
        inProgress: false,
      };
    } else if (estimatedEndTime > now) {
      // 正在进行中 → 显示为"进行中"
      return {
        key,
        label: SESSION_LABELS[key] || key,
        time: startTime,
        endTime: estimatedEndTime,
        inProgress: true,
      };
    }
    // 已结束，继续查找下一个
  }
  return null; // 所有 Session 都已结束
}

export default function NextRaceCard({ race, onClick }) {
  if (!race) return null;
  const raceDate = new Date(race.sessions.race);

  // 计算下一个 Session — 每 10 秒更新，确保状态切换
  const [nextSession, setNextSession] = useState(
    () => getNextSession(race.sessions, race.isSprint)
  );

  useEffect(() => {
    setNextSession(getNextSession(race.sessions, race.isSprint));
    const timer = setInterval(() => {
      setNextSession(getNextSession(race.sessions, race.isSprint));
    }, 10000); // 每 10 秒检查一次状态切换
    return () => clearInterval(timer);
  }, [race.sessions, race.isSprint]);

  const countdownTarget = nextSession?.inProgress ? null : (nextSession?.time || raceDate);

  // 实时倒计时（仅在非 inProgress 时倒计时）
  const [countdown, setCountdown] = useState(countdownTarget ? getCountdown(countdownTarget) : null);
  
  useEffect(() => {
    if (!countdownTarget) {
      setCountdown(null);
      return;
    }
    setCountdown(getCountdown(countdownTarget));
    const timer = setInterval(() => {
      setCountdown(getCountdown(countdownTarget));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownTarget?.getTime()]);

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
      
      {/* 倒计时 / 进行中 — 显示下一个 Session */}
      {nextSession && (
        <div className="mb-8">
          {nextSession.inProgress ? (
            /* 进行中状态 */
            <>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-f1-red animate-pulse"></div>
                <span className="text-[12px] font-bold text-f1-red">{nextSession.label}</span>
                <span className="text-[12px] font-bold text-f1-red px-2 py-0.5 bg-f1-red/10 rounded-full">进行中</span>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 bg-f1-red/5 rounded-xl py-4 text-center border border-f1-red/10">
                  <div className="text-[15px] font-bold text-f1-red tracking-tight">
                    {format(nextSession.time, "HH:mm")} ~ {format(nextSession.endTime, "HH:mm")}
                  </div>
                  <div className="text-[11px] font-bold text-f1-text-muted mt-1">
                    {format(nextSession.time, "MM/dd")} 当地赛道时间
                  </div>
                </div>
              </div>
            </>
          ) : countdown ? (
            /* 倒计时状态 */
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold text-f1-text-muted tracking-[0.08em] uppercase">距离</span>
                <span className="text-[12px] font-bold text-f1-red px-2 py-0.5 bg-f1-red/8 rounded">{nextSession.label}</span>
                <span className="text-[11px] text-f1-text-muted">
                  {format(nextSession.time, "MM/dd HH:mm")}
                </span>
              </div>
              <div className="flex gap-3">
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
            </>
          ) : null}
        </div>
      )}

      {/* 所有 Session 都结束时不展示倒计时 */}
      {!nextSession && (
        <div className="mb-8 py-3 text-center">
          <span className="text-[13px] font-bold text-f1-cyan">本站比赛已全部结束</span>
        </div>
      )}

      <div className="pt-6 border-t border-black/5 flex justify-between items-end">
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-bold text-f1-text-muted tracking-[0.1em] uppercase mb-1">练习赛 FP1</div>
            <div className="text-[15px] font-semibold text-f1-text tracking-tight">
              {race.sessions?.fp1 ? format(new Date(race.sessions.fp1), "MM/dd HH:mm") : 'TBD'}
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
