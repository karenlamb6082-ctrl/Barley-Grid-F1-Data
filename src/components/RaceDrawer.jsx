import { useState, useEffect } from 'react';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import { getTeamColor, fetchRaceWeekend, fetchPracticeResults, getRaceNameCN, getCountryNameCN, getCircuitNameCN } from '../services/f1api';

export default function RaceDrawer({ raceRound, data, onClose, onDriverClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRound, setActiveRound] = useState(null);
  const [activeTab, setActiveTab] = useState('race');
  const [weekendData, setWeekendData] = useState({ qualifying: null, sprint: null, sprintQualifying: null });
  const [loadingWeekend, setLoadingWeekend] = useState(false);
  const [practiceData, setPracticeData] = useState({ fp1: null, fp2: null, fp3: null });
  const [practiceError, setPracticeError] = useState(null);
  const [loadingPractice, setLoadingPractice] = useState(false);
  
  useEffect(() => {
    if (raceRound) {
      setActiveRound(raceRound);
      // 智能默认 tab：有正赛结果的显示正赛，否则显示时间表
      const hasResults = data?.allRaces?.find(r => r.round === String(raceRound));
      setActiveTab(hasResults ? 'race' : 'schedule');
      setWeekendData({ qualifying: null, sprint: null, sprintQualifying: null });
      setPracticeData({ fp1: null, fp2: null, fp3: null });
      setPracticeError(null);
      lockScroll();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpen(true);
        });
      });
    } else {
      setIsOpen(false);
      unlockScroll();
      const timer = setTimeout(() => {
        setActiveRound(null);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [raceRound]);

  // 打开 Drawer 时按需加载排位赛和冲刺赛数据
  useEffect(() => {
    if (!activeRound) return;
    setLoadingWeekend(true);
    fetchRaceWeekend(activeRound).then(d => {
      setWeekendData(d);
      setLoadingWeekend(false);
    });
    // 并行加载练习赛数据
    setLoadingPractice(true);
    fetchPracticeResults(activeRound, data?.schedule).then(d => {
      setPracticeData({ fp1: d.fp1, fp2: d.fp2, fp3: d.fp3 });
      setPracticeError(d.error || null);
      setLoadingPractice(false);
    });
  }, [activeRound]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 450); 
  };

  const isVisible = isOpen || activeRound;

  // 从 allRaces 获取完整比赛数据
  const race = data?.allRaces?.find(r => r.round === String(activeRound));
  
  // 从 schedule 获取赛程信息
  const scheduleInfo = data?.schedule?.find(s => String(s.round) === String(activeRound));

  const results = race?.Results || [];
  const circuit = race?.Circuit;
  const isSprint = scheduleInfo?.isSprint;

  // 计算各车队本站总得分
  const teamPointsMap = {};
  results.forEach(res => {
    const cId = res.Constructor.constructorId;
    if (!teamPointsMap[cId]) {
      teamPointsMap[cId] = { name: res.Constructor.name, points: 0, color: getTeamColor(cId) };
    }
    teamPointsMap[cId].points += parseFloat(res.points) || 0;
  });
  const teamPoints = Object.values(teamPointsMap).sort((a, b) => b.points - a.points);

  // 可用 Tab 列表
  const availableTabs = [];
  availableTabs.push({ key: 'schedule', label: '时间表' });
  // 练习赛 Tab：有数据时显示，或者 session 已过但 API 受限也显示（让用户知道状态）
  const now = new Date();
  const fpSessionPast = (sessionKey) => {
    const time = scheduleInfo?.sessions?.[sessionKey];
    return time && new Date(time) < now;
  };
  if (practiceData.fp1 || (fpSessionPast('fp1') && practiceError)) availableTabs.push({ key: 'fp1', label: 'FP1' });
  if (practiceData.fp2 || (fpSessionPast('fp2') && practiceError)) availableTabs.push({ key: 'fp2', label: 'FP2' });
  if (practiceData.fp3 || (fpSessionPast('fp3') && practiceError)) availableTabs.push({ key: 'fp3', label: 'FP3' });
  // 冲刺周末
  if (weekendData.sprintQualifying && isSprint) availableTabs.push({ key: 'sprintQual', label: '冲刺排位' });
  if (weekendData.sprint && isSprint) availableTabs.push({ key: 'sprint', label: '冲刺赛' });
  if (weekendData.qualifying) availableTabs.push({ key: 'qualifying', label: '排位赛' });
  if (results.length > 0) availableTabs.push({ key: 'race', label: '正赛' });

  // 时间格式化
  const formatSessionTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!data) return null;

  // ========== 排位赛结果渲染 ==========
  const renderQualifying = () => {
    if (!weekendData.qualifying) return <div className="text-center text-f1-text-muted py-12">暂无排位赛数据</div>;
    return (
      <div className="space-y-2">
        {weekendData.qualifying.map(r => {
          const teamColor = getTeamColor(r.constructorId);
          let posStyle = 'text-f1-text-muted';
          if (r.position === 1) posStyle = 'text-[#A68224] font-black';
          else if (r.position <= 3) posStyle = 'text-f1-text font-bold';
          else if (r.position <= 10) posStyle = 'text-f1-cyan font-bold';

          return (
            <div 
              key={r.driverId}
              className="flex items-center p-3.5 rounded-xl border border-white/60 transition-all hover:bg-white/30 cursor-pointer group"
              style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}
              onClick={() => onDriverClick && onDriverClick(r.driverId)}
            >
              <span className={`w-8 text-center text-[16px] flex-shrink-0 mr-3 ${posStyle}`}>{r.position}</span>
              <div className="w-1.5 h-8 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: teamColor }} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-f1-text truncate">
                  {r.firstName} <span className="uppercase">{r.lastName}</span>
                </div>
                <div className="text-[11px] text-f1-text-muted font-medium truncate mt-0.5">{r.constructorName}</div>
              </div>
              {/* Q1/Q2/Q3 成绩 */}
              <div className="text-right flex-shrink-0 ml-2 space-y-0.5">
                {r.q3 ? (
                  <div className="text-[12px] font-bold text-f1-text">{r.q3}</div>
                ) : r.q2 ? (
                  <div className="text-[12px] font-medium text-f1-text-muted">{r.q2}</div>
                ) : r.q1 ? (
                  <div className="text-[12px] font-medium text-f1-text-muted/60">{r.q1}</div>
                ) : (
                  <div className="text-[11px] text-f1-text-muted">—</div>
                )}
                {r.q3 && <div className="text-[10px] text-f1-text-muted">Q3</div>}
                {!r.q3 && r.q2 && <div className="text-[10px] text-f1-text-muted">Q2 淘汰</div>}
                {!r.q3 && !r.q2 && r.q1 && <div className="text-[10px] text-f1-text-muted">Q1 淘汰</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ========== 冲刺排位赛结果渲染 ==========
  const renderSprintQualifying = () => {
    if (!weekendData.sprintQualifying) return <div className="text-center text-f1-text-muted py-12">暂无冲刺排位赛数据</div>;
    return (
      <div className="space-y-2">
        {weekendData.sprintQualifying.map(r => {
          const teamColor = getTeamColor(r.constructorId);
          let posStyle = 'text-f1-text-muted';
          if (r.position === 1) posStyle = 'text-[#A68224] font-black';
          else if (r.position <= 3) posStyle = 'text-f1-text font-bold';
          else if (r.position <= 8) posStyle = 'text-f1-cyan font-bold';

          return (
            <div 
              key={r.driverId}
              className="flex items-center p-3.5 rounded-xl border border-white/60 transition-all hover:bg-white/30 cursor-pointer"
              style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}
              onClick={() => onDriverClick && onDriverClick(r.driverId)}
            >
              <span className={`w-8 text-center text-[16px] flex-shrink-0 mr-3 ${posStyle}`}>{r.position}</span>
              <div className="w-1.5 h-8 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: teamColor }} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-f1-text truncate">
                  {r.firstName} <span className="uppercase">{r.lastName}</span>
                </div>
                <div className="text-[11px] text-f1-text-muted font-medium truncate mt-0.5">{r.constructorName}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ========== 冲刺赛结果渲染 ==========
  const renderSprint = () => {
    if (!weekendData.sprint) return <div className="text-center text-f1-text-muted py-12">暂无冲刺赛数据</div>;
    return (
      <div className="space-y-2">
        {weekendData.sprint.map(r => {
          const teamColor = getTeamColor(r.constructorId);
          const isRetired = r.status !== 'Finished' && !r.status.includes('Lap');
          let posStyle = 'text-f1-text-muted';
          if (r.position === 1) posStyle = 'text-[#A68224] font-black';
          else if (r.position <= 3) posStyle = 'text-f1-text font-bold';
          else if (r.position <= 8) posStyle = 'text-f1-cyan font-bold';

          return (
            <div 
              key={r.driverId}
              className="flex items-center p-3.5 rounded-xl border border-white/60 transition-all hover:bg-white/30 cursor-pointer"
              style={{ backgroundColor: isRetired ? 'rgba(200,50,50,0.03)' : 'rgba(255,255,255,0.35)' }}
              onClick={() => onDriverClick && onDriverClick(r.driverId)}
            >
              <span className={`w-8 text-center text-[16px] flex-shrink-0 mr-3 ${posStyle}`}>
                {isRetired ? 'R' : r.position}
              </span>
              <div className="w-1.5 h-8 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: teamColor }} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-f1-text truncate">
                  {r.firstName} <span className="uppercase">{r.lastName}</span>
                </div>
                <div className="text-[11px] text-f1-text-muted font-medium truncate mt-0.5">{r.constructorName}</div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                {isRetired ? (
                  <span className="text-[12px] text-[#C83232] font-bold">{r.status}</span>
                ) : (
                  <>
                    <div className="text-[13px] font-medium text-f1-text-muted">
                      {r.position === 1 ? r.time : (r.time ? `${r.time}` : '—')}
                    </div>
                    {r.points > 0 && (
                      <div className="text-[11px] font-bold text-f1-cyan mt-0.5">+{r.points} PTS</div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ========== 时间表渲染 ==========
  const renderSchedule = () => {
    if (!scheduleInfo?.sessions) return null;
    const s = scheduleInfo.sessions;
    
    // 构建 Session 列表
    const sessions = [];
    if (isSprint) {
      // 冲刺周末：FP1 → 冲刺排位 → 冲刺赛 → 排位赛 → 正赛
      if (s.fp1) sessions.push({ label: '练习赛 FP1', time: s.fp1, icon: '🔧' });
      if (s.sprintQualifying) sessions.push({ label: '冲刺排位赛', time: s.sprintQualifying, icon: '⚡' });
      if (s.sprint) sessions.push({ label: '冲刺赛', time: s.sprint, icon: '🏃' });
      if (s.qualifying) sessions.push({ label: '排位赛', time: s.qualifying, icon: '🏎️' });
      if (s.race) sessions.push({ label: '正赛', time: s.race, icon: '🏁' });
    } else {
      // 常规周末：FP1 → FP2 → FP3 → 排位赛 → 正赛
      if (s.fp1) sessions.push({ label: '练习赛 FP1', time: s.fp1, icon: '🔧' });
      if (s.fp2) sessions.push({ label: '练习赛 FP2', time: s.fp2, icon: '🔧' });
      if (s.fp3) sessions.push({ label: '练习赛 FP3', time: s.fp3, icon: '🔧' });
      if (s.qualifying) sessions.push({ label: '排位赛', time: s.qualifying, icon: '🏎️' });
      if (s.race) sessions.push({ label: '正赛', time: s.race, icon: '🏁' });
    }

    const now = new Date();

    return (
      <div className="relative">
        {/* 时间线竖线 */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-black/[0.06]" />
        
        <div className="space-y-0">
          {sessions.map((session, idx) => {
            const sessionDate = new Date(session.time);
            const isPast = sessionDate < now;
            const isNext = !isPast && (idx === 0 || new Date(sessions[idx - 1]?.time) < now);
            
            return (
              <div key={session.label} className="relative flex items-start pl-10 py-4">
                {/* 时间线节点 */}
                <div className={`absolute left-[11px] w-2.5 h-2.5 rounded-full border-2 ${
                  isNext ? 'border-f1-red bg-f1-red animate-pulse' :
                  isPast ? 'border-f1-cyan bg-f1-cyan' : 'border-black/20 bg-white'
                }`} style={{ top: '1.25rem' }} />
                
                <div className="flex-1 flex items-center justify-between p-4 rounded-xl border border-white/60 transition-all" 
                  style={{ backgroundColor: isNext ? 'rgba(200,50,50,0.05)' : 'rgba(255,255,255,0.35)' }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[16px]">{session.icon}</span>
                      <span className={`text-[14px] font-bold ${isNext ? 'text-f1-red' : 'text-f1-text'}`}>{session.label}</span>
                      {isNext && <span className="text-[10px] px-1.5 py-0.5 bg-f1-red/10 text-f1-red rounded font-bold uppercase">下一场</span>}
                    </div>
                    <div className={`text-[12px] mt-1 ${isPast ? 'text-f1-text-muted/60' : 'text-f1-text-muted'}`}>
                      {formatSessionTime(session.time)}
                    </div>
                  </div>
                  {isPast && (
                    <span className="text-[11px] text-f1-cyan font-bold">已结束</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ========== 练习赛结果渲染 ==========
  const renderPractice = (sessionData, label) => {
    // 数据正在归档中（Session 刚结束，F1 服务器还在生成）
    if (sessionData === 'generating') {
      return (
        <div className="rounded-2xl p-8 border border-amber-200/60 text-center" style={{ backgroundColor: 'rgba(255,251,235,0.5)' }}>
          <div className="text-[36px] mb-4">⏳</div>
          <div className="text-[15px] font-bold text-f1-text mb-2">数据归档中</div>
          <div className="text-[13px] text-f1-text-muted leading-relaxed">
            {label}刚刚结束，F1 官方正在生成数据<br/>
            通常需要 10~30 分钟，请稍后刷新
          </div>
        </div>
      );
    }
    if (!sessionData || sessionData.length === 0) {
      if (practiceError === 'network') {
        return (
          <div className="rounded-2xl p-8 border border-white/60 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}>
            <div className="text-[36px] mb-4">📡</div>
            <div className="text-[15px] font-bold text-f1-text mb-2">网络连接异常</div>
            <div className="text-[13px] text-f1-text-muted">请稍后再试</div>
          </div>
        );
      }
      return <div className="text-center text-f1-text-muted py-12">暂无{label}数据</div>;
    }
    return (
      <div className="space-y-2">
        {sessionData.map(r => {
          let posStyle = 'text-f1-text-muted';
          if (r.position === 1) posStyle = 'text-[#A68224] font-black';
          else if (r.position <= 3) posStyle = 'text-f1-text font-bold';
          else if (r.position <= 10) posStyle = 'text-f1-cyan font-bold';

          return (
            <div
              key={r.driverNumber}
              className="flex items-center p-3.5 rounded-xl border border-white/60 transition-all hover:bg-white/30"
              style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}
            >
              <span className={`w-8 text-center text-[16px] flex-shrink-0 mr-3 ${posStyle}`}>{r.position}</span>
              <div className="w-1.5 h-8 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: r.teamColor }} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-f1-text truncate">
                  {r.firstName} <span className="uppercase">{r.lastName}</span>
                </div>
                <div className="text-[11px] text-f1-text-muted font-medium truncate mt-0.5">{r.teamName}</div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-[13px] font-medium text-f1-text">
                  {r.position === 1 ? r.bestLapFormatted : (r.gap || r.bestLapFormatted)}
                </div>
                {r.position === 1 && (
                  <div className="text-[10px] text-f1-text-muted mt-0.5">最快圈速</div>
                )}
                <div className="text-[10px] text-f1-text-muted/60 mt-0.5">{r.laps} 圈</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ========== 正赛结果渲染（保持原有逻辑） ==========
  const renderRace = () => (
    <>
      {/* 领奖台高亮 */}
      {results.length >= 3 && (
        <div className="mb-10">
          <h3 className="text-[16px] font-bold text-f1-text tracking-tight mb-6 px-1">领奖台</h3>
          <div className="grid grid-cols-3 gap-3">
            {results.slice(0, 3).map((res, idx) => {
              const colors = [
                { bg: 'rgba(210,176,86,0.15)', text: '#A68224', label: '🥇' },
                { bg: 'rgba(142,142,147,0.15)', text: '#606060', label: '🥈' },
                { bg: 'rgba(54,105,106,0.15)', text: '#36696A', label: '🥉' },
              ];
              return (
                <div 
                  key={res.Driver.driverId} 
                  className="rounded-2xl p-4 border border-white/70 text-center cursor-pointer hover:bg-white/30 transition-colors"
                  style={{ backgroundColor: colors[idx].bg }}
                  onClick={() => onDriverClick && onDriverClick(res.Driver.driverId)}
                >
                  <div className="text-[22px] mb-2">{colors[idx].label}</div>
                  <div className="text-[14px] font-bold text-f1-text truncate">{res.Driver.familyName}</div>
                  <div className="text-[11px] text-f1-text-muted font-medium mt-1 truncate">{res.Constructor.name}</div>
                  <div className="text-[13px] font-bold mt-2" style={{ color: colors[idx].text }}>
                    {idx === 0 ? res.Time?.time || 'Finished' : res.Time?.time || '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 完整排名 */}
      <div className="mb-10">
        <h3 className="text-[16px] font-bold text-f1-text tracking-tight mb-6 px-1 flex items-center">
          完整排名
          <span className="ml-3 px-2 py-0.5 rounded bg-black/[0.03] text-[11px] text-f1-text-muted tracking-widest border border-black/[0.05]">
            {results.length} 位车手
          </span>
        </h3>
        
        <div className="space-y-2">
          {results.map((res) => {
            const pos = parseInt(res.position, 10);
            const isRetired = res.status !== 'Finished' && !res.status.includes('Lap');
            const teamColor = getTeamColor(res.Constructor.constructorId);
            
            let posStyle = 'text-f1-text-muted';
            if (pos === 1) posStyle = 'text-[#A68224] font-black';
            else if (pos <= 3) posStyle = 'text-f1-text font-bold';
            else if (pos <= 10) posStyle = 'text-f1-cyan font-bold';

            return (
              <div 
                key={res.Driver.driverId} 
                className="flex items-center p-3.5 rounded-xl border border-white/60 transition-all hover:bg-white/30 cursor-pointer group"
                style={{ backgroundColor: isRetired ? 'rgba(200,50,50,0.03)' : 'rgba(255,255,255,0.35)' }}
                onClick={() => onDriverClick && onDriverClick(res.Driver.driverId)}
              >
                <span className={`w-8 text-center text-[16px] flex-shrink-0 mr-3 ${posStyle}`}>
                  {pos}
                </span>
                <div className="w-1.5 h-8 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: teamColor }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-f1-text truncate group-hover:text-f1-text/90 transition-colors">
                    {res.Driver.givenName} <span className="uppercase">{res.Driver.familyName}</span>
                  </div>
                  <div className="text-[11px] text-f1-text-muted font-medium truncate mt-0.5">
                    {res.Constructor.name}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  {isRetired ? (
                    <span className="text-[12px] text-[#C83232] font-bold">{res.status}</span>
                  ) : (
                    <>
                      <div className="text-[13px] font-medium text-f1-text-muted">
                        {pos === 1 ? (res.Time?.time || 'Finished') : (res.Time?.time ? `+${res.Time.time}` : 'Finished')}
                      </div>
                      {parseFloat(res.points) > 0 && (
                        <div className="text-[11px] font-bold text-f1-cyan mt-0.5">+{res.points} PTS</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 车队本站得分 */}
      {teamPoints.length > 0 && (
        <div className="mb-10">
          <h3 className="text-[16px] font-bold text-f1-text tracking-tight mb-6 px-1">车队本站得分</h3>
          <div className="space-y-2">
            {teamPoints.map((tp) => (
              <div key={tp.name} className="flex items-center p-3.5 rounded-xl border border-white/60" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}>
                <div className="w-2 h-2 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: tp.color }} />
                <span className="flex-1 text-[14px] font-bold text-f1-text truncate">{tp.name}</span>
                <span className="text-[16px] font-bold text-f1-text tracking-tight">{tp.points} PTS</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  // ========== 主渲染 ==========
  const hasRaceData = race || scheduleInfo;
  const displayRace = race || {};
  const displayName = displayRace.raceName || scheduleInfo?.name || '';
  const displayCircuit = circuit?.circuitName || scheduleInfo?.circuit || '';
  const displayCountry = circuit?.Location?.country || scheduleInfo?.country || '';
  const displayDate = displayRace.date || scheduleInfo?.date || '';

  return (
    <div className={`fixed inset-0 z-[100] ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      
      {/* 第一层：暗色遮罩 */}
      <div 
        className={`absolute inset-0 bg-black/40 transition-opacity duration-400 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* 第二层：毛玻璃层 */}
      <div 
        className={`absolute top-0 right-0 w-full max-w-[520px] h-full transition-opacity duration-400 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        }}
      />

      {/* 第三层：内容面板 */}
      <div 
        className={`absolute top-0 right-0 w-full max-w-[520px] h-full flex flex-col transform-gpu transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.72)',
          borderLeft: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 0 80px rgba(0,0,0,0.12)',
        }}
      >
        {hasRaceData && (
          <div className="flex flex-col h-full">
            {/* 环境光晕 */}
            <div className="absolute top-0 left-0 w-full h-[350px] pointer-events-none overflow-hidden">
               <div className="absolute -top-[100px] -right-[40px] w-[300px] h-[300px] rounded-full opacity-[0.15]" style={{ backgroundColor: '#C83232', filter: 'blur(80px)' }}></div>
               <div className="absolute -top-[60px] -left-[40px] w-[200px] h-[200px] rounded-full opacity-[0.08]" style={{ backgroundColor: '#36696A', filter: 'blur(60px)' }}></div>
            </div>

            {/* 标题栏 */}
            <div className="flex-shrink-0 flex items-center justify-between px-8 py-6 relative z-20 border-b border-black/[0.06]" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
              <div className="flex items-center space-x-3 cursor-pointer group" onClick={handleClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-black/40 group-hover:text-f1-text transition-colors"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-[14px] font-bold text-f1-text-muted tracking-tight group-hover:text-f1-text transition-colors">返回</span>
              </div>
              <div className="flex items-center gap-2">
                {isSprint && <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded font-bold">冲刺周末</span>}
                <span className="text-[11px] font-bold text-f1-text-muted uppercase tracking-[0.1em]">
                  Round {String(activeRound).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* 比赛标题区 */}
            <div className="flex-shrink-0 px-8 pt-8 pb-4 relative z-10">
              <h1 className="text-[28px] sm:text-[36px] font-black text-f1-text tracking-tighter leading-[1] mb-1 uppercase">
                {displayName}
              </h1>
              {getRaceNameCN(displayName) && (
                <div className="text-[15px] text-f1-text-muted/70 font-bold mb-3">{getRaceNameCN(displayName)}</div>
              )}
              <div className="flex flex-wrap items-center gap-3 text-[14px]">
                <span className="px-3 py-1.5 rounded-md bg-f1-red/10 text-f1-red font-bold text-[12px] tracking-wider">
                  {getCountryNameCN(displayCountry)}
                </span>
                <span className="text-f1-text-muted font-medium text-[13px]">{getCircuitNameCN(displayCircuit)}</span>
              </div>
              {displayDate && (
                <div className="text-[12px] text-f1-text-muted font-medium mt-2">
                  {new Date(displayDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              )}
            </div>

            {/* Tab 切换 */}
            <div className="flex-shrink-0 px-8 pb-2 relative z-10">
              <div className="flex gap-1 p-1 rounded-xl bg-black/[0.04] border border-black/[0.04]">
                {availableTabs.map(tab => (
                  <button
                    key={tab.key}
                    className={`flex-1 py-2 px-2 rounded-lg text-[12px] font-bold tracking-tight transition-all ${
                      activeTab === tab.key 
                        ? 'bg-white text-f1-text shadow-sm' 
                        : 'text-f1-text-muted hover:text-f1-text'
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 正文滚动区 */}
            <div className="flex-1 overflow-y-auto px-8 py-6 overscroll-contain relative z-10 custom-scrollbar">
              {/* 加载状态 */}
              {((loadingWeekend && ['qualifying', 'sprintQual', 'sprint'].includes(activeTab)) ||
                (loadingPractice && ['fp1', 'fp2', 'fp3'].includes(activeTab))) && (
                <div className="text-center text-f1-text-muted py-12">
                  <div className="inline-block w-5 h-5 border-2 border-f1-cyan/30 border-t-f1-cyan rounded-full animate-spin mb-3" />
                  <div className="text-[13px]">加载数据中...</div>
                </div>
              )}
              
              {activeTab === 'schedule' && renderSchedule()}
              {activeTab === 'fp1' && !loadingPractice && renderPractice(practiceData.fp1, 'FP1')}
              {activeTab === 'fp2' && !loadingPractice && renderPractice(practiceData.fp2, 'FP2')}
              {activeTab === 'fp3' && !loadingPractice && renderPractice(practiceData.fp3, 'FP3')}
              {activeTab === 'qualifying' && !loadingWeekend && renderQualifying()}
              {activeTab === 'sprintQual' && !loadingWeekend && renderSprintQualifying()}
              {activeTab === 'sprint' && !loadingWeekend && renderSprint()}
              {activeTab === 'race' && renderRace()}

              {/* 如果当前 tab 没有数据（比如未来比赛点了正赛 tab） */}
              {activeTab === 'race' && results.length === 0 && (
                <div className="rounded-2xl p-8 border border-white/70 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}>
                  <div className="text-[48px] mb-4">🏁</div>
                  <div className="text-[16px] font-bold text-f1-text mb-2">比赛尚未开始</div>
                  <div className="text-[13px] text-f1-text-muted">比赛结束后将在此展示完整排名</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
