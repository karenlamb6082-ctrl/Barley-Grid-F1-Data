export default function HeroBanner({ setCurrentView }) {
  return (
    <div className="apple-card p-8 sm:p-12 lg:p-24 mb-6 sm:mb-10 flex flex-col items-center justify-center text-center relative z-10 bg-gradient-to-b from-white to-[#FDFDFD]">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/[0.01] to-transparent pointer-events-none"></div>
      
      <span className="text-[10px] sm:text-[11px] lg:text-[12px] font-bold tracking-[0.25em] text-f1-text-muted uppercase mb-4 sm:mb-5">
        Barley Grid — F1 Data Center
      </span>
      
      <h1 className="text-4xl sm:text-5xl lg:text-[76px] font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-[#1C1C1E] to-[#606060] mb-5 sm:mb-8 leading-[1.1] lg:leading-[1.05]">
        2026 赛季全景看板
      </h1>
      
      <p className="text-[17px] sm:text-[19px] text-[#8E8E93] max-w-xl font-medium leading-[1.8] mb-12">
        感受顶级赛事的毫秒必争。<br className="hidden sm:block"/>
        依托最新的数据引擎，为您严格同步发车格上的每一次超越与排位博弈。
      </p>
      
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button 
          onClick={() => setCurrentView('schedule')}
          className="bg-[#1C1C1E] text-white px-8 py-3.5 rounded-full font-semibold text-[15px] shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:bg-black transition-all active:scale-[0.98]"
        >
          查看完整赛历
        </button>
        <button 
          onClick={() => setCurrentView('standings')}
          className="bg-black/[0.04] text-f1-text px-8 py-3.5 rounded-full font-semibold text-[15px] hover:bg-black/[0.08] transition-all active:scale-[0.98]"
        >
          深入榜单数据
        </button>
      </div>
    </div>
  );
}
