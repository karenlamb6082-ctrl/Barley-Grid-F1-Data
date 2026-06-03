import { useState } from "react";
import DashboardHero from "../components/DashboardHero";
import FavoriteDriverCard from "../components/FavoriteDriverCard";
import F1Pulse from "../components/F1Pulse";
import RecentResultsCard from "../components/RecentResultsCard";
import SchedulePreview from "../components/SchedulePreview";

function FadeInSection({ children, delay = 0, className = "" }) {
  return (
    <div className={`animate-in ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function StandingsPreviewCard({ driverStandings = [], teamStandings = [], onViewAll, onDriverClick, onTeamClick }) {
  const [mode, setMode] = useState("driver");
  const data = mode === "driver" ? driverStandings.slice(0, 5) : teamStandings.slice(0, 5);
  const maxPoints = data[0]?.points || 1;

  return (
    <div className="apple-card h-full overflow-hidden">
      <div className="border-b border-black/[0.05] px-5 sm:px-6 py-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <h3 className="font-headline-md text-[18px] font-bold text-f1-text">积分榜预览</h3>
        </div>
        <div className="flex rounded-lg bg-black/[0.04] p-0.5 border border-black/[0.01]">
          {[
            ["driver", "车手"],
            ["team", "车队"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`px-4 py-1 rounded-md text-[12px] font-bold transition-all ${
                mode === key ? "bg-white text-f1-text shadow-sm" : "text-f1-text-muted hover:text-f1-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 sm:px-6 py-5">
        <div className="grid grid-cols-[46px_1fr_80px] font-label-caps text-f1-text-muted pb-3 border-b border-black/[0.05]">
          <span>排名</span>
          <span>{mode === "driver" ? "车手" : "车队"}</span>
          <span className="text-right">积分</span>
        </div>
        <div className="divide-y divide-black/[0.05]">
          {data.map((item, index) => {
            const fill = Math.max(8, (item.points / maxPoints) * 100);
            return (
              <button
                key={item.id}
                onClick={() => mode === "driver" ? onDriverClick?.(item.id) : onTeamClick?.(item.id)}
                className="w-full grid grid-cols-[46px_1fr_80px] items-center gap-3 py-3 text-left tap-row group"
              >
                <span className="font-data-numeric text-[20px] text-black/25 group-hover:text-f1-text transition-colors tabular-nums">{index + 1}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-3">
                    <span className="h-4 w-1 rounded-full" style={{ backgroundColor: item.teamColor }}></span>
                    <span className="truncate text-[14px] font-semibold text-f1-text group-hover:text-f1-red transition-colors">
                      {mode === "driver" ? `${item.firstName?.[0]}. ${item.lastName}` : item.name}
                    </span>
                  </span>
                  <span className="mt-2 block h-1 rounded-full bg-black/[0.03] overflow-hidden">
                    <span className="block h-full rounded-full" style={{ width: `${fill}%`, backgroundColor: item.teamColor }}></span>
                  </span>
                </span>
                <span className="text-right font-data-numeric text-[16px] text-f1-text tabular-nums">{item.points}</span>
              </button>
            );
          })}
        </div>
        
        <button onClick={onViewAll} className="mt-4 w-full py-2.5 rounded-lg border border-black/[0.04] bg-f1-bg/40 font-label-caps text-f1-text hover:bg-black/[0.02] text-center tracking-widest text-[11px] transition-all">
          VIEW FULL STANDINGS →
        </button>
      </div>
    </div>
  );
}

export default function Home({ setCurrentView, data, onDriverClick, onTeamClick, onRaceClick }) {
  if (!data) return null;
  const { recentResults, driverStandings, teamStandings, schedule, allRaces } = data;

  return (
    <div className="space-y-6">
      <FadeInSection delay={0}>
        <DashboardHero
          data={data}
          setCurrentView={setCurrentView}
          onRaceClick={onRaceClick}
          onDriverClick={onDriverClick}
          onTeamClick={onTeamClick}
        />
      </FadeInSection>

      <FadeInSection delay={180}>
        <FavoriteDriverCard data={data} onDriverClick={onDriverClick} />
      </FadeInSection>

      <FadeInSection delay={200}>
        <F1Pulse onViewAll={() => setCurrentView("f1hot")} />
      </FadeInSection>

      <FadeInSection delay={240}>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.92fr_1.04fr] gap-6">
          <RecentResultsCard
            results={recentResults}
            onRaceClick={onRaceClick}
            onViewAll={() => setCurrentView("schedule")}
          />
          <SchedulePreview
            schedule={schedule}
            allRaces={allRaces}
            onRaceClick={onRaceClick}
            onViewAll={() => setCurrentView("schedule")}
          />
          <StandingsPreviewCard
            driverStandings={driverStandings}
            teamStandings={teamStandings}
            onViewAll={() => setCurrentView("standings")}
            onDriverClick={onDriverClick}
            onTeamClick={onTeamClick}
          />
        </div>
      </FadeInSection>
    </div>
  );
}
