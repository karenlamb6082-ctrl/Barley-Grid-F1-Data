import { createElement } from "react";
import { CalendarDays, Flame, LayoutDashboard, Trophy } from "lucide-react";

const TABS = [
  { id: "home", label: "总览", Icon: LayoutDashboard },
  { id: "f1hot", label: "F1HOT", Icon: Flame },
  { id: "schedule", label: "赛程", Icon: CalendarDays },
  { id: "standings", label: "积分", Icon: Trophy },
];

export default function AppDock({ currentView, setCurrentView }) {
  const activeIndex = Math.max(0, TABS.findIndex(({ id }) => id === currentView));

  return (
    <nav
      className="app-dock"
      aria-label="主导航"
      style={{ "--dock-index": activeIndex }}
    >
      <span className="app-dock__indicator" aria-hidden="true" />
      {TABS.map(({ id, label, Icon }) => {
        const active = currentView === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setCurrentView(id)}
            aria-current={active ? "page" : undefined}
            className="app-dock__item pressable"
          >
            {createElement(Icon, { size: 18, strokeWidth: 2, "aria-hidden": true })}
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
