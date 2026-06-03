import { useEffect, useState } from "react";
import { format } from "date-fns";
import { getCountryNameCN, getRaceNameCN } from "../services/f1api";

// TOP 3 榜单预览组件 (画廊列表美学)
function TopThreeList({ title, items, type, onViewAll, onItemClick }) {
  return (
    <div className="min-w-0 group/list">
      <div className="flex items-center justify-between gap-3 mb-3 border-b border-black/[0.05] pb-2.5">
        <h3 className="font-label-caps text-f1-text-muted tracking-[0.16em]">{title}</h3>
        <button onClick={onViewAll} className="whitespace-nowrap font-label-caps text-f1-text-muted hover:text-f1-red tracking-[0.12em] transition-colors">
          FULL →
        </button>
      </div>
      <div className="divide-y divide-black/[0.05]">
        {items.slice(0, 3).map((item, index) => (
          <button
            key={item.id}
            onClick={() => onItemClick?.(item.id)}
            className="w-full grid grid-cols-[28px_6px_1fr_auto] items-center gap-3 py-3 text-left group"
          >
            <span className="font-data-numeric text-[20px] text-black/25 group-hover:text-f1-text transition-colors text-right pr-1">
              {index + 1}
            </span>
            <span className="w-1 h-5 rounded-full" style={{ backgroundColor: item.teamColor }}></span>
            <span className="min-w-0 truncate font-sans text-[14px] font-semibold text-f1-text group-hover:text-f1-red transition-colors">
              {type === "driver" ? `${item.firstName?.[0]}. ${item.lastName}` : item.name}
            </span>
            <span className="font-data-numeric text-[16px] text-f1-text">{item.points}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// 倒计时方块组件 (Stitch 高雅门票卡片风格)
function CountdownStrip({ targetDate }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetDate) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const countdown = getCountdown(targetDate, now);

  const timeBlocks = [
    { value: countdown.days, label: "Days" },
    { value: countdown.hours, label: "Hours" },
    { value: countdown.minutes, label: "Mins" },
    { value: countdown.seconds, label: "Secs" }
  ];

  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4 border-t border-black/[0.05] pt-5">
      {timeBlocks.map((block) => (
        <div key={block.label} className="flex flex-col border-l border-black/[0.08] pl-3.5">
          <span className="font-label-caps text-f1-text-muted tracking-[0.12em] mb-1">{block.label}</span>
          <span className={`font-data-numeric text-[34px] leading-none ${block.label === "Secs" ? "text-f1-red" : "text-f1-text"}`}>
            {String(block.value).padStart(2, "0")}
          </span>
        </div>
      ))}
    </div>
  );
}

function getCountdown(targetDate, now = Date.now()) {
  const diff = new Date(targetDate).getTime() - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function DashboardHero({ data, setCurrentView, onRaceClick, onDriverClick, onTeamClick }) {
  const { nextRace, schedule = [], driverStandings = [], teamStandings = [], recentResults = [] } = data;
  const completed = recentResults.length || schedule.filter((race) => race.status === "completed").length;
  const total = schedule.length || 24;
  const progress = Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
  const raceDate = nextRace?.date ? new Date(nextRace.date) : null;

  return (
    <section className="flex flex-col min-w-0 rounded-[24px] overflow-hidden border border-black/[0.045] shadow-[0_8px_32px_rgba(16,16,16,0.015)] bg-white animate-in">
      
      {/* 上方：大图全宽海报 Banner (Hero Section) */}
      <div className="relative min-w-0 min-h-[300px] sm:min-h-[320px] flex items-center overflow-hidden bg-f1-graphite text-white p-8 sm:p-14 lg:p-16">
        
        {/* 背景图与半透明磨砂遮罩 */}
        <div className="absolute inset-0 z-0">
          <img 
            alt="Hero Background" 
            className="w-full h-full object-cover grayscale opacity-60" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTbUb24Vtz-CLQZ38OeshJI9TfnUS-QE9nkstmNfE9p4r4WS-7PeyxhgT3O40cxlRICaImg-3oT7hp8q2UMaTarSWCJPGXf1pxVezwMa80At2Vkxu5amcQqhGNWyi-8yq1guW1FZmnX1NgpzRLsadXhrwsNMIrKwL_mkFMGyGMxYukp4tyqrAGESYP1zAazVPgsOS428RpKngLCaqQBtqpMjdWWnGJzxE1M1v1O3H147UQnnc918Q-BkgBVeMb131RuP4GUfo4S4Q"
          />
          <div className="absolute inset-0 bg-black/55 z-[5] backdrop-blur-[1px]"></div>
          <div className="absolute inset-0 timing-grid opacity-[0.04] z-[6]"></div>
        </div>

        <div className="relative z-10 max-w-[620px]">
          <p className="font-label-caps text-f1-lime mb-4 tracking-[0.2em] font-semibold">THE INNER CIRCLE</p>
          <h1 className="font-display-hero text-[36px] sm:text-[54px] lg:text-[60px] leading-[1.08] tracking-tight text-white mb-5 uppercase">
            2026 Season Panorama
          </h1>
          <p className="font-sans text-[14px] sm:text-[15px] text-white/60 leading-relaxed max-w-md mb-8">
            精选视角呈现巅峰汽车运动。精密工程与卓越策略的深度交汇。
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setCurrentView("schedule")} 
              className="bg-white text-f1-text px-7 py-2.5 rounded-lg font-sans text-[13px] font-semibold hover:bg-f1-bg transition-colors"
            >
              赛程追踪
            </button>
            <button 
              onClick={() => setCurrentView("standings")} 
              className="bg-transparent border border-white/25 text-white px-7 py-2.5 rounded-lg font-sans text-[13px] font-semibold hover:bg-white/10 transition-colors"
            >
              积分榜单
            </button>
            <button 
              onClick={() => setCurrentView("chat")} 
              className="bg-transparent border px-7 py-2.5 rounded-lg font-sans text-[13px] font-semibold hover:bg-f1-lime/10 transition-colors flex items-center gap-2" 
              style={{ borderColor: '#C5A880', color: '#C5A880' }}
            >
              <span className="text-[12px]">✦</span> AI Paddock
            </button>
          </div>
        </div>
      </div>

      {/* 下方：三等分数据看析面板 (Next Race - Progress - Top 3) */}
      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-black/[0.05] bg-white p-6 sm:p-8 lg:p-10 gap-8 lg:gap-0">
        
        {/* 第一列：下一站大奖赛与倒计时 */}
        <div className="pb-4 lg:pb-0 lg:pr-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <span className="font-label-caps text-f1-text-muted tracking-[0.16em]">{getCountryNameCN(nextRace?.country)}大奖赛</span>
            <span className="bg-f1-red/10 text-f1-red px-3 py-0.5 rounded-full font-label-caps text-[9px] tracking-[0.12em] font-bold">
              Round {String(nextRace?.round).padStart(2, "0")}
            </span>
          </div>
          
          <button onClick={() => onRaceClick?.(nextRace?.round)} className="block text-left w-full group">
            <div className="font-headline-md text-[26px] leading-tight text-f1-text group-hover:text-f1-red transition-colors duration-300">
              {nextRace?.name}
            </div>
            <div className="mt-2 font-sans text-[12px] font-semibold text-f1-text-muted flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{getRaceNameCN(nextRace?.name)}</span>
              <span className="w-1 h-1 rounded-full bg-black/15 hidden sm:inline"></span>
              <span>{nextRace?.circuit}</span>
            </div>
          </button>
          
          {/* 发车日程卡片 */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-black/[0.04] bg-f1-bg/20 p-2.5">
              <span className="font-label-caps text-[9px] text-f1-text-muted tracking-[0.12em]">正赛日期</span>
              <div className="mt-1 font-data-numeric text-[18px] text-f1-text leading-none">{raceDate ? format(raceDate, "MM/dd") : "--/--"}</div>
            </div>
            <div className="rounded-xl border border-black/[0.04] bg-f1-bg/20 p-2.5">
              <span className="font-label-caps text-[9px] text-f1-text-muted tracking-[0.12em]">发车时间</span>
              <div className="mt-1 font-data-numeric text-[18px] text-f1-text leading-none">{raceDate ? format(raceDate, "HH:mm") : "--:--"}</div>
            </div>
          </div>
          
          <CountdownStrip targetDate={nextRace?.date} />
        </div>

        {/* 第二列：赛季进度追踪 (大留白极简设计) */}
        <div className="flex flex-col justify-between pt-6 lg:pt-0 lg:px-8 pb-4 lg:pb-0">
          <div>
            <div className="font-label-caps text-f1-text-muted tracking-[0.16em] mb-6">Season Progress</div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-data-numeric text-[58px] leading-none text-f1-text">{completed}</span>
              <span className="font-data-numeric text-[22px] text-black/25">/ {total}</span>
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="font-sans text-[12px] font-semibold text-f1-text-muted">赛季完成度</span>
              <span className="font-data-numeric text-[17px] text-f1-text">{progress}%</span>
            </div>
            <div className="w-full h-1 bg-black/[0.05] rounded-full overflow-hidden">
              <div className="h-full bg-f1-text rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>

        {/* 第三列：车手 TOP 3 榜单预览 */}
        <div className="pt-6 lg:pt-0 lg:pl-8 space-y-6">
          <TopThreeList
            title="车手排行 TOP 3"
            items={driverStandings}
            type="driver"
            onViewAll={() => setCurrentView("standings")}
            onItemClick={onDriverClick}
          />
        </div>

      </div>
    </section>
  );
}
