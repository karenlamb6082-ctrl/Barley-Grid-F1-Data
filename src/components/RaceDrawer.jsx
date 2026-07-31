import { useState, useEffect } from 'react';
import { useDrawer } from '../hooks/useDrawer';
import { getTeamColor, fetchRaceWeekend, fetchPracticeResults, getRaceNameCN, getCountryNameCN, getCircuitNameCN, fetchHotTopics } from '../services/f1api';
import { EMPTY_STATE_MESSAGES, HISTORICAL_RACE_HOTSPOTS } from '../data/f1Fun';
import { ArrowLeft, ExternalLink } from 'lucide-react';

function DetailState({ code, title, detail }) {
  return (
    <div className="border-y border-f1-text py-7 text-left">
      <span className="race-mono text-[9px] font-black tracking-[0.16em] text-f1-red">{code}</span>
      <h3 className="mt-3 text-[21px] font-black tracking-[-0.035em]">{title}</h3>
      <p className="mt-2 max-w-[300px] text-[12px] font-semibold leading-relaxed text-f1-text-muted">{detail}</p>
    </div>
  );
}

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
  const { isOpen, activeId, handleClose, isVisible, drawerProps } = useDrawer(raceRound, onClose);
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
  availableTabs.push({ key: 'schedule', code: 'WKD', label: '时间表' });
  // 练习赛 Tab：有数据时显示，或者 session 已过但 API 受限也显示（让用户知道状态）
  const now = new Date();
  const fpSessionPast = (sessionKey) => {
    const time = scheduleInfo?.sessions?.[sessionKey];
    return time && new Date(time) < now;
  };
  if (practiceData.fp1 || (fpSessionPast('fp1') && practiceError)) availableTabs.push({ key: 'fp1', code: 'FP1', label: '一练' });
  if (practiceData.fp2 || (fpSessionPast('fp2') && practiceError)) availableTabs.push({ key: 'fp2', code: 'FP2', label: '二练' });
  if (practiceData.fp3 || (fpSessionPast('fp3') && practiceError)) availableTabs.push({ key: 'fp3', code: 'FP3', label: '三练' });
  // 冲刺周末
  if (weekendData.sprintQualifying && isSprint) availableTabs.push({ key: 'sprintQual', code: 'SQ', label: '冲刺排位' });
  if (weekendData.sprint && isSprint) availableTabs.push({ key: 'sprint', code: 'SPR', label: '冲刺赛' });
  if (weekendData.qualifying) availableTabs.push({ key: 'qualifying', code: 'Q', label: '排位赛' });
  if (results.length > 0) availableTabs.push({ key: 'race', code: 'R', label: '正赛' });
  if (results.length > 0) availableTabs.push({ key: 'hotspots', code: 'SIG', label: '热点' });

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
      <div className="border-t border-f1-text">
        {weekendData.qualifying.map(r => {
          const teamColor = getTeamColor(r.constructorId);
          let posStyle = 'text-f1-text-muted';
          if (r.position === 1) posStyle = 'text-f1-red font-black';
          else if (r.position <= 3) posStyle = 'text-f1-text font-bold';
          else if (r.position <= 10) posStyle = 'text-f1-text font-bold';

          return (
            <div 
              key={r.driverId}
              className="tap-row group flex min-h-[66px] cursor-pointer items-center border-b border-[#dedbd2] py-3 transition-colors duration-150"
              onClick={() => onDriverClick && onDriverClick(r.driverId)}
            >
              <span className={`w-8 text-center text-[16px] flex-shrink-0 mr-3 ${posStyle}`}>{r.position}</span>
              <div className="mr-3 h-8 w-1 flex-shrink-0" style={{ backgroundColor: teamColor }} />
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
      <div className="border-t border-f1-text">
        {weekendData.sprintQualifying.map(r => {
          const teamColor = getTeamColor(r.constructorId);
          let posStyle = 'text-f1-text-muted';
          if (r.position === 1) posStyle = 'text-f1-red font-black';
          else if (r.position <= 3) posStyle = 'text-f1-text font-bold';
          else if (r.position <= 8) posStyle = 'text-f1-text font-bold';

          return (
            <div 
              key={r.driverId}
              className="tap-row flex min-h-[66px] cursor-pointer items-center border-b border-[#dedbd2] py-3 transition-colors duration-150"
              onClick={() => onDriverClick && onDriverClick(r.driverId)}
            >
              <span className={`w-8 text-center text-[16px] flex-shrink-0 mr-3 ${posStyle}`}>{r.position}</span>
              <div className="mr-3 h-8 w-1 flex-shrink-0" style={{ backgroundColor: teamColor }} />
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
      <div className="border-t border-f1-text">
        {weekendData.sprint.map(r => {
          const teamColor = getTeamColor(r.constructorId);
          const isRetired = r.status !== 'Finished' && !r.status.includes('Lap');
          let posStyle = 'text-f1-text-muted';
          if (r.position === 1) posStyle = 'text-f1-red font-black';
          else if (r.position <= 3) posStyle = 'text-f1-text font-bold';
          else if (r.position <= 8) posStyle = 'text-f1-text font-bold';

          return (
            <div 
              key={r.driverId}
              className={`tap-row flex min-h-[66px] cursor-pointer items-center border-b border-[#dedbd2] py-3 transition-colors duration-150 ${isRetired ? 'text-f1-danger' : ''}`}
              onClick={() => onDriverClick && onDriverClick(r.driverId)}
            >
              <span className={`w-8 text-center text-[16px] flex-shrink-0 mr-3 ${posStyle}`}>
                {isRetired ? 'R' : r.position}
              </span>
              <div className="mr-3 h-8 w-1 flex-shrink-0" style={{ backgroundColor: teamColor }} />
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
                      <div className="mt-0.5 text-[11px] font-bold text-f1-red">+{r.points} PTS</div>
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
      if (s.fp1) sessions.push({ code: 'FP1', label: '第一节练习赛', time: s.fp1 });
      if (s.sprintQualifying) sessions.push({ code: 'SQ', label: '冲刺排位赛', time: s.sprintQualifying });
      if (s.sprint) sessions.push({ code: 'SPRINT', label: '冲刺赛', time: s.sprint });
      if (s.qualifying) sessions.push({ code: 'Q', label: '排位赛', time: s.qualifying });
      if (s.race) sessions.push({ code: 'RACE', label: '正赛', time: s.race });
    } else {
      // 常规周末：FP1 → FP2 → FP3 → 排位赛 → 正赛
      if (s.fp1) sessions.push({ code: 'FP1', label: '第一节练习赛', time: s.fp1 });
      if (s.fp2) sessions.push({ code: 'FP2', label: '第二节练习赛', time: s.fp2 });
      if (s.fp3) sessions.push({ code: 'FP3', label: '第三节练习赛', time: s.fp3 });
      if (s.qualifying) sessions.push({ code: 'Q', label: '排位赛', time: s.qualifying });
      if (s.race) sessions.push({ code: 'RACE', label: '正赛', time: s.race });
    }

    const now = new Date();

    return (
      <div className="relative pl-5">
        <div className="absolute bottom-0 left-[7px] top-0 w-px bg-f1-text" />
        
        <div className="space-y-0">
          {sessions.map((session, idx) => {
            const sessionDate = new Date(session.time);
            const isPast = sessionDate < now;
            const isNext = !isPast && (idx === 0 || new Date(sessions[idx - 1]?.time) < now);
            
            return (
              <div key={session.label} className="relative grid min-h-[74px] grid-cols-[64px_1fr_auto] items-center gap-3 border-b border-[#dedbd2] py-3">
                <div className={`absolute -left-[17px] h-2 w-2 rounded-full border border-f1-text ${isNext ? 'bg-f1-lime' : 'bg-f1-bg'}`} />
                <div><span className={`race-mono text-[18px] font-black ${isNext ? 'text-f1-red' : ''}`}>{session.code}</span>{isNext && <span className="race-mono mt-1 block text-[8px] font-black tracking-[0.12em]">NEXT</span>}</div>
                <div><span className="text-[13px] font-extrabold">{session.label}</span><span className="mt-1 block text-[9px] font-semibold text-f1-text-muted">{formatSessionTime(session.time)}</span></div>
                <span className="race-mono text-[8px] font-bold tracking-[0.1em] text-f1-text-muted">{isPast ? 'DONE' : isNext ? 'NEXT' : 'TBC'}</span>
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
        <DetailState code={`${label} / PROCESSING`} title="数据归档中" detail={`${label} 刚刚结束，官方数据通常需要 10–30 分钟完成归档。`} />
      );
    }
    if (!sessionData || sessionData.length === 0) {
      if (practiceError === 'network') {
        return (
          <DetailState code="OFFLINE / 00" title="数据链路中断" detail="无法读取本节练习赛结果，请检查网络连接后重试。" />
        );
      }
      return <div className="text-center text-f1-text-muted py-12">{EMPTY_STATE_MESSAGES.practice}</div>;
    }
    return (
      <div className="border-t border-f1-text">
        {sessionData.map(r => {
          let posStyle = 'text-f1-text-muted';
          if (r.position === 1) posStyle = 'text-f1-red font-black';
          else if (r.position <= 3) posStyle = 'text-f1-text font-bold';
          else if (r.position <= 10) posStyle = 'text-f1-text font-bold';

          return (
            <div
              key={r.driverNumber}
              className="flex min-h-[66px] items-center border-b border-[#dedbd2] py-3 transition-colors duration-150"
            >
              <span className={`w-8 text-center text-[16px] flex-shrink-0 mr-3 ${posStyle}`}>{r.position}</span>
              <div className="mr-3 h-8 w-1 flex-shrink-0" style={{ backgroundColor: r.teamColor }} />
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
        <DetailState code="RACE / UPCOMING" title="比赛尚未开始" detail="正赛结束并完成官方确认后，此处将展示完整排名与状态。" />
      );
    }
    return (
      <>
        {results.length >= 3 && (
          <div className="mb-7">
            <div className="mb-3 flex items-end justify-between border-b border-f1-text pb-2"><h3 className="text-[16px] font-black tracking-[-0.03em]">领奖台</h3><span className="race-mono text-[8px] font-bold tracking-[0.14em] text-f1-text-muted">PODIUM</span></div>
            <div className="overflow-hidden rounded-[16px] border border-f1-text bg-f1-card">
              {results.slice(0, 3).map((res, idx) => {
                const teamColor = getTeamColor(res.Constructor.constructorId);
                return (
                  <button type="button"
                    key={res.Driver.driverId} 
                    className={`tap-row grid min-h-[68px] w-full grid-cols-[42px_4px_1fr_auto] items-center gap-3 border-b border-[#dedbd2] px-4 py-3 text-left last:border-b-0 ${idx === 0 ? 'bg-f1-text text-white' : ''}`}
                    onClick={() => onDriverClick && onDriverClick(res.Driver.driverId)}
                  >
                    <span className={`race-mono text-[25px] font-black ${idx === 0 ? 'text-f1-lime' : 'text-[#aaa79f]'}`}>0{idx + 1}</span>
                    <span className="h-8" style={{ backgroundColor: teamColor }} />
                    <span className="min-w-0"><strong className="block truncate text-[14px] font-black">{res.Driver.givenName} {res.Driver.familyName}</strong><small className={`race-mono mt-1 block truncate text-[8px] font-bold tracking-[0.08em] ${idx === 0 ? 'text-white/55' : 'text-f1-text-muted'}`}>{res.Constructor.name}</small></span>
                    <span className="race-mono text-[10px] font-bold">{res.Time?.time || res.status || 'FINISHED'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-10">
          <div className="mb-1 grid grid-cols-[34px_4px_1fr_auto] gap-3 border-b border-f1-text pb-2 text-[8px] font-extrabold tracking-[0.12em] text-f1-text-muted"><span>POS</span><span /><span>DRIVER / TEAM</span><span>RESULT</span></div>
          <div>
            {results.map((res) => {
              const pos = parseInt(res.position, 10);
              const isRetired = res.status !== 'Finished' && !res.status?.includes('Lap');
              const teamColor = getTeamColor(res.Constructor.constructorId);
              
              let posStyle = 'text-f1-text-muted';
              if (pos === 1) posStyle = 'text-f1-red font-black';
              else if (pos <= 3) posStyle = 'text-f1-text font-bold';
              else if (pos <= 10) posStyle = 'text-f1-text font-bold';

              return (
                <button type="button"
                  key={res.Driver.driverId} 
                  className={`tap-row grid min-h-[62px] w-full grid-cols-[34px_4px_1fr_auto] items-center gap-3 border-b border-[#dedbd2] py-2.5 text-left ${isRetired ? 'text-f1-danger' : ''}`}
                  onClick={() => onDriverClick && onDriverClick(res.Driver.driverId)}
                >
                  <span className={`race-mono text-[17px] font-black ${posStyle}`}>{pos}</span>
                  <span className="h-7" style={{ backgroundColor: teamColor }} />
                  <span className="min-w-0"><strong className="block truncate text-[13px] font-extrabold text-f1-text">{res.Driver.givenName} {res.Driver.familyName}</strong><small className="race-mono mt-0.5 block truncate text-[8px] font-bold tracking-[0.06em] text-f1-text-muted">{res.Constructor.name}</small></span>
                  <span className="text-right">
                    {isRetired ? (
                      <span className="text-[12px] text-f1-danger font-bold">{res.status}</span>
                    ) : (
                      <>
                        <div className="text-[13px] font-medium text-f1-text-muted">
                          {pos === 1 ? (res.Time?.time || 'Finished') : (res.Time?.time ? `+${res.Time.time}` : 'Finished')}
                        </div>
                        {parseFloat(res.points) > 0 && (
                          <div className="mt-0.5 text-[11px] font-bold text-f1-red">+{res.points} PTS</div>
                        )}
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 车队本站得分 */}
        {teamPoints.length > 0 && (
          <div className="mb-10">
            <h3 className="text-[16px] font-bold text-f1-text tracking-tight mb-6 px-1">车队本站得分</h3>
            <div className="border-t border-f1-text">
              {teamPoints.map((tp) => (
                <div key={tp.name} className="flex min-h-[58px] items-center border-b border-[#dedbd2] py-3">
                  <div className="mr-3 h-7 w-1 flex-shrink-0" style={{ backgroundColor: tp.color }} />
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
        <DetailState code="SIGNAL / 00" title="暂无热议事件" detail="当前分站尚未形成稳定的围场讨论焦点，赛期通常会更加活跃。" />
      );
    }

    return (
      <div>
        <div className="flex justify-between border-b border-f1-text pb-2 text-[9px] font-black tracking-[0.12em] text-f1-text-muted">
          <span>PADDOCK SIGNALS</span>
          <span>{String(hotspots.length).padStart(2, '0')} EVENTS</span>
        </div>
        {hotspots.map((event, idx) => {
          const eventUniqueId = event.id || event.title || String(idx);
          return (
            <HotspotCard key={eventUniqueId} event={event} rank={idx + 1} />
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
        className={`absolute inset-0 bg-black/36 transition-opacity duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* 第三层：内容面板 */}
      <div 
        {...drawerProps}
        role="dialog"
        aria-modal="true"
        aria-label="比赛详情"
        className={`detail-drawer absolute top-0 right-0 h-full flex flex-col transform-gpu transition-transform duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} bg-f1-bg border-l border-f1-text`}
      >
        {hasRaceData && (
          <div className="flex flex-col h-full">
            {/* 标题栏 */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 pb-3 pt-[calc(var(--app-safe-top)+14px)] relative z-20">
              <button type="button" className="pressable flex h-9 w-9 items-center justify-center rounded-[10px] border border-f1-text" onClick={handleClose} aria-label="返回"><ArrowLeft size={17} /></button>
              <div className="flex items-center gap-2">
                {isSprint && <span className="race-mono border-l-2 border-f1-red pl-2 text-[8px] font-black tracking-[0.1em]">SPRINT</span>}
                <span className="race-mono text-[9px] font-extrabold text-f1-text-muted uppercase tracking-[0.14em]">
                  Round {String(activeId).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* 比赛标题区 */}
            <div className="flex-shrink-0 px-5 pt-5 pb-4 relative z-10">
              <h1 className="text-[32px] sm:text-[40px] font-black text-f1-text tracking-[-0.055em] leading-[1] mb-1">
                {getCountryNameCN(displayCountry) ? `${getCountryNameCN(displayCountry)}站` : (getRaceNameCN(displayName) || displayName)}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-[14px]">
                <span className="text-f1-text-muted font-medium text-[13px]">{getCircuitNameCN(displayCircuit)}</span>
              </div>
              {displayDate && (
                <div className="text-[12px] text-f1-text-muted font-medium mt-2">
                  {new Date(displayDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              )}
            </div>

            {/* Tab 切换 */}
            <div className="flex-shrink-0 px-5 pb-2 relative z-10">
              <div className="flex gap-0 overflow-x-auto border-b border-f1-text no-scrollbar">
                {availableTabs.map(tab => (
                  <button
                    key={tab.key}
                    className={`relative min-w-[68px] flex-1 whitespace-nowrap px-2 pb-3 pt-2 text-left transition-colors duration-150 ${
                      activeTab === tab.key 
                        ? 'text-f1-text after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-f1-red'
                        : 'text-f1-text-muted hover:text-f1-text'
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <span className="race-mono block text-[12px] font-black tracking-[0.08em]">{tab.code}</span>
                    <span className="mt-0.5 block text-[8px] font-bold text-f1-text-muted">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 正文滚动区 */}
            <div className="flex-1 overflow-y-auto px-5 py-5 pb-[calc(var(--app-safe-bottom)+24px)] overscroll-contain relative z-10 custom-scrollbar">
              {/* 加载状态 */}
              {((loadingWeekend && ['qualifying', 'sprintQual', 'sprint'].includes(activeTab)) ||
                (loadingPractice && ['fp1', 'fp2', 'fp3'].includes(activeTab))) && (
                <div className="text-center text-f1-text-muted py-12">
                  <div className="mb-3 inline-block h-5 w-5 animate-spin rounded-full border-2 border-f1-red/25 border-t-f1-red" />
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
function HotspotCard({ event, rank }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dims = event.dimensions || { technicalDepth: 5, breakingValue: 5, audienceValue: 5, dramaIndex: 5, truthfulness: 5 };
  const metrics = [
    ['TECH', dims.technicalDepth],
    ['BREAK', dims.breakingValue],
    ['REACH', dims.audienceValue],
    ['DRAMA', dims.dramaIndex],
    ['TRUST', dims.truthfulness],
  ];
  return (
    <article className="border-b border-[#dedbd2] py-4 text-left animate-in fade-in">
      <div className="grid grid-cols-[38px_1fr] gap-3">
        <span className="race-mono text-[23px] font-black leading-none text-[#aaa79f]">{String(rank).padStart(2, "0")}</span>
        <div>
          <div className="race-mono flex items-center gap-2 text-[8px] font-black tracking-[0.12em] text-f1-text-muted">
            <span className="text-f1-red">QS {event.qualityScore}</span>
            {event.badge && <span>{event.badge}</span>}
            {event.ageMinutes && <span>{formatTimeAgo(event.ageMinutes)}</span>}
          </div>
          <h4 className="mt-2 text-[14px] font-black leading-snug text-f1-text">
          {event.titleCN || event.title}
          </h4>
          <p className="race-mono mt-2 text-[8px] font-bold tracking-[0.08em] text-f1-text-muted">{event.sourceCount || 0} SOURCES / {event.itemCount || 0} REPORTS</p>
        </div>
      </div>
      <div className="ml-[50px] mt-3 border-t border-[#dedbd2] pt-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="pressable race-mono flex w-fit items-center gap-2 py-1 text-left text-[9px] font-black tracking-[0.1em] text-f1-text-muted hover:text-f1-red"
        >
          <span className={`inline-block transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>↓</span>
          {isExpanded ? "COLLAPSE" : "DETAILS"} / {event.relatedItems?.length || 0}
        </button>

        {isExpanded && (
          <div className="mt-3 animate-in fade-in">
            <div className="grid grid-cols-5 border-y border-f1-text">
              {metrics.map(([label, value]) => (
                <div key={label} className="border-r border-[#dedbd2] py-2 text-center last:border-r-0">
                  <span className="race-mono block text-[13px] font-black">{value}</span>
                  <span className="race-mono mt-0.5 block text-[6px] font-bold tracking-[0.08em] text-f1-text-muted">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="race-mono mb-1 text-[8px] font-black tracking-[0.12em] text-f1-text-muted">SOURCE MATERIAL</div>
              {event.relatedItems?.map((item, i) => (
                <a
                  key={item.url || i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 border-b border-[#dedbd2] py-2.5 text-[11px]"
                >
                  <div className="min-w-0 flex-1 space-y-0.5 text-left">
                    <div className="truncate font-bold leading-snug text-f1-text transition-colors duration-150 group-hover:text-f1-red">
                      {item.title}
                    </div>
                    <div className="race-mono text-[8px] font-bold uppercase text-f1-text-muted">{item.source}</div>
                  </div>
                  <ExternalLink size={10} className="text-f1-text-muted/40 group-hover:text-f1-red transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
