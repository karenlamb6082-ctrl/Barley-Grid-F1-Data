import { useEffect, useState } from "react";
import { format } from "date-fns";
import { getCountryNameCN, getRaceNameCN } from "../services/f1api";

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

function TopThreeList({ title, items, type, onViewAll, onItemClick }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-f1-red"></span>
          <h3 className="whitespace-nowrap text-[13px] font-black text-f1-text tracking-wide">{title}</h3>
        </div>
        <button onClick={onViewAll} className="hidden 2xl:block whitespace-nowrap text-[12px] font-bold text-f1-text-muted hover:text-f1-red">
          查看完整榜单 →
        </button>
      </div>
      <div className="divide-y divide-black/10">
        {items.slice(0, 3).map((item, index) => (
          <button
            key={item.id}
            onClick={() => onItemClick?.(item.id)}
            className="w-full grid grid-cols-[32px_10px_1fr_auto] items-center gap-3 py-3 text-left"
          >
            <span className="text-[26px] font-black leading-none text-f1-text tabular-nums">{index + 1}</span>
            <span className="w-1.5 h-7 rounded-full" style={{ backgroundColor: item.teamColor }}></span>
            <span className="min-w-0 truncate text-[14px] font-bold text-f1-text">
              {type === "driver" ? `${item.firstName?.[0]}. ${item.lastName}` : item.name}
            </span>
            <span className="text-[17px] font-black text-f1-text tabular-nums">{item.points}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DashboardHero({ data, setCurrentView, onRaceClick, onDriverClick, onTeamClick }) {
  const { nextRace, schedule = [], driverStandings = [], teamStandings = [], recentResults = [] } = data;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!nextRace?.date) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [nextRace?.date]);

  const countdown = getCountdown(nextRace?.date, now);
  const completed = recentResults.length || schedule.filter((race) => race.status === "completed").length;
  const total = schedule.length || 24;
  const progress = Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
  const raceDate = nextRace?.date ? new Date(nextRace.date) : null;

  return (
    <section className="grid min-w-0 grid-cols-1 xl:grid-cols-[1fr_1.25fr] gap-0 rounded-[18px] overflow-hidden border border-black/10 shadow-[0_24px_70px_rgba(16,16,16,0.12)] bg-white">
      <div className="relative min-w-0 min-h-[360px] overflow-hidden bg-f1-graphite text-white p-7 sm:p-10 lg:p-12 race-cut">
        <div className="absolute inset-0 timing-grid opacity-[0.14]"></div>
        <div className="absolute right-[-12%] top-[-20%] h-[140%] w-[42%] bg-f1-bg -skew-x-12 hidden xl:block"></div>
        <div className="absolute left-0 bottom-0 h-16 w-2/3 bg-gradient-to-r from-f1-red via-f1-red/70 to-transparent"></div>
        <div className="absolute top-0 right-16 h-3 w-24 bg-f1-lime -skew-x-12"></div>
        <svg className="absolute right-8 bottom-24 w-[260px] max-w-[60%] opacity-45 hidden sm:block" viewBox="0 0 320 180" fill="none">
          <path d="M28 118C60 154 100 96 128 116C160 140 178 82 210 94C252 110 236 44 280 56" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <path d="M28 134C62 170 105 112 131 132C165 158 184 99 215 110C265 128 245 60 292 72" stroke="#20D7FF" strokeWidth="2" strokeLinecap="round" />
        </svg>

        <div className="relative z-10 max-w-[560px]">
          <div className="mb-8 text-[12px] font-black tracking-[0.32em] text-f1-red uppercase">
            Barley Grid · F1 Data Center
          </div>
          <h1 className="text-[34px] sm:text-[58px] lg:text-[72px] font-black leading-[0.98] tracking-tight">
            2026 赛季<span className="block text-f1-red">全景看板</span>
          </h1>
          <p className="mt-5 max-w-[280px] sm:max-w-[340px] text-[16px] sm:text-[17px] font-bold text-white/78 leading-relaxed">
            实时同步每一次超越、排位与积分变化
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <button onClick={() => setCurrentView("schedule")} className="btn-bounce race-cut bg-f1-red px-7 py-3 text-[15px] font-black text-white">
              赛程追踪
            </button>
            <button onClick={() => setCurrentView("standings")} className="btn-bounce race-cut border border-white/25 bg-white/8 px-7 py-3 text-[15px] font-black text-white">
              积分榜单
            </button>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[1fr_0.7fr_1.15fr] divide-y lg:divide-y-0 lg:divide-x divide-black/10 bg-white p-5 sm:p-7">
        <div className="min-w-0 pb-6 lg:pb-0 lg:pr-7">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-f1-red"></span>
            <h2 className="text-[15px] font-black text-f1-text">下一站</h2>
          </div>
          <button onClick={() => onRaceClick?.(nextRace?.round)} className="block text-left">
            <div className="text-[30px] font-black text-f1-text leading-tight">{nextRace?.name}</div>
            <div className="mt-2 text-[14px] font-semibold text-f1-text-muted">{getRaceNameCN(nextRace?.name) || ""}</div>
            <div className="mt-2 text-[14px] font-semibold text-f1-text-muted">
              {nextRace?.circuit} <span className="mx-2 text-black/20">|</span> {getCountryNameCN(nextRace?.country)}
            </div>
          </button>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-black/10 p-3">
              <div className="text-[18px] font-black text-f1-text">{raceDate ? format(raceDate, "MM/dd") : "--/--"}</div>
              <div className="text-[12px] font-bold text-f1-text-muted">周日</div>
            </div>
            <div className="rounded-lg border border-black/10 p-3">
              <div className="text-[18px] font-black text-f1-text">{raceDate ? format(raceDate, "HH:mm") : "--:--"}</div>
              <div className="text-[12px] font-bold text-f1-text-muted">当地时间</div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg bg-f1-lime p-3">
            {[
              [countdown.days, "天"],
              [countdown.hours, "时"],
              [countdown.minutes, "分"],
              [countdown.seconds, "秒"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-md bg-white p-2 text-center">
                <div className="text-[24px] font-black leading-none tabular-nums text-f1-text">{String(value).padStart(2, "0")}</div>
                <div className="mt-1 text-[11px] font-black text-f1-text-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="py-6 lg:py-0 lg:px-7">
          <div className="flex items-center gap-2 mb-10">
            <span className="w-2 h-2 rounded-full bg-f1-red"></span>
            <h3 className="text-[15px] font-black text-f1-text">赛季进度</h3>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-[74px] font-black leading-none text-f1-red">{completed}</span>
            <span className="pb-3 text-[40px] font-black leading-none text-black/25">/ {total}</span>
          </div>
          <div className="mt-8 h-2 rounded-full bg-black/10 overflow-hidden">
            <div className="h-full rounded-full bg-f1-red" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="mt-8 flex items-center gap-2 whitespace-nowrap text-[15px] font-black text-f1-text">
            <span className="text-f1-lime drop-shadow-[0_1px_0_rgba(16,16,16,0.55)]">{progress}%</span>
            <span className="text-f1-text-muted">赛季完成度</span>
          </div>
        </div>

        <div className="pt-6 lg:pt-0 lg:pl-7 space-y-7">
          <TopThreeList
            title="车手积分 TOP 3"
            items={driverStandings}
            type="driver"
            onViewAll={() => setCurrentView("standings")}
            onItemClick={onDriverClick}
          />
          <TopThreeList
            title="车队积分 TOP 3"
            items={teamStandings}
            type="team"
            onViewAll={() => setCurrentView("standings", "team-standings")}
            onItemClick={onTeamClick}
          />
        </div>
      </div>
    </section>
  );
}
