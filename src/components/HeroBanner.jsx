export default function HeroBanner({ setCurrentView }) {
  return (
    <section
      className="apple-card race-cut p-5 sm:p-8 lg:p-12 mb-0 relative z-10 overflow-hidden text-white"
      style={{ background: '#171717' }}
    >
      <div className="absolute inset-0 timing-grid opacity-[0.14] pointer-events-none"></div>
      <div className="absolute top-0 right-0 h-full w-1/3 bg-f1-red race-cut opacity-95 pointer-events-none hidden sm:block"></div>
      <div className="absolute right-4 sm:right-[18%] top-8 h-2 w-36 sm:w-44 bg-f1-lime -skew-x-12 pointer-events-none"></div>
      <div className="absolute right-8 sm:right-[22%] top-14 h-1 w-24 sm:w-28 bg-f1-cyan -skew-x-12 pointer-events-none"></div>
      <div className="hidden sm:block absolute right-6 bottom-4 text-[180px] lg:text-[230px] font-black leading-none text-white/10 select-none pointer-events-none">
        26
      </div>

      <div className="relative z-10 grid min-w-0 gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
        <div className="max-w-[320px] sm:max-w-2xl min-w-0">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="h-2 w-2 rounded-full bg-f1-lime"></span>
            <span className="text-[11px] sm:text-[12px] font-black tracking-[0.22em] uppercase text-white/70">
              Barley Grid · F1 Data Center
            </span>
          </div>

          <h1 className="text-[34px] sm:text-[52px] lg:text-[64px] font-black leading-[0.96] tracking-tight">
            2026 赛季
            <span className="block text-f1-red">全景看板</span>
          </h1>

          <p className="mt-5 max-w-[300px] sm:max-w-xl text-[14px] sm:text-[17px] leading-relaxed text-white/68 font-semibold break-words">
            实时同步下一站、赛季进度与积分变化，像一块更清爽的个人 Pit Wall。
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCurrentView('schedule')}
              className="btn-bounce race-cut bg-f1-lime text-f1-text px-7 py-3 font-black text-[14px] shadow-[0_10px_28px_rgba(215,255,56,0.22)]"
            >
              赛历追踪
            </button>
            <button
              onClick={() => setCurrentView('standings')}
              className="btn-bounce race-cut bg-white/10 text-white px-7 py-3 font-bold text-[14px] border border-white/15 hover:bg-white/15"
            >
              积分榜单
            </button>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-[320px] sm:max-w-sm lg:ml-auto">
          <div className="race-cut min-w-0 border border-white/15 bg-white/10 p-4 sm:p-5 overflow-hidden">
            <div className="text-[44px] sm:text-[52px] lg:text-[64px] font-black leading-none tabular-nums text-white">3</div>
            <div className="mt-2 text-[11px] font-black tracking-[0.14em] uppercase text-white/60">已完赛</div>
          </div>
          <div className="race-cut min-w-0 border border-white/15 bg-white/10 p-4 sm:p-5 overflow-hidden">
            <div className="text-[44px] sm:text-[52px] lg:text-[64px] font-black leading-none tabular-nums text-white/55">24</div>
            <div className="mt-2 text-[11px] font-black tracking-[0.14em] uppercase text-white/60">总场次</div>
          </div>
        </div>
      </div>
    </section>
  );
}
