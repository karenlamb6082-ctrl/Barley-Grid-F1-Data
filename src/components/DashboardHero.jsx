import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getCountryNameCN, getRaceNameCN } from "../services/f1api";

const SESSION_LABELS = {
  fp1: "FP1", fp2: "FP2", fp3: "FP3",
  sprintQualifying: "SQ", sprint: "SPRINT", qualifying: "Q", race: "RACE",
};
const SESSION_DURATION = { fp1: 60, fp2: 60, fp3: 60, sprintQualifying: 45, sprint: 60, qualifying: 60, race: 120 };
const COUNTRY_CODES = {
  Australia: "AUS", China: "CHN", Japan: "JPN", Bahrain: "BHR", "Saudi Arabia": "SAU",
  USA: "USA", Italy: "ITA", Monaco: "MCO", Spain: "ESP", Canada: "CAN", Austria: "AUT",
  UK: "GBR", Belgium: "BEL", Hungary: "HUN", Netherlands: "NLD", Azerbaijan: "AZE",
  Singapore: "SGP", Mexico: "MEX", Brazil: "BRA", Qatar: "QAT", UAE: "UAE",
};

function getSession(race, now = Date.now()) {
  const sessions = Object.entries(race?.sessions || {})
    .filter(([, value]) => value)
    .map(([key, value]) => ({ key, time: new Date(value).getTime() }))
    .filter(({ time }) => Number.isFinite(time))
    .sort((a, b) => a.time - b.time);
  const live = sessions.find(({ key, time }) => now >= time && now <= time + (SESSION_DURATION[key] || 60) * 60000);
  return live ? { ...live, live: true } : sessions.find(({ time }) => time > now) || sessions.at(-1);
}

function formatTime(value) {
  if (!value) return "待定";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", weekday: "short",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(value));
}

function getCountdown(targetDate, now) {
  const diff = Math.max(0, new Date(targetDate).getTime() - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
  };
}

function CircuitGlyph() {
  return (
    <svg viewBox="0 0 150 100" fill="none" aria-hidden="true" className="absolute right-3 top-[74px] h-[84px] w-[126px] opacity-[0.17] sm:right-8 sm:top-20 sm:h-28 sm:w-40">
      <path d="M18 56c-8-15 5-31 22-26 12 4 11 17 26 17 14 0 17-14 34-16 13-1 30 5 28 17-2 12-19 11-23 22-4 10 7 22-7 28-14 5-24-10-34-13-14-4-38 2-46-11-3-5-2-12 0-18Z" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardHero({ data, onRaceClick }) {
  const { nextRace } = data;
  const country = getCountryNameCN(nextRace?.country);
  const raceTitle = country ? `${country}大奖赛` : (getRaceNameCN(nextRace?.name) || nextRace?.name || "比赛周末");
  const session = getSession(nextRace);
  const targetTime = session?.time || nextRace?.date;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetTime) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, [targetTime]);

  const countdown = getCountdown(targetTime, now);
  const countryCode = COUNTRY_CODES[nextRace?.country] || String(nextRace?.country || "GP").slice(0, 3).toUpperCase();

  return (
    <section className="glass-dark animate-in relative px-5 pb-4 pt-5 sm:px-7 sm:pb-6 sm:pt-6">
      <span className="absolute bottom-5 left-[10px] top-5 w-[2px] bg-f1-text" aria-hidden="true" />
      <span className="absolute left-[7px] top-5 h-2 w-2 rounded-full bg-f1-red" aria-hidden="true" />
      <span className="absolute bottom-5 left-[7px] h-2 w-2 rounded-full border border-f1-text bg-f1-lime" aria-hidden="true" />
      <span className="absolute -right-1 -top-1 h-4 w-11 -skew-x-[34deg] border-b border-l border-f1-text bg-f1-bg" aria-hidden="true" />

      <div className="pl-1">
        <p className="race-mono text-[12px] font-extrabold tracking-[0.14em]">ROUND {String(nextRace?.round || "--").padStart(2, "0")} · {countryCode}</p>
        <h1 className="mt-3 max-w-[78%] text-[38px] font-black leading-[0.98] tracking-[-0.065em] sm:text-[52px]">{raceTitle}</h1>
        <p className="race-mono mt-2 text-[14px] font-extrabold tracking-[0.15em]">{nextRace?.circuit || "CIRCUIT TBC"}</p>
        <p className="mt-1 text-[12px] font-semibold text-f1-text-muted">{formatTime(nextRace?.date)}</p>
        <CircuitGlyph />

        <div className="mt-5 grid grid-cols-[88px_1fr] gap-3 border-t border-[#dedbd2] pt-4 sm:grid-cols-[120px_1fr] sm:gap-6">
          <div>
            <p className="race-mono flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.14em]"><span className="h-[7px] w-[7px] rounded-full border border-f1-text bg-f1-lime" />{session?.live ? "LIVE" : "NEXT"}</p>
            <p className="race-mono mt-1 text-[27px] font-black leading-none">{SESSION_LABELS[session?.key] || "RACE"}</p>
            <p className="mt-2 text-[12px] font-semibold text-f1-text-muted">{formatTime(targetTime)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-f1-text-muted">距离下一赛段</p>
            <p className="race-mono mt-1 whitespace-nowrap text-[26px] font-black leading-none tracking-[0.025em] sm:text-[34px]">
              {String(countdown.days).padStart(2, "0")}D {String(countdown.hours).padStart(2, "0")}H {String(countdown.minutes).padStart(2, "0")}M
            </p>
          </div>
        </div>

        <button type="button" onClick={() => onRaceClick?.(nextRace?.round)} className="pressable mt-4 flex w-full items-center justify-between rounded-[10px] bg-f1-red px-4 py-3 text-left text-[14px] font-extrabold text-white">
          查看比赛周 <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}
