import { createElement } from "react";
import { CalendarDays, Flame, Gauge, Trophy } from "lucide-react";

const TABS = [
  { id: "home", label: "总览", icon: Gauge },
  { id: "f1hot", label: "F1HOT", icon: Flame },
  { id: "schedule", label: "赛程", icon: CalendarDays },
  { id: "standings", label: "积分", icon: Trophy },
];

export default function Header({ currentView, setCurrentView }) {
  return (
    <>
      <header className="app-header fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => setCurrentView("home")} className="pressable flex items-center gap-2.5 rounded-xl text-left" aria-label="返回总览">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-f1-text text-[10px] font-black text-white shadow-sm">BG</span>
            <span className="text-[14px] font-bold tracking-[-0.025em] text-f1-text">Barley Grid</span>
          </button>

          <nav className="glass-control hidden items-center gap-1 rounded-[14px] p-1 md:flex" aria-label="主导航">
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setCurrentView(id)} aria-current={currentView === id ? "page" : undefined} className={`pressable rounded-[10px] px-4 py-2 text-[12px] font-semibold ${currentView === id ? "bg-white text-f1-text shadow-sm" : "text-f1-text-muted hover:text-f1-text"}`}>
                {label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-2 text-[11px] font-semibold text-f1-text-muted sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
            LIVE
          </div>
        </div>
      </header>

      <nav className="app-mobile-bottom fixed inset-x-3 bottom-2 z-50 grid grid-cols-4 rounded-[22px] border border-white/80 p-1.5 md:hidden" aria-label="移动端导航">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setCurrentView(id)} aria-current={currentView === id ? "page" : undefined} className={`pressable flex min-h-12 flex-col items-center justify-center gap-1 rounded-[15px] text-[10px] font-semibold ${currentView === id ? "bg-white text-[#007aff] shadow-[0_4px_16px_rgba(42,54,72,0.10)]" : "text-f1-text-muted"}`}>
            {createElement(Icon, { size: 16, strokeWidth: currentView === id ? 2.5 : 2 })}
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
