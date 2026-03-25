import { useState, useEffect } from 'react';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import { getDriverImage, getTeamAbbr, getRaceNameCN } from '../services/f1api';

export default function TeamDrawer({ teamId, data, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  
  useEffect(() => {
    if (teamId) {
      setActiveId(teamId);
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
        setActiveId(null);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [teamId]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 450); 
  };

  const isVisible = isOpen || activeId;
  const team = data?.teamStandings?.find(t => t.id === activeId);
  
  // 该车队旗下车手
  const teamDrivers = data?.driverStandings?.filter(d => {
    return d.teamColor === team?.teamColor;
  }) || [];

  // 构建每场比赛的详细分站数据（正赛 + 冲刺赛）
  let raceBreakdown = [];
  let totalWins = 0;
  let totalPodiums = 0;

  if (team && data?.allRaces) {
    // 将冲刺赛数据按 round 索引
    const sprintByRound = {};
    (data.allSprintRaces || []).forEach(sr => {
      sprintByRound[sr.round] = sr.SprintResults || [];
    });

    raceBreakdown = data.allRaces.map(race => {
      const round = race.round;
      const raceName = race.raceName;
      const sprintResults = sprintByRound[round] || [];
      const hasSprint = sprintResults.length > 0;

      // 提取两位车手在正赛中的成绩
      const driversRace = teamDrivers.map(td => {
        const raceRes = race.Results?.find(r => r.Driver.driverId === td.id);
        const sprintRes = sprintResults.find(r => r.Driver.driverId === td.id);
        
        const racePos = raceRes ? parseInt(raceRes.position, 10) : null;
        const racePts = raceRes ? parseFloat(raceRes.points) || 0 : 0;
        const sprintPos = sprintRes ? parseInt(sprintRes.position, 10) : null;
        const sprintPts = sprintRes ? parseFloat(sprintRes.points) || 0 : 0;

        return {
          id: td.id,
          code: td.code || td.lastName.substring(0, 3).toUpperCase(),
          lastName: td.lastName,
          racePos,
          racePts,
          sprintPos,
          sprintPts,
          totalPts: racePts + sprintPts
        };
      });

      // 车队本站总分
      const roundTotal = driversRace.reduce((s, d) => s + d.totalPts, 0);
      const bestPos = Math.min(...driversRace.map(d => d.racePos).filter(Boolean), 99);
      
      if (bestPos === 1) totalWins++;
      if (bestPos <= 3) totalPodiums++;

      return { round, raceName, hasSprint, driversRace, roundTotal, bestPos };
    });
  }

  const totalPoints = team?.points || 0;

  if (!data) return null;

  return (
    <div className={`fixed inset-0 z-[100] ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      
      <div 
        className={`absolute inset-0 bg-black/40 transition-opacity duration-400 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      <div 
        className={`absolute top-0 right-0 w-full max-w-[480px] h-full transition-opacity duration-400 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        }}
      />

      <div 
        className={`absolute top-0 right-0 w-full max-w-[480px] h-full flex flex-col transform-gpu transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.72)',
          borderLeft: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 0 80px rgba(0,0,0,0.12)',
        }}
      >
        {team && (
          <div className="flex flex-col h-full">
            {/* 环境光晕 */}
            <div className="absolute top-0 left-0 w-full h-[400px] pointer-events-none overflow-hidden">
               <div className="absolute -top-[80px] -right-[30px] w-[300px] h-[300px] rounded-full opacity-[0.25]" style={{ backgroundColor: team.teamColor, filter: 'blur(80px)' }}></div>
               <div className="absolute -top-[60px] -left-[30px] w-[200px] h-[200px] rounded-full opacity-[0.1]" style={{ backgroundColor: team.teamColor, filter: 'blur(60px)' }}></div>
            </div>

            {/* 标题栏 */}
            <div className="flex-shrink-0 flex items-center justify-between px-8 py-6 relative z-20 border-b border-black/[0.06]" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
              <div className="flex items-center space-x-3 cursor-pointer group" onClick={handleClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-black/40 group-hover:text-f1-text transition-colors"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-[14px] font-bold text-f1-text-muted tracking-tight group-hover:text-f1-text transition-colors">返回</span>
              </div>
              <div className="flex items-center space-x-2.5">
                 <span className="text-[11px] font-bold text-f1-text-muted uppercase tracking-[0.1em]">车队详情</span>
                 <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white/60 shadow-sm" style={{ backgroundColor: team.teamColor }}></div>
              </div>
            </div>

            {/* 正文滚动区 */}
            <div className="flex-1 overflow-y-auto px-8 py-10 overscroll-contain relative z-10 custom-scrollbar">
              
              {/* 车队名称与排名 */}
               <div className="mb-10 relative">
                <h1 className="text-[42px] sm:text-[52px] font-black text-f1-text tracking-tighter leading-[0.9] mb-4 uppercase" style={{ maxWidth: 'calc(100% - 120px)' }}>
                   {team.name}
                 </h1>
                 <div className="flex flex-wrap items-center gap-3 text-[14px] font-bold mt-6">
                   <span className="px-3.5 py-1.5 rounded-md uppercase tracking-[0.05em] cursor-default text-white shadow-sm" style={{ backgroundColor: team.teamColor }}>
                     第 {team.rank} 名
                   </span>
                   <span className="text-[16px] text-f1-text/80 cursor-default">{totalPoints} PTS</span>
                 </div>

                 <div className="absolute right-0 top-0 w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] flex items-center justify-center pointer-events-none">
                   <div 
                     className="w-full h-full rounded-2xl flex items-center justify-center rotate-3 shadow-lg"
                     style={{ backgroundColor: team.teamColor, opacity: 0.12 }}
                   />
                   <span 
                     className="absolute text-[28px] sm:text-[32px] font-black tracking-tighter uppercase"
                     style={{ color: team.teamColor, opacity: 0.7 }}
                   >
                     {getTeamAbbr(team.id)}
                   </span>
                 </div>
               </div>

              {/* 赛季摘要 */}
              <div className="grid grid-cols-3 gap-3 mb-10">
                 <div className="rounded-2xl p-4 border border-white/70 relative overflow-hidden hover:bg-white/30 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}>
                    <div className="text-[12px] font-bold text-f1-text-muted uppercase tracking-wider mb-2">胜场</div>
                    <div className="text-[32px] font-bold text-f1-text tracking-tighter leading-none">{totalWins}</div>
                 </div>
                 <div className="rounded-2xl p-4 border border-white/70 relative overflow-hidden hover:bg-white/30 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}>
                    <div className="text-[12px] font-bold text-[#A68224] uppercase tracking-wider mb-2">领奖台</div>
                    <div className="text-[32px] font-bold text-f1-text tracking-tighter leading-none">{totalPodiums}</div>
                 </div>
                 <div className="rounded-2xl p-4 border border-white/70 relative overflow-hidden hover:bg-white/30 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}>
                    <div className="text-[12px] font-bold text-f1-cyan uppercase tracking-wider mb-2">总积分</div>
                    <div className="text-[32px] font-bold text-f1-text tracking-tighter leading-none">{totalPoints}</div>
                 </div>
              </div>

              {/* 旗下车手 */}
              <div className="mb-10">
                <h3 className="text-[16px] font-bold text-f1-text tracking-tight mb-5 px-1">旗下车手</h3>
                <div className="space-y-3">
                  {teamDrivers.map(td => (
                    <div key={td.id} className="flex items-center p-4 rounded-2xl border border-white/70 transition-colors hover:bg-white/30" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}>
                      <div className="w-[56px] h-[56px] flex-shrink-0 mr-4 rounded-xl overflow-hidden" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))' }}>
                        <img 
                          src={getDriverImage(td.id) || `https://api.dicebear.com/9.x/micah/svg?seed=${td.id}&flip=true&backgroundColor=transparent`} 
                          alt={td.lastName} 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[16px] font-bold text-f1-text truncate">{td.firstName} {td.lastName}</div>
                        <div className="text-[13px] text-f1-text-muted font-medium">#{td.number} · {td.points} PTS · 第 {td.rank} 名</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 分站得分明细 */}
              <div className="mb-12">
                <h3 className="text-[16px] font-bold text-f1-text tracking-tight mb-6 px-1">分站得分明细</h3>
                
                {/* 表头 */}
                <div className="flex items-center text-[11px] font-bold text-f1-text-muted uppercase tracking-wider px-4 mb-3">
                  <div className="flex-1">比赛</div>
                  {teamDrivers.map(td => (
                    <div key={td.id} className="w-[70px] text-center">{td.code || td.lastName.substring(0, 3).toUpperCase()}</div>
                  ))}
                  <div className="w-[50px] text-right">合计</div>
                </div>

                {/* 每站数据 */}
                <div className="space-y-2">
                  {raceBreakdown.map((rb) => (
                    <div key={rb.round} className="rounded-xl border border-white/70 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}>
                      {/* 比赛名 */}
                      <div className="flex items-center px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-bold text-f1-text truncate">
                            {getRaceNameCN(rb.raceName) || rb.raceName}
                          </div>
                          <div className="text-[10px] text-f1-text-muted font-medium mt-0.5">
                            RND {String(rb.round).padStart(2, '0')}
                            {rb.hasSprint && <span className="ml-1.5 text-[#A68224]">冲刺周末</span>}
                          </div>
                        </div>
                        {/* 两位车手得分 */}
                        {rb.driversRace.map(dr => (
                          <div key={dr.id} className="w-[70px] text-center">
                            {dr.racePos ? (
                              <div>
                                <span className={`text-[13px] font-bold ${dr.racePos <= 3 ? 'text-[#A68224]' : dr.racePos <= 10 ? 'text-f1-cyan' : 'text-f1-text'}`}>
                                  P{dr.racePos}
                                </span>
                                <span className="text-[11px] text-f1-text-muted ml-1">+{dr.racePts}</span>
                              </div>
                            ) : (
                              <span className="text-[12px] text-f1-text-muted">—</span>
                            )}
                          </div>
                        ))}
                        <div className="w-[50px] text-right">
                          <span className={`text-[14px] font-bold ${rb.roundTotal > 0 ? 'text-f1-text' : 'text-f1-text-muted'}`}>
                            {rb.roundTotal > 0 ? `+${rb.roundTotal}` : '0'}
                          </span>
                        </div>
                      </div>
                      
                      {/* 冲刺赛行（如果有） */}
                      {rb.hasSprint && rb.driversRace.some(d => d.sprintPos) && (
                        <div className="flex items-center px-4 py-2 bg-black/[0.02] border-t border-black/[0.04]">
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] text-[#A68224] font-bold">↳ 冲刺赛</div>
                          </div>
                          {rb.driversRace.map(dr => (
                            <div key={dr.id} className="w-[70px] text-center">
                              {dr.sprintPos ? (
                                <div>
                                  <span className={`text-[12px] font-bold ${dr.sprintPos <= 3 ? 'text-[#A68224]' : 'text-f1-text/70'}`}>
                                    P{dr.sprintPos}
                                  </span>
                                  <span className="text-[10px] text-f1-text-muted ml-1">+{dr.sprintPts}</span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-f1-text-muted">—</span>
                              )}
                            </div>
                          ))}
                          <div className="w-[50px]"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
