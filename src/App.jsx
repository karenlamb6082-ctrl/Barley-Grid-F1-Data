import { lazy, Suspense, useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { getSavedScrollY, forceUnlockScroll } from "./utils/scrollLock";
import AppDock from "./components/AppDock"
import Home from "./pages/Home"
import { fetchAllData, getCachedAllData } from "./services/f1api"

const Schedule = lazy(() => import("./pages/Schedule"));
const Standings = lazy(() => import("./pages/Standings"));
const F1Hot = lazy(() => import("./pages/F1Hot"));
const DriverDrawer = lazy(() => import("./components/DriverDrawer"));
const TeamDrawer = lazy(() => import("./components/TeamDrawer"));
const RaceDrawer = lazy(() => import("./components/RaceDrawer"));

const APP_VIEWS = new Set(["home", "f1hot", "schedule", "standings"]);
const LIVE_REFRESH_INTERVAL = 60 * 1000;
const RACE_WEEK_REFRESH_INTERVAL = 2 * 60 * 1000;
const DEFAULT_REFRESH_INTERVAL = 15 * 60 * 1000;
const SESSION_DURATION_MINUTES = {
  fp1: 60,
  fp2: 60,
  fp3: 60,
  sprintQualifying: 45,
  sprint: 60,
  qualifying: 60,
  race: 120,
};

function getViewFromLocation() {
  if (typeof window === "undefined") return "home";
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  if (!path) return "home";
  return APP_VIEWS.has(path) ? path : "home";
}

function getPathForView(view) {
  return view === "home" ? "/" : `/${view}`;
}

function getDataRefreshInterval(data) {
  const sessions = data?.nextRace?.sessions;
  if (!sessions) return DEFAULT_REFRESH_INTERVAL;

  const now = Date.now();
  const sessionTimes = Object.entries(sessions)
    .filter(([, value]) => value)
    .map(([key, value]) => ({
      key,
      start: new Date(value).getTime(),
      duration: (SESSION_DURATION_MINUTES[key] || 60) * 60 * 1000,
    }));

  const isLiveWindow = sessionTimes.some(({ start, duration }) => (
    now >= start - 30 * 60 * 1000 && now <= start + duration + 2 * 60 * 60 * 1000
  ));
  if (isLiveWindow) return LIVE_REFRESH_INTERVAL;

  const isRaceWeekWindow = sessionTimes.some(({ start }) => Math.abs(start - now) <= 24 * 60 * 60 * 1000);
  return isRaceWeekWindow ? RACE_WEEK_REFRESH_INTERVAL : DEFAULT_REFRESH_INTERVAL;
}

function SystemState({ code, title, detail }) {
  return (
    <div className="w-full max-w-[320px] border-y border-f1-text py-6 text-left animate-in fade-in">
      <div className="flex items-center justify-between">
        <span className="race-mono text-[10px] font-black tracking-[0.16em] text-f1-red">{code}</span>
        <span className="h-2 w-2 border border-f1-text bg-f1-lime" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-[24px] font-black tracking-[-0.04em]">{title}</h2>
      <p className="mt-2 text-[12px] font-semibold leading-relaxed text-f1-text-muted">{detail}</p>
    </div>
  );
}

function ViewFallback() {
  return <div className="min-h-64" />;
}

function App() {
  const [currentView, setCurrentViewRaw] = useState(() => getViewFromLocation());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stale, setStale] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [selectedRaceRound, setSelectedRaceRound] = useState(null);
  const nativeBackState = useRef({ currentView, hasOverlay: false });

  useEffect(() => {
    nativeBackState.current = {
      currentView,
      hasOverlay: Boolean(selectedDriverId || selectedTeamId || selectedRaceRound),
    };
  }, [currentView, selectedDriverId, selectedTeamId, selectedRaceRound]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let disposed = false;
    let listenerHandle;

    void CapacitorApp.addListener('backButton', () => {
      const { currentView: activeView, hasOverlay } = nativeBackState.current;
      if (hasOverlay || activeView !== 'home') {
        window.history.back();
      }
      // Keep the app open when Android back is invoked on the home view.
    }).then((handle) => {
      if (disposed) {
        void handle.remove();
      } else {
        listenerHandle = handle;
      }
    });

    return () => {
      disposed = true;
      if (listenerHandle) void listenerHandle.remove();
    };
  }, []);

  // 封装 setCurrentView：切换页面时保存当前滚动位置 + 滚回顶部 + 推入浏览器历史
  const setCurrentView = useCallback((view, scrollTarget) => {
    // 切换视图时，强制清除所有潜在的滚动锁定样式，防止卡死
    forceUnlockScroll();

    // 切换视图时关闭所有打开的 Drawer，防止幽灵组件挂载
    setSelectedDriverId(null);
    setSelectedTeamId(null);
    setSelectedRaceRound(null);

    // 保存当前页面的滚动位置到当前 history state
    const currentState = window.history.state || {};
    window.history.replaceState({ ...currentState, scrollY: window.scrollY }, '');
    
    setCurrentViewRaw(view);
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (window.history.state?.view !== view || window.location.pathname !== getPathForView(view)) {
      window.history.pushState({ view, scrollY: 0 }, '', getPathForView(view));
    }
    // 如果指定了滚动目标，等渲染完后滚动到对应位置
    if (scrollTarget) {
      setTimeout(() => {
        const el = document.getElementById(scrollTarget);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  // 监听浏览器返回/前进按钮（手机返回键）
  useEffect(() => {
    const initialView = getViewFromLocation();
    window.history.replaceState({ view: initialView, scrollY: window.scrollY }, '', getPathForView(initialView));

    const handlePopState = (e) => {
      // 浏览器返回/前进时，强制清除所有潜在的滚动锁定样式，防止卡死
      forceUnlockScroll();

      const view = e.state?.view || getViewFromLocation();
      setCurrentViewRaw(view);
      // 滚动恢复由 unlockScroll() 自动处理，无需手动 scrollTo
      // 关闭所有 Drawer
      setSelectedDriverId(null);
      setSelectedTeamId(null);
      setSelectedRaceRound(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Drawer 打开时：先保存当前滚动位置，再推入历史
  const saveScrollAndPush = (stateObj) => {
    const cur = window.history.state || {};
    window.history.replaceState({ ...cur, scrollY: getSavedScrollY() }, '');
    window.history.pushState(stateObj, '');
  };

  const openDriver = useCallback((id) => {
    setSelectedDriverId(id);
    saveScrollAndPush({ view: 'driver', id });
  }, []);

  const openTeam = useCallback((id) => {
    setSelectedTeamId(id);
    saveScrollAndPush({ view: 'team', id });
  }, []);

  const openRace = useCallback((round) => {
    setSelectedRaceRound(round);
    saveScrollAndPush({ view: 'race', round });
  }, []);

  const closeDriver = useCallback(() => {
    setSelectedDriverId(null);
    if (window.history.state?.view === 'driver') window.history.back();
  }, []);

  const closeTeam = useCallback(() => {
    setSelectedTeamId(null);
    if (window.history.state?.view === 'team') window.history.back();
  }, []);

  const closeRace = useCallback(() => {
    setSelectedRaceRound(null);
    if (window.history.state?.view === 'race') window.history.back();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const cached = getCachedAllData();
      if (cached?.data && isMounted) {
        setData(cached.data);
        setLastUpdated(cached.cachedAt);
        setLoading(false);
      }

      const shouldRefreshNow = !cached?.data || !cached.isFresh || getDataRefreshInterval(cached.data) <= RACE_WEEK_REFRESH_INTERVAL;
      if (!shouldRefreshNow) {
        if (isMounted) setLoading(false);
        return;
      }

      const res = await fetchAllData();
      if (isMounted && res) {
        setData(res);
        setLastUpdated(Date.now());
        setStale(false);
        setLoading(false);
      } else if (isMounted) {
        // API 失败但有缓存数据时标记过期
        if (cached?.data) setStale(true);
        setLoading(false);
      }
    };
    
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    let isMounted = true;
    const interval = getDataRefreshInterval(data);
    const intervalId = setInterval(async () => {
      const res = await fetchAllData();
      if (isMounted && res) {
        setData(res);
        setLastUpdated(Date.now());
        setStale(false);
      } else if (isMounted) {
        // 轮询失败，标记数据可能过期
        setStale(true);
      }
    }, interval);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [data]);

  return (
    <div className="app-shell min-h-screen overflow-x-hidden text-f1-text">
      {/* 极弱的光影层次，营造网页空气感 */}

      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="app-main mx-auto w-full max-w-7xl flex-1 px-3 sm:px-6 lg:px-8">
          {/* 数据过期提醒 */}
          {stale && data && (
            <div className="mb-4 flex items-center justify-between gap-3 border-y border-f1-text bg-f1-card px-3 py-3 text-[12px] font-bold animate-in fade-in">
              <span><span className="race-mono mr-2 text-[9px] font-black tracking-[0.12em] text-f1-red">STALE</span>数据同步异常，当前展示缓存数据{lastUpdated ? ` · ${new Date(lastUpdated).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
              <button
                onClick={async () => { setStale(false); const res = await fetchAllData(); if (res) { setData(res); setLastUpdated(Date.now()); } else { setStale(true); } }}
                className="pressable flex-shrink-0 border border-f1-text bg-f1-red px-3 py-1.5 text-[10px] font-black text-white"
              >重试</button>
            </div>
          )}
          {loading ? (
             <div className="flex h-96 items-center justify-center px-5">
                <SystemState code="SYNC / 01" title="正在同步赛事数据" detail="正在读取赛程、积分与围场动态，请稍候。" />
             </div>
          ) : data === null ? (
             <div className="flex h-96 items-center justify-center px-5">
                <SystemState code="OFFLINE / 00" title="数据链路中断" detail="请检查网络连接后重新进入应用。已缓存的数据不会被清除。" />
             </div>
          ) : (
            <div key={currentView} className="app-view-transition">
              {currentView === "home" && <Home setCurrentView={setCurrentView} data={data} onDriverClick={openDriver} onTeamClick={openTeam} onRaceClick={openRace} />}
              <Suspense fallback={<ViewFallback />}>
                {currentView === "f1hot" && (
                  <F1Hot
                    onBack={() => setCurrentView("home")}
                  />
                )}
                {currentView === "schedule" && (
                  <Schedule
                    scheduleData={data.schedule}
                    allRaces={data.allRaces}
                    onRaceClick={openRace}
                    onBack={() => setCurrentView("home")}
                  />
                )}
                {currentView === "standings" && (
                  <Standings
                    driverData={data.driverStandings}
                    teamData={data.teamStandings}
                    onDriverClick={openDriver}
                    onTeamClick={openTeam}
                    onBack={() => setCurrentView("home")}
                  />
                )}
              </Suspense>
            </div>
          )}
        </main>
        <AppDock currentView={currentView} setCurrentView={setCurrentView} />
      </div>
      <Suspense fallback={null}>
        {selectedDriverId && <DriverDrawer driverId={selectedDriverId} data={data} onClose={closeDriver} />}
        {selectedTeamId && <TeamDrawer teamId={selectedTeamId} data={data} onClose={closeTeam} />}
        {selectedRaceRound && (
          <RaceDrawer
            key={selectedRaceRound}
            raceRound={selectedRaceRound}
            data={data}
            onClose={closeRace}
            onDriverClick={(id) => {
              setSelectedRaceRound(null);
              setTimeout(() => openDriver(id), 550);
            }}
          />
        )}
      </Suspense>
    </div>
  )
}

export default App
