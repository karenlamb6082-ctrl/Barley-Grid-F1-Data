import DashboardHero from "../components/DashboardHero";
import FavoriteDriverCard from "../components/FavoriteDriverCard";
import F1Pulse from "../components/F1Pulse";

export default function Home({ setCurrentView, data, onDriverClick, onRaceClick }) {
  if (!data) return null;
  return (
    <div className="app-page-top mx-auto max-w-3xl pb-4">
      <header className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="" className="h-10 w-10 rounded-[12px]" />
          <div><div className="text-[22px] font-black leading-none tracking-[-0.045em]">BARLEY GRID</div><div className="mt-1 text-[11px] font-semibold tracking-[0.12em] text-f1-text-muted">F1 赛季仪表盘</div></div>
        </div>
        <span className="race-mono pt-1 text-[10px] font-bold tracking-[0.14em] text-f1-text-muted">SYNCED · UTC+8</span>
      </header>
      <DashboardHero data={data} setCurrentView={setCurrentView} onRaceClick={onRaceClick} />
      <F1Pulse onViewAll={() => setCurrentView("f1hot")} />
      <FavoriteDriverCard data={data} onDriverClick={onDriverClick} />
    </div>
  );
}
