import { useState, useEffect } from 'react';
import { getTeamColor, getDriverImage } from '../services/f1api';

export default function DriverDrawer({ driverId, data, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  
  useEffect(() => {
    if (driverId) {
      setActiveId(driverId);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpen(true);
        });
      });
    } else {
      setIsOpen(false);
      document.body.style.overflow = '';
      const timer = setTimeout(() => {
        setActiveId(null);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [driverId]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 450); 
  };

  const isVisible = isOpen || activeId;

  const driver = data?.driverStandings?.find(d => d.id === activeId);

  let seasonWins = 0;
  let seasonPodiums = 0;
  let seasonDNFs = 0;
  let seasonPoints = driver?.points || 0;

  let history = [];
  if (driver && data?.allRaces) {
    history = data.allRaces.map(race => {
      const res = race.Results?.find(r => r.Driver.driverId === activeId);
      
      let bgColor = 'bg-black/[0.04] text-f1-text-muted'; 
      if (res) {
        const pos = parseInt(res.position, 10);
        if (pos === 1) { bgColor = 'bg-[#D2B056]/20 text-[#A68224]'; seasonWins++; seasonPodiums++; }
        else if (pos === 2 || pos === 3) { bgColor = 'bg-[#8E8E93]/20 text-[#606060]'; seasonPodiums++; }
        else if (pos <= 10) bgColor = 'bg-[#36696A]/10 text-f1-cyan'; 
        if (res.status !== 'Finished' && !res.status.includes('Lap')) { bgColor = 'bg-[#C83232]/10 text-[#C83232]'; seasonDNFs++; }
      }
      
      return {
        round: race.round,
        raceName: race.raceName,
        circuit: race.Circuit.circuitName,
        position: res ? res.position : 'DNS',
        status: res ? res.status : '未开始',
        points: res ? res.points : 0,
        bgColor,
        isFinished: !!res,
        isPodium: res && parseInt(res.position, 10) <= 3
      };
    });
  }

  if (!data) return null;

  return (
    <div className={`fixed inset-0 z-[100] ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      
      {/* 第一层：暗色遮罩 — 仅 opacity 动画，GPU 零成本 */}
      <div 
        className={`absolute inset-0 bg-black/40 transition-opacity duration-400 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* 第二层：毛玻璃层 — 固定定位，仅 opacity 动画，不做 transform → 60fps */}
      <div 
        className={`absolute top-0 right-0 w-full max-w-[480px] h-full transition-opacity duration-400 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        }}
      />

      {/* 第三层：内容面板 — transform 滑入 + 半透明底色，本身不做 blur */}
      <div 
        className={`absolute top-0 right-0 w-full max-w-[480px] h-full flex flex-col transform-gpu transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.72)',
          borderLeft: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 0 80px rgba(0,0,0,0.12)',
        }}
      >
        {driver && (
          <div className="flex flex-col h-full">
            {/* 环境光晕 */}
            <div className="absolute top-0 left-0 w-full h-[400px] pointer-events-none overflow-hidden">
               <div className="absolute -top-[120px] -right-[50px] w-[350px] h-[350px] rounded-full opacity-[0.2]" style={{ backgroundColor: driver.teamColor || '#1C1C1E', filter: 'blur(90px)' }}></div>
               <div className="absolute top-[80px] right-[20px] text-[220px] font-black leading-none opacity-[0.04] text-black select-none z-0 tracking-tighter">
                 {driver.number}
               </div>
            </div>

            {/* 标题栏 */}
            <div className="flex-shrink-0 flex items-center justify-between px-8 py-6 relative z-20 border-b border-black/[0.06]" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
              <div className="flex items-center space-x-3 cursor-pointer group" onClick={handleClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-black/40 group-hover:text-f1-text transition-colors"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-[14px] font-bold text-f1-text-muted tracking-tight group-hover:text-f1-text transition-colors">返回</span>
              </div>
              <div className="flex items-center space-x-2.5">
                 <span className="text-[11px] font-bold text-f1-text-muted uppercase tracking-[0.1em]">{driver.team}</span>
                 <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white/60 shadow-sm" style={{ backgroundColor: driver.teamColor || '#1C1C1E' }}></div>
              </div>
            </div>

            {/* 正文滚动区 */}
            <div className="flex-1 overflow-y-auto px-8 py-10 overscroll-contain relative z-10 custom-scrollbar">
              
              {/* 大名 + 头像 */}
              <div className="mb-10 relative">
                <div className="pr-[120px] sm:pr-[150px]">
                  <h1 className="text-[48px] sm:text-[60px] font-black text-f1-text tracking-tighter leading-[0.9] mb-4 uppercase">
                    <span className="block font-medium text-[30px] text-f1-text/50 capitalize tracking-tight mb-2">{driver.firstName}</span>
                    <span className="break-words">{driver.lastName}</span>
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-[14px] font-bold mt-6">
                    <span className="px-3.5 py-1.5 rounded-md uppercase tracking-[0.05em] cursor-default text-white shadow-sm" style={{ backgroundColor: driver.teamColor || '#1C1C1E' }}>
                      #{driver.number}
                    </span>
                    <span className="text-[16px] text-f1-text/80 cursor-default">{seasonPoints} PTS</span>
                    <span className="text-[16px] text-f1-text-muted cursor-default hidden sm:inline-block before:content-['·'] before:mx-3 before:text-black/20">第 {driver.rank} 名</span>
                  </div>
                </div>

                {/* 车手形象 */}
                <div className="absolute right-[-10px] bottom-[-10px] w-[150px] h-[150px] sm:w-[180px] sm:h-[180px] z-20 pointer-events-none flex items-end justify-end"
                  style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.2))' }}
                >
                  <img 
                    src={getDriverImage(driver.id) || `https://api.dicebear.com/9.x/micah/svg?seed=${driver.id}&flip=true&backgroundColor=transparent`} 
                    alt={driver.lastName} 
                    className="w-full h-full object-contain transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ opacity: 0, transform: 'translateY(20px) scale(0.95)' }}
                    onLoad={(e) => { 
                      e.target.style.opacity = 1; 
                      e.target.style.transform = 'translateY(0) scale(1)'; 
                    }}
                  />
                </div>
              </div>

              {/* 赛季摘要 */}
              <div className="grid grid-cols-3 gap-3 mb-12">
                 <div className="rounded-2xl p-4 border border-white/70 relative overflow-hidden group hover:bg-white/30 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}>
                    <div className="text-[12px] font-bold text-f1-text-muted uppercase tracking-wider mb-2 relative z-10">Wins</div>
                    <div className="text-[32px] font-bold text-f1-text tracking-tighter leading-none relative z-10">{seasonWins}</div>
                 </div>
                 <div className="rounded-2xl p-4 border border-white/70 relative overflow-hidden group hover:bg-white/30 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}>
                    <div className="text-[12px] font-bold text-[#A68224] uppercase tracking-wider mb-2 relative z-10">Podiums</div>
                    <div className="text-[32px] font-bold text-f1-text tracking-tighter leading-none relative z-10">{seasonPodiums}</div>
                 </div>
                 <div className="rounded-2xl p-4 border border-white/70 relative overflow-hidden group hover:bg-white/30 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}>
                    <div className="text-[12px] font-bold text-[#C83232] uppercase tracking-wider mb-2 relative z-10">DNFs</div>
                    <div className="text-[32px] font-bold text-f1-text tracking-tighter leading-none relative z-10">{seasonDNFs}</div>
                 </div>
              </div>

              {/* 时间线 */}
              <div className="mb-12">
                <h3 className="text-[16px] font-bold text-f1-text tracking-tight mb-8 px-1 flex items-center">
                  赛季分站轨迹
                  <span className="ml-3 px-2 py-0.5 rounded flex items-center justify-center bg-black/[0.03] text-[11px] text-f1-text-muted tracking-widest border border-black/[0.05]">
                    {history.length} Races
                  </span>
                </h3>
                
                <div className="relative border-l-2 border-dashed border-black/[0.08] ml-[23px] space-y-7 pb-4">
                  {history.map((h) => (
                    <div key={h.round} className="group flex items-start relative ml-8 cursor-default">
                      
                      {/* 节点 */}
                      <div className={`absolute -left-[40px] top-2 w-3 h-3 rounded-full ring-4 ring-white/80 z-10 transition-transform duration-300 group-hover:scale-125 shadow-sm ${h.isFinished ? (h.isPodium ? 'bg-[#A68224]' : 'bg-[#36696A]') : 'bg-black/20'}`}></div>

                      {/* 赛事卡片 */}
                      <div className={`flex-1 min-w-0 p-5 rounded-2xl border transition-all duration-300 ${h.isPodium ? 'border-[#A68224]/20 hover:shadow-md' : 'border-white/70 hover:shadow-md'}`} style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}>
                        <div className="flex items-center justify-between mb-2">
                           <h4 className="text-[15px] font-bold text-f1-text truncate leading-tight">{h.raceName}</h4>
                           <div className={`px-2.5 py-1 rounded flex items-center justify-center font-bold text-[12px] tracking-tighter flex-shrink-0 shadow-sm ${h.bgColor}`}>
                              <span className="opacity-50 font-medium text-[10px] mr-1">P</span>{h.isFinished ? h.position : 'Ret'}
                           </div>
                        </div>
                        
                        <p className="text-[12px] text-f1-text-muted font-bold uppercase tracking-[0.05em] flex items-center gap-2">
                          RND 0{h.round} 
                          {h.isFinished && h.points > 0 && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-black/10"></span>
                              <span className={h.isPodium ? 'text-[#A68224]' : 'text-[#36696A]'}>+{h.points} PTS</span>
                            </>
                          )}
                          {(h.status !== 'Finished' && !h.status.includes('Lap') && h.status !== '未开始') && (
                             <>
                              <span className="w-1 h-1 rounded-full bg-black/10"></span>
                              <span className="text-[#C83232] truncate">{h.status}</span>
                             </>
                          )}
                        </p>
                      </div>
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
