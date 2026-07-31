import { useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { getCountryNameCN, getCircuitNameCN } from "../services/f1api";

const SESSION_LABELS = {
  fp1: ["FP1", "第一节练习赛"],
  fp2: ["FP2", "第二节练习赛"],
  fp3: ["FP3", "第三节练习赛"],
  sprintQualifying: ["SQ", "冲刺排位"],
  sprint: ["SPRINT", "冲刺赛"],
  qualifying: ["Q", "排位赛"],
  race: ["RACE", "正赛"],
};

function sessionDate(value) {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", weekday: "long" }).format(new Date(value));
}

function sessionTime(value) {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));
}

function getNextSession(sessions) {
  const now = Date.now();
  return sessions.find(([, value]) => new Date(value).getTime() > now)?.[0] || sessions.at(-1)?.[0];
}

function getRaceResult(race, allRaces) {
  const resultRace = allRaces.find((item) => String(item.round) === String(race.round));
  const results = resultRace?.Results || [];
  if (!results.length) return null;
  const winner = results[0];
  return {
    winner: `${winner.Driver?.givenName || ""} ${winner.Driver?.familyName || ""}`.trim(),
    team: winner.Constructor?.name || "",
    time: winner.Time?.time || winner.status || "Finished",
    podium: results.slice(0, 3).map((item) => item.Driver?.familyName).filter(Boolean),
  };
}

export default function Schedule({ scheduleData = [], allRaces = [], onRaceClick }) {
  const [activeView, setActiveView] = useState("upcoming");
  if (!scheduleData.length) return null;
  const nextRace = scheduleData.find((race) => race.status === "upcoming");
  const upcoming = scheduleData.filter((race) => race.status === "upcoming" && race.id !== nextRace?.id);
  const completed = scheduleData.filter((race) => race.status === "completed").reverse();
  const view = !nextRace && activeView === "upcoming" ? "completed" : activeView;
  const sessions = Object.entries(nextRace?.sessions || {}).filter(([, value]) => value).sort((a, b) => new Date(a[1]) - new Date(b[1]));
  const nextSessionKey = getNextSession(sessions);
  const country = nextRace ? getCountryNameCN(nextRace.country) : "";

  return (
    <div className="app-page-top mx-auto max-w-3xl pb-4">
      <header className="mb-5 flex items-end justify-between border-b border-f1-text pb-3">
        <div>
          <p className="race-mono text-[11px] font-extrabold tracking-[0.14em] text-f1-text-muted">2026 CALENDAR</p>
          <h1 className="mt-1 text-[38px] font-black leading-none tracking-[-0.06em]">赛程</h1>
        </div>
        <span className="race-mono whitespace-nowrap text-[11px] font-bold tracking-[0.12em]">{nextRace ? `ROUND ${String(nextRace.round).padStart(2, "0")}` : "SEASON RESULTS"}</span>
      </header>

      <nav className="mb-5 flex gap-7 border-b border-f1-text" aria-label="赛程视图">
        {[["upcoming", "接下来", "UPCOMING"], ["completed", "已完赛", "RESULTS"]].map(([id, label, code]) => (
          <button key={id} type="button" onClick={() => setActiveView(id)} className={`pressable relative pb-3 text-left ${view === id ? "text-f1-text after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-f1-red" : "text-f1-text-muted"}`}>
            <span className="block text-[14px] font-extrabold">{label}</span><span className="race-mono mt-0.5 block text-[9px] font-bold tracking-[0.12em]">{code}</span>
          </button>
        ))}
      </nav>

      {view === "upcoming" && nextRace && <>
      <section className="surface-card border-l-[5px] p-5 sm:p-6">
        <button type="button" onClick={() => onRaceClick?.(nextRace.round)} className="pressable w-full text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="race-mono text-[11px] font-extrabold tracking-[0.14em] text-f1-red">NEXT RACE</p>
              <h2 className="mt-2 text-[31px] font-black leading-none tracking-[-0.055em]">{country ? `${country}大奖赛` : nextRace.name}</h2>
              <p className="mt-2 truncate text-[13px] font-semibold text-f1-text-muted">{getCircuitNameCN(nextRace.circuit)}</p>
            </div>
            <span className="race-mono text-[28px] font-black text-[#b2afa7]">R{String(nextRace.round).padStart(2, "0")}</span>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-[#dedbd2] pt-3">
            <span className="text-[14px] font-extrabold">{format(new Date(nextRace.date), "M月d日 EEE HH:mm", { locale: zhCN })}</span>
            <ArrowRight size={15} />
          </div>
        </button>
      </section>

      <section className="mt-6">
        <div className="flex items-end justify-between border-b border-f1-text pb-2">
          <h2 className="text-[18px] font-black tracking-[-0.04em]">比赛周末</h2>
          <span className="race-mono whitespace-nowrap text-[10px] font-bold tracking-[0.14em] text-f1-text-muted">BEIJING TIME · UTC+8</span>
        </div>
        <div className="relative pl-5">
          <span className="absolute bottom-0 left-[7px] top-0 w-px bg-f1-text" aria-hidden="true" />
          {sessions.map(([key, value]) => {
            const [code, label] = SESSION_LABELS[key] || [key.toUpperCase(), key];
            const next = key === nextSessionKey;
            return (
              <div key={key} className="relative grid min-h-[72px] grid-cols-[72px_1fr_auto] items-center gap-2 border-b border-[#dedbd2] py-3">
                <span className={`absolute -left-[17px] h-2 w-2 rounded-full border border-f1-text ${next ? "bg-f1-lime" : "bg-f1-bg"}`} />
                <div><p className={`race-mono text-[17px] font-black ${next ? "text-f1-red" : ""}`}>{code}</p>{next && <p className="race-mono text-[10px] font-black tracking-[0.12em]">NEXT</p>}</div>
                <div className="min-w-0"><p className="truncate text-[15px] font-extrabold">{label}</p><p className="mt-1 whitespace-nowrap text-[11px] font-semibold text-f1-text-muted">{sessionDate(value)}</p></div>
                <time className="race-mono text-[18px] font-black">{sessionTime(value)}</time>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-end justify-between border-b border-f1-text pb-2"><h2 className="text-[18px] font-black tracking-[-0.04em]">接下来</h2><span className="race-mono whitespace-nowrap text-[10px] font-bold tracking-[0.14em] text-f1-text-muted">UPCOMING ROUNDS</span></div>
        <div>
          {upcoming.map((race) => {
            const date = new Date(race.date);
            const raceCountry = getCountryNameCN(race.country);
            return (
              <button key={race.id} type="button" onClick={() => onRaceClick?.(race.round)} className="tap-row grid w-full grid-cols-[40px_52px_1fr_14px] items-center gap-2 border-b border-[#dedbd2] py-3.5 text-left">
                <span className="race-mono text-[17px] font-black text-[#aaa79f]">{String(race.round).padStart(2, "0")}</span>
                <span><span className="race-mono block text-[17px] font-black leading-none">{format(date, "dd")}</span><span className="mt-1 block text-[10px] font-bold text-f1-text-muted">{format(date, "MMM", { locale: zhCN })}</span></span>
                <span className="min-w-0"><span className="block truncate text-[15px] font-extrabold">{raceCountry ? `${raceCountry}大奖赛` : race.name}</span><span className="race-mono mt-0.5 block truncate text-[10px] font-bold tracking-[0.08em] text-f1-text-muted">{getCircuitNameCN(race.circuit)}</span></span>
                <ArrowRight size={13} className="text-f1-text-muted" />
              </button>
            );
          })}
        </div>
      </section>
      </>}

      {view === "completed" && (
        <section>
          <div className="flex items-end justify-between border-b border-f1-text pb-2"><h2 className="text-[18px] font-black tracking-[-0.04em]">赛季结果</h2><span className="race-mono whitespace-nowrap text-[10px] font-bold tracking-[0.14em] text-f1-text-muted">{String(completed.length).padStart(2, "0")} RACES</span></div>
          {completed.length === 0 ? <p className="py-16 text-center text-[14px] font-bold text-f1-text-muted">本赛季尚无已完赛分站</p> : completed.map((race) => {
            const result = getRaceResult(race, allRaces);
            return (
              <button key={race.id} type="button" onClick={() => onRaceClick?.(race.round)} className="tap-row w-full border-b border-[#dedbd2] py-4 text-left">
                <div className="grid grid-cols-[42px_1fr_auto] items-start gap-3">
                  <span className="race-mono text-[22px] font-black text-[#aaa79f]">{String(race.round).padStart(2, "0")}</span>
                  <span className="min-w-0"><strong className="block truncate text-[16px] font-black">{getCountryNameCN(race.country)}大奖赛</strong><small className="race-mono mt-1 block truncate text-[10px] font-bold tracking-[0.08em] text-f1-text-muted">{getCircuitNameCN(race.circuit)}</small></span>
                  <span className="race-mono whitespace-nowrap text-right text-[11px] font-bold text-f1-text-muted">{format(new Date(race.date), "MM.dd")}</span>
                </div>
                <div className="ml-[55px] mt-3 border-l-[3px] border-f1-red pl-3">
                  {result ? <><span className="race-mono text-[10px] font-extrabold tracking-[0.12em] text-f1-text-muted">WINNER</span><div className="mt-1 flex items-end justify-between gap-4"><span className="min-w-0"><strong className="block truncate text-[15px] font-extrabold">{result.winner}</strong><small className="mt-0.5 block truncate text-[11px] font-semibold text-f1-text-muted">{result.team}</small></span><span className="race-mono shrink-0 text-[12px] font-bold">{result.time}</span></div><p className="race-mono mt-2 truncate text-[10px] font-bold tracking-[0.08em] text-f1-text-muted">PODIUM · {result.podium.join(" / ")}</p></> : <p className="text-[12px] font-semibold text-f1-text-muted">结果正在同步，点击查看分站详情</p>}
                </div>
              </button>
            );
          })}
        </section>
      )}
    </div>
  );
}
