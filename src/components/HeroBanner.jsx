export default function HeroBanner({ setCurrentView }) {
  return (
    <div className="apple-card p-8 sm:p-10 lg:p-16 mb-0 flex flex-col lg:flex-row items-center justify-between relative z-10 bg-gradient-to-br from-white via-white to-[#F8F8F6] overflow-hidden">
      {/* 装饰性背景元素 */}
      <div className="absolute top-[-60px] right-[-60px] w-[250px] h-[250px] rounded-full bg-f1-red/[0.04] blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-[-40px] left-[-40px] w-[200px] h-[200px] rounded-full bg-f1-cyan/[0.05] blur-[60px] pointer-events-none"></div>
      
      {/* 右侧装饰数字 */}
      <div className="absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 text-[180px] lg:text-[260px] font-black text-black/[0.02] leading-none tracking-tighter select-none pointer-events-none">
        26
      </div>

      {/* 左侧文案 */}
      <div className="relative z-10 max-w-xl text-center lg:text-left">
        <span className="inline-block text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-f1-text-muted uppercase mb-4">
          Barley Grid · F1 Data Center
        </span>
        
        <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-bold tracking-tight text-f1-text mb-4 leading-[1.1]">
          2026 赛季
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-f1-red to-[#E85D5D]"> 全景看板</span>
        </h1>
        
        <p className="text-[15px] sm:text-[16px] text-[#8E8E93] max-w-md font-medium leading-[1.8] mb-8 mx-auto lg:mx-0">
          实时同步发车格上的每一次超越与排位博弈
        </p>
        
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
          <button 
            onClick={() => setCurrentView('schedule')}
            className="bg-[#1C1C1E] text-white px-7 py-3 rounded-full font-semibold text-[14px] shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:bg-black transition-all active:scale-[0.98]"
          >
            赛历追踪
          </button>
          <button 
            onClick={() => setCurrentView('standings')}
            className="bg-black/[0.04] text-f1-text px-7 py-3 rounded-full font-semibold text-[14px] hover:bg-black/[0.08] transition-all active:scale-[0.98]"
          >
            积分榜单
          </button>
        </div>
      </div>

      {/* 右侧赛季进度指示 */}
      <div className="relative z-10 mt-8 lg:mt-0 flex items-center gap-8">
        <div className="text-center">
          <div className="text-[48px] lg:text-[64px] font-bold text-f1-text tracking-tighter leading-none">3</div>
          <div className="text-[11px] font-bold text-f1-text-muted tracking-[0.1em] uppercase mt-1">已完赛</div>
        </div>
        <div className="w-px h-16 bg-black/[0.06]"></div>
        <div className="text-center">
          <div className="text-[48px] lg:text-[64px] font-bold text-f1-text/20 tracking-tighter leading-none">24</div>
          <div className="text-[11px] font-bold text-f1-text-muted tracking-[0.1em] uppercase mt-1">总场次</div>
        </div>
      </div>
    </div>
  );
}
