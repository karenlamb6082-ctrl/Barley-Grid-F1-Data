import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import { getSavedScrollY } from "./utils/scrollLock";
import Header from "./components/Header"
import Footer from "./components/Footer"
import Home from "./pages/Home"
import { fetchAllData, getCachedAllData } from "./services/f1api"
import { LOADING_QUOTES } from "./data/f1Fun"

const Schedule = lazy(() => import("./pages/Schedule"));
const Standings = lazy(() => import("./pages/Standings"));
const DriverDrawer = lazy(() => import("./components/DriverDrawer"));
const TeamDrawer = lazy(() => import("./components/TeamDrawer"));
const RaceDrawer = lazy(() => import("./components/RaceDrawer"));

const APP_VIEWS = new Set(["home", "schedule", "standings"]);
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

// 加载页随机无线电台词
function LoadingQuote() {
  const [q] = useState(() => LOADING_QUOTES[Math.floor(Math.random() * LOADING_QUOTES.length)]);
  return (
    <div className="text-center max-w-xs animate-in fade-in duration-700">
      <div className="w-8 h-[2px] bg-f1-red/40 mx-auto mb-6 rounded-full"></div>
      <p className="text-[15px] font-medium text-f1-text/60 italic leading-relaxed mb-1.5">📻 {q.text}</p>
      <p className="text-[11px] text-f1-text-muted mt-1.5">{q.sub}</p>
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

  // 封装 setCurrentView：切换页面时保存当前滚动位置 + 滚回顶部 + 推入浏览器历史
  const setCurrentView = useCallback((view, scrollTarget) => {
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
        if (data || cached?.data) setStale(true);
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
    <div className="min-h-screen flex flex-col relative bg-f1-bg z-0 text-f1-text font-sans antialiased overflow-x-hidden">
      {/* 极弱的光影层次，营造网页空气感 */}
      <div className="absolute inset-0 timing-grid opacity-50 pointer-events-none"></div>
      <div className="hidden sm:block absolute top-20 right-0 w-[36vw] h-3 bg-f1-red -skew-x-12 opacity-90 pointer-events-none"></div>
      <div className="hidden sm:block absolute top-24 right-0 w-[24vw] h-1 bg-f1-lime -skew-x-12 opacity-90 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header currentView={currentView} setCurrentView={setCurrentView} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-14">
          {/* 数据过期提醒 */}
          {stale && data && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-300/40 bg-amber-50/80 px-4 py-2.5 text-[13px] font-bold text-amber-700 animate-in fade-in duration-500">
              <span>⚠️ 数据同步异常，当前展示的可能不是最新数据{lastUpdated ? `（上次更新：${new Date(lastUpdated).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}）` : ''}</span>
              <button
                onClick={async () => { setStale(false); const res = await fetchAllData(); if (res) { setData(res); setLastUpdated(Date.now()); } else { setStale(true); } }}
                className="flex-shrink-0 rounded bg-amber-600 px-3 py-1 text-[12px] font-black text-white hover:bg-amber-700"
              >重试</button>
            </div>
          )}
          {loading ? (
             <div className="h-96 flex flex-col items-center justify-center animate-pulse">
                <span className="text-[14px] font-semibold tracking-widest uppercase text-f1-text-muted mb-3">数据同步中</span>
                <LoadingQuote />
             </div>
          ) : data === null ? (
             <div className="h-96 flex flex-col items-center justify-center">
                <span className="text-[22px] mb-2">📡</span>
                <span className="text-[14px] font-medium text-f1-red">无线电故障！请检查网络连接</span>
             </div>
          ) : (
            <div className="animate-in fade-in duration-700">
              {currentView === "home" && <Home setCurrentView={setCurrentView} data={data} onDriverClick={openDriver} onTeamClick={openTeam} onRaceClick={openRace} />}
              <Suspense fallback={<ViewFallback />}>
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
        <Footer lastUpdated={lastUpdated} />
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
