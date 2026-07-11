import { useState, useEffect } from 'react';
import { useDrawer } from '../hooks/useDrawer';
import { getTeamColor, fetchRaceWeekend, fetchPracticeResults, getRaceNameCN, getCountryNameCN, getCircuitNameCN, fetchHotTopics } from '../services/f1api';
import { EMPTY_STATE_MESSAGES, HISTORICAL_RACE_HOTSPOTS } from '../data/f1Fun';
import { TrendingUp, Heart, Star, ExternalLink } from 'lucide-react';

// 过滤与当前分站相关的实时热点
function filterRealtimeHotspots(topics, raceName, country) {
  if (!topics || topics.length === 0) return [];
  const keywords = [];
  if (raceName) {
    const cleanName = raceName.replace(' Grand Prix', '');
    keywords.push(cleanName.toLowerCase());
  }
  if (country) {
    keywords.push(country.toLowerCase());
  }
  const raceCN = getRaceNameCN(raceName);
  if (raceCN) {
    const cleanCN = raceCN.replace('大奖赛', '');
    keywords.push(cleanCN);
  }
  const countryCN = getCountryNameCN(country);
  if (countryCN) {
    keywords.push(countryCN);
  }

  return topics.filter(topic => {
    const text = ((topic.titleCN || '') + ' ' + (topic.title || '')).toLowerCase();
    return keywords.some(kw => text && kw && text.includes(kw));
  });
}

function formatTimeAgo(minutes) {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes}分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
  return `${Math.floor(minutes / 1440)}天前`;
}

export default function RaceDrawer({ raceRound, data, onClose, onDriverClick }) {
  const { isOpen, activeId, handleClose, isVisible } = useDrawer(raceRound, onClose);
  const [activeTab, setActiveTab] = useState('schedule');
  const [weekendData, setWeekendData] = useState({ qualifying: null, sprint: null, sprintQualifying: null });
  const [loadingWeekend, setLoadingWeekend] = useState(true);
  const [practiceData, setPracticeData] = useState({ fp1: null, fp2: null, fp3: null });
  const [practiceError, setPracticeError] = useState(null);
  const [loadingPractice, setLoadingPractice] = useState(true);

  // 围场热点状态
  const [hotspots, setHotspots] = useState([]);
  const [loadingHotspots, setLoadingHotspots] = useState(false);

  // 收藏与点赞状态 (保存在 LocalStorage)
  const [collectedIds, setCollectedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("f1hot:collected") || "[]"));
    } catch { return new Set(); }
  });
  const [likedIds, setLikedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("f1hot:liked") || "[]"));
    } catch { return new Set(); }
  });
  const toggleCollect = (id) => {
    const next = new Set(collectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollectedIds(next);
    localStorage.setItem("f1hot:collected", JSON.stringify([...next]));
  };

  const toggleLike = (id) => {
    const next = new Set(likedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setLikedIds(next);
    localStorage.setItem("f1hot:liked", JSON.stringify([...next]));
  };

  // 从 allRaces 获取完整比赛数据
  const race = data?.allRaces?.find(r => r.round === String(activeId));
  
  // 从 schedule 获取赛程信息
  const scheduleInfo = data?.schedule?.find(s => String(s.round) === String(activeId));

  const results = race?.Results || [];
  const circuit = race?.Circuit;
  const isSprint = scheduleInfo?.isSprint;

  const displayRace = race || {};
  const displayName = displayRace.raceName || scheduleInfo?.name || '';
  const displayCircuit = circuit?.circuitName || scheduleInfo?.circuit || '';
  const displayCountry = circuit?.Location?.country || scheduleInfo?.country || '';
  const displayDate = displayRace.date || scheduleInfo?.date || '';

  useEffect(() => {
    if (raceRound) {
      // 智能默认 tab：有正赛结果的显示正赛，否则显示时间表
      const race = data?.allRaces?.find(r => r.round === String(raceRound));
      const hasResults = race && race.Results && race.Results.length > 0;
      setActiveTab(hasResults ? 'race' : 'schedule');
    }
  }, [raceRound, data?.allRaces]);

  // 打开 Drawer 时按需加载排位赛和冲刺赛数据
  useEffect(() => {
    if (!activeId) return;
    let isMounted = true;

    setWeekendData({ qualifying: null, sprint: null, sprintQualifying: null });
    setLoadingWeekend(true);
    setPracticeData({ fp1: null, fp2: null, fp3: null });
    setPracticeError(null);
    setLoadingPractice(true);

    fetchRaceWeekend(activeId).then(d => {
      if (!isMounted) return;
      setWeekendData(d);
      setLoadingWeekend(false);
    }).catch(() => {
      if (!isMounted) return;
      setLoadingWeekend(false);
    });
    // 并行加载练习赛数据
    fetchPracticeResults(activeId, data?.schedule).then(d => {
      if (!isMounted) return;
      setPracticeData({ fp1: d.fp1, fp2: d.fp2, fp3: d.fp3 });
      setPracticeError(d.error || null);
      setLoadingPractice(false);
    }).catch(() => {
      if (!isMounted) return;
      setPracticeError('network');
      setLoadingPractice(false);
    });

    return () => {
      isMounted = false;
    };
  }, [activeId, data?.schedule]);

  // 加载并过滤分站热点数据
  useEffect(() => {
    if (!activeId) return;
    const hasResults = results.length > 0;
    if (!hasResults) {
      setHotspots([]);
      return;
    }

    let isMounted = true;
    setLoadingHotspots(true);

    fetchHotTopics().then(res => {
      if (!isMounted) return;
      const realtopics = res?.topics || [];
      const lowtopics = res?.lowScoreTopics || [];
      const allCloudTopics = [...realtopics, ...lowtopics];

      // 实时过滤
      const filteredRealtime = filterRealtimeHotspots(allCloudTopics, displayName, displayCountry);

      // 历史 Mock
      const mockList = HISTORICAL_RACE_HOTSPOTS[String(activeId)] || [];

      // 合并与去重
      const merged = [...filteredRealtime];
      mockList.forEach(m => {
        if (!merged.some(item => item.id === m.id)) {
          merged.push(m);
        }
      });

      setHotspots(merged.sort((a, b) => b.qualityScore - a.qualityScore));
      setLoadingHotspots(false);
    }).catch(() => {
      if (!isMounted) return;
      // 降级只使用 Mock 数据
      const mockList = HISTORICAL_RACE_HOTSPOTS[String(activeId)] || [];
      setHotspots(mockList.sort((a, b) => b.qualityScore - a.qualityScore));
      setLoadingHotspots(false);
    });

    return () => {
      isMounted = false;
    };
  }, [activeId, results.length, displayName, displayCountry]);

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
  if (results.length > 0) availableTabs.push({ key: 'hotspots', label: '围场热点' });

  // 时间格式化
  const formatSessionTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!data) return null;

  // ========== 排位赛结果渲染 ==========
  const renderQualifying = () => {
    if (!weekendData.qualifying) return <div className="text-center text-f1-text-muted py-12">{EMPTY_STATE_MESSAGES.qualifying}</div>;
    return (
      <div className="space-y-2">
        {weekendData.qualifying.map(r => {
          const teamColor = getTeamColor(r.constructorId);
          let posStyle = 'text-f1-text-muted';
          if (r.position === 1) posStyle = 'text-f1-gold/90 font-black';
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
    if (!weekendData.sprintQualifying) return <div className="text-center text-f1-text-muted py-12">{EMPTY_STATE_MESSAGES.sprintQualifying}</div>;
    return (
      <div className="space-y-2">
        {weekendData.sprintQualifying.map(r => {
          const teamColor = getTeamColor(r.constructorId);
          let posStyle = 'text-f1-text-muted';
          if (r.position === 1) posStyle = 'text-f1-gold/90 font-black';
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
    if (!weekendData.sprint) return <div className="text-center text-f1-text-muted py-12">{EMPTY_STATE_MESSAGES.sprint}</div>;
    return (
      <div className="space-y-2">
        {weekendData.sprint.map(r => {
          const teamColor = getTeamColor(r.constructorId);
          const isRetired = r.status !== 'Finished' && !r.status.includes('Lap');
          let posStyle = 'text-f1-text-muted';
          if (r.position === 1) posStyle = 'text-f1-gold/90 font-black';
          else if (r.position <= 3) posStyle = 'text-f1-text font-bold';
          else if (r.position <= 8) posStyle = 'text-f1-cyan font-bold';

          return (
            <div 
              key={r.driverId}
              className={`flex items-center p-3.5 rounded-xl border border-white/60 transition-all hover:bg-white/30 cursor-pointer ${isRetired ? 'bg-f1-danger/[0.04]' : 'bg-white/35'}`}
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
                  <span className="text-[12px] text-f1-danger font-bold">{r.status}</span>
                ) : (
                  <>
                     <div className="text-[13px] font-medium text-f1-text-muted">
                      {r.position === 1 ? r.time : (r.time || '—')}
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
            <div className="text-[15px] font-bold text-f1-text mb-2">无线电故障！</div>
            <div className="text-[13px] text-f1-text-muted">请检查你的网络连接</div>
          </div>
        );
      }
      return <div className="text-center text-f1-text-muted py-12">{EMPTY_STATE_MESSAGES.practice}</div>;
    }
    return (
      <div className="space-y-2">
        {sessionData.map(r => {
          let posStyle = 'text-f1-text-muted';
          if (r.position === 1) posStyle = 'text-f1-gold/90 font-black';
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
  const renderRace = () => {
    if (results.length === 0) {
      return (
        <div className="rounded-2xl p-8 border border-white/70 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}>
          <div className="text-[48px] mb-4">🏁</div>
          <div className="text-[16px] font-bold text-f1-text mb-2">比赛尚未开始</div>
          <div className="text-[13px] text-f1-text-muted">比赛结束后将在此展示完整排名</div>
        </div>
      );
    }
    return (
      <>
        {/* 领奖台高亮 */}
        {results.length >= 3 && (
          <div className="mb-10">
            <h3 className="text-[16px] font-bold text-f1-text tracking-tight mb-6 px-1">领奖台</h3>
            <div className="grid grid-cols-3 gap-3">
              {results.slice(0, 3).map((res, idx) => {
                const colors = [
                  { bg: 'bg-f1-gold/15', text: 'text-f1-gold/90', label: '🥇' },
                  { bg: 'bg-f1-silver/15', text: 'text-f1-silver/90', label: '🥈' },
                  { bg: 'bg-f1-darkcyan/15', text: 'text-f1-cyan', label: '🥉' },
                ];
                return (
                  <div 
                    key={res.Driver.driverId} 
                    className={`rounded-2xl p-4 border border-white/77 text-center cursor-pointer hover:bg-white/30 transition-colors ${colors[idx].bg}`}
                    onClick={() => onDriverClick && onDriverClick(res.Driver.driverId)}
                  >
                    <div className="text-[22px] mb-2">{colors[idx].label}</div>
                    <div className="text-[14px] font-bold text-f1-text truncate">{res.Driver.familyName}</div>
                    <div className="text-[11px] text-f1-text-muted font-medium mt-1 truncate">{res.Constructor.name}</div>
                    <div className={`text-[13px] font-bold mt-2 ${colors[idx].text}`}>
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
              const isRetired = res.status !== 'Finished' && !res.status?.includes('Lap');
              const teamColor = getTeamColor(res.Constructor.constructorId);
              
              let posStyle = 'text-f1-text-muted';
              if (pos === 1) posStyle = 'text-f1-gold/90 font-black';
              else if (pos <= 3) posStyle = 'text-f1-text font-bold';
              else if (pos <= 10) posStyle = 'text-f1-cyan font-bold';

              return (
                <div 
                  key={res.Driver.driverId} 
                  className={`flex items-center p-3.5 rounded-xl border border-white/60 transition-all hover:bg-white/30 cursor-pointer group ${isRetired ? 'bg-f1-danger/[0.04]' : 'bg-white/35'}`}
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
                      <span className="text-[12px] text-f1-danger font-bold">{res.status}</span>
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
  };

  // ========== 围场热点渲染 ==========
  const renderHotspots = () => {
    if (loadingHotspots) {
      return (
        <div className="text-center text-f1-text-muted py-12">
          <div className="inline-block w-5 h-5 border-2 border-f1-red/30 border-t-f1-red rounded-full animate-spin mb-3" />
          <div className="text-[13px] font-bold">正在同步围场 AI 信号源...</div>
        </div>
      );
    }

    if (hotspots.length === 0) {
      return (
        <div className="rounded-2xl p-8 border border-white/70 text-center bg-white/35">
          <span className="text-[36px] mb-2 block">📡</span>
          <div className="text-[15px] font-bold text-f1-text mb-2">暂无热议事件</div>
          <div className="text-[13px] text-f1-text-muted leading-relaxed">
            当前分站没有检测到聚类的讨论焦点，赛期通常会更加活跃
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="px-1 text-[11px] font-bold text-f1-text-muted tracking-wide flex justify-between">
          <span>📡 围场 AI 引擎同步聚类出以下热议焦点：</span>
          <span>{hotspots.length} 个事件</span>
        </div>
        {hotspots.map((event, idx) => {
          const eventUniqueId = event.id || event.title || String(idx);
          return (
            <HotspotCard
              key={eventUniqueId}
              event={event}
              rank={idx + 1}
              isCollected={collectedIds.has(eventUniqueId)}
              isLiked={likedIds.has(eventUniqueId)}
              onCollect={() => toggleCollect(eventUniqueId)}
              onLike={() => toggleLike(eventUniqueId)}
            />
          );
        })}
      </div>
    );
  };

  const hasRaceData = race || scheduleInfo;

  return (
    <div className={`fixed inset-0 z-[100] ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      
      {/* 第一层：暗色遮罩 */}
      <div 
        className={`absolute inset-0 bg-black/36 transition-opacity duration-300 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* 第二层：毛玻璃层 */}
      <div 
        className={`absolute top-0 right-0 w-full max-w-[520px] h-full transition-opacity duration-300 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          backdropFilter: 'blur(14px) saturate(135%)',
          WebkitBackdropFilter: 'blur(14px) saturate(135%)',
        }}
      />

      {/* 第三层：内容面板 */}
      <div 
        className={`absolute top-0 right-0 w-full max-w-[520px] h-full flex flex-col transform-gpu transition-transform duration-300 ease-out will-change-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} bg-white/88 border-l border-white/50 shadow-[0_0_36px_rgba(0,0,0,0.10)]`}
      >
        {hasRaceData && (
          <div className="flex flex-col h-full">
            {/* 环境光晕 */}
            <div className="absolute top-0 left-0 w-full h-[350px] pointer-events-none overflow-hidden">
               <div className="absolute -top-[100px] -right-[40px] w-[300px] h-[300px] rounded-full opacity-[0.15] bg-f1-danger filter blur-[80px]"></div>
               <div className="absolute -top-[60px] -left-[40px] w-[200px] h-[200px] rounded-full opacity-[0.08] bg-f1-darkcyan filter blur-[60px]"></div>
            </div>

            {/* 标题栏 */}
            <div className="flex-shrink-0 flex items-center justify-between px-8 py-6 relative z-20 border-b border-black/[0.06] bg-white/50">
              <div className="flex items-center space-x-3 cursor-pointer group" onClick={handleClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-black/40 group-hover:text-f1-text transition-colors"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-[14px] font-bold text-f1-text-muted tracking-tight group-hover:text-f1-text transition-colors">返回</span>
              </div>
              <div className="flex items-center gap-2">
                {isSprint && <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded font-bold">冲刺周末</span>}
                <span className="text-[11px] font-bold text-f1-text-muted uppercase tracking-[0.1em]">
                  Round {String(activeId).padStart(2, '0')}
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
              <div className="flex gap-1 p-1 rounded-xl bg-black/[0.04] border border-black/[0.04] overflow-x-auto no-scrollbar">
                {availableTabs.map(tab => (
                  <button
                    key={tab.key}
                    className={`flex-1 py-2 px-2 rounded-lg text-[12px] font-bold tracking-tight transition-all whitespace-nowrap ${
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
              {activeTab === 'hotspots' && renderHotspots()}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== 单个已完赛分站热点卡片组件 ====================
function HotspotCard({ event, rank, isCollected, isLiked, onCollect, onLike }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dims = event.dimensions || { technicalDepth: 5, breakingValue: 5, audienceValue: 5, dramaIndex: 5, truthfulness: 5 };
  return (
    <div className="rounded-2xl p-4 relative transition-all duration-300 overflow-hidden text-left bg-white/45 border border-white/80 hover:bg-white/60 shadow-sm animate-in fade-in">
      {/* 侧面标志色 */}
      <div className={`absolute top-0 left-0 w-1 h-full ${
        event.tier === "T1" ? "bg-f1-gold" : event.tier === "T1.5" ? "bg-f1-cyan" : "bg-f1-silver"
      }`} />

      {/* 第一行：序号、QS、Badge 和点赞收藏 */}
      <div className="flex justify-between items-start gap-4 pl-1.5 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[16px] leading-none text-black/15 tabular-nums">
            {String(rank).padStart(2, "0")}
          </span>
          <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black border flex items-center gap-1 shadow-sm ${
            event.qualityScore >= 80
              ? "text-f1-gold border-f1-gold/25 bg-f1-gold/5"
              : "text-f1-cyan border-f1-cyan/25 bg-f1-cyan/5"
          }`}>
            <TrendingUp size={9} />
            QS {event.qualityScore}
          </div>
          {event.badge && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
              event.badge === "官方重磅"
                ? "text-f1-red border-f1-red/20 bg-f1-red/5"
                : event.badge === "深度技术"
                  ? "text-f1-darkcyan border-f1-darkcyan/20 bg-f1-darkcyan/5"
                  : event.badge === "突发焦点"
                    ? "text-orange-600 border-orange-500/20 bg-orange-50"
                    : "text-f1-text-muted border-black/5 bg-black/[0.01]"
            }`}>
              {event.badge}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-0.5">
          <button 
            onClick={onLike}
            className={`p-1 rounded-lg hover:bg-black/[0.04] transition-colors ${
              isLiked ? "text-f1-red" : "text-f1-text-muted/30"
            }`}
          >
            <Heart size={12} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={onCollect}
            className={`p-1 rounded-lg hover:bg-black/[0.04] transition-colors ${
              isCollected ? "text-f1-gold" : "text-f1-text-muted/30"
            }`}
          >
            <Star size={12} fill={isCollected ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* 第二行：标题与译文 */}
      <div className="pl-1.5">
        <h4 className="text-[13.5px] sm:text-[14px] font-black text-f1-text leading-snug">
          {event.titleCN || event.title}
        </h4>
        {event.titleCN && (
          <p className="mt-1 text-[11px] text-f1-text-muted/60 italic leading-relaxed">
            🇬🇧 EN: {event.title}
          </p>
        )}
        <div className="mt-2.5 flex items-center gap-2 text-[10px] font-bold text-f1-text-muted">
          <span className="text-f1-red">🔥🔥 {event.sourceCount} 源 · {event.itemCount} 报道</span>
          {event.ageMinutes && (
            <>
              <span>·</span>
              <span>{formatTimeAgo(event.ageMinutes)}</span>
            </>
          )}
        </div>
      </div>

      {/* 折叠详情 */}
      <div className="mt-2.5 border-t border-black/[0.04] pt-2 pl-1.5 flex flex-col gap-1.5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-[10.5px] font-bold text-f1-text-muted hover:text-f1-red transition-colors py-0.5 px-1 -ml-1 text-left w-fit"
        >
          <span className={`inline-block transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>▼</span>
          {isExpanded ? "收起" : "展开"} 维度评分与报道原文 ({event.relatedItems?.length || 0}篇)
        </button>

        {isExpanded && (
          <div className="mt-1 space-y-3.5 animate-in fade-in duration-300">
            {/* 5 维度 */}
            <div className="rounded-xl border border-black/[0.03] bg-black/[0.01] p-2.5 space-y-1.5 max-w-[260px]">
              {[
                { label: "🔧 技术深度", val: dims.technicalDepth, max: 10, color: "bg-f1-cyan" },
                { label: "⚡ 突发大料", val: dims.breakingValue, max: 10, color: "bg-f1-red" },
                { label: "🔥 受众吸引", val: dims.audienceValue, max: 10, color: "bg-amber-500" },
                { label: "💬 戏剧冲突", val: dims.dramaIndex, max: 10, color: "bg-purple-500" },
                { label: "🤝 权威可信", val: dims.truthfulness, max: 10, color: "bg-emerald-500" }
              ].map(bar => (
                <div key={bar.label} className="grid grid-cols-[64px_1fr_12px] items-center gap-1.5 text-[9px] font-bold">
                  <span className="text-f1-text-muted">{bar.label}</span>
                  <div className="h-1 rounded-full bg-black/5 overflow-hidden">
                    <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${(bar.val / bar.max) * 100}%` }} />
                  </div>
                  <span className="text-right font-mono">{bar.val}</span>
                </div>
              ))}
            </div>

            {/* 原文链接 */}
            <div className="space-y-1 border-t border-black/[0.04] pt-2">
              <div className="text-[9px] font-black text-f1-text-muted uppercase tracking-wider mb-1">📰 聚类合并的同题材报道列表 (点击跳转)：</div>
              {event.relatedItems?.map((item, i) => (
                <a
                  key={item.url || i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 p-1.5 rounded-lg hover:bg-black/[0.03] transition-colors group text-[11px]"
                >
                  <div className="min-w-0 flex-1 space-y-0.5 text-left">
                    <div className="font-bold text-f1-text group-hover:text-f1-red transition-all truncate leading-snug">
                      {item.title}
                    </div>
                    <div className="text-[9px] font-bold text-f1-text-muted">
                      <span className="text-f1-cyan uppercase">{item.source}</span>
                    </div>
                  </div>
                  <ExternalLink size={10} className="text-f1-text-muted/40 group-hover:text-f1-red transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
