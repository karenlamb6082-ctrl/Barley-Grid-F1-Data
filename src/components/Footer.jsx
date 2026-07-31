export default function Footer({ lastUpdated }) {
  return (
    <footer className="mt-16 border-t border-black/[0.08] pb-28 pt-8 md:pb-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 text-[11px] font-semibold text-f1-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-f1-text text-[9px] font-black text-white">BG</span><span>Barley Grid · Personal race control</span></div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><span>Jolpica · F1 LiveTiming</span>{lastUpdated && <span>更新 {new Date(lastUpdated).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>}</div>
      </div>
    </footer>
  );
}
