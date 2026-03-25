import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header"
import Footer from "./components/Footer"
import Home from "./pages/Home"
import Schedule from "./pages/Schedule"
import Standings from "./pages/Standings"
import DriverDrawer from "./components/DriverDrawer"
import TeamDrawer from "./components/TeamDrawer"
import RaceDrawer from "./components/RaceDrawer"
import { fetchAllData } from "./services/f1api"

function App() {
  const [currentView, setCurrentViewRaw] = useState("home");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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
    if (window.history.state?.view !== view) {
      window.history.pushState({ view, scrollY: 0 }, '', `/${view === 'home' ? '' : view}`);
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
    // 初始化：替换当前历史条目
    window.history.replaceState({ view: 'home' }, '', '/');

    const handlePopState = (e) => {
      const view = e.state?.view || 'home';
      const scrollY = e.state?.scrollY || 0;
      setCurrentViewRaw(view);
      // 恢复之前保存的滚动位置（延迟等 React 渲染完）
      setTimeout(() => {
        window.scrollTo({ top: scrollY, behavior: 'instant' });
      }, 150);
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
    window.history.replaceState({ ...cur, scrollY: window.scrollY }, '');
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
      const res = await fetchAllData();
      if (isMounted && res) {
        setData(res);
        setLoading(false);
      }
    };
    
    loadData();
    const intervalId = setInterval(loadData, 60000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative bg-f1-bg z-0 text-f1-text font-sans antialiased overflow-x-hidden">
      {/* 极弱的光影层次，营造网页空气感 */}
      <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-f1-cyan/[0.04] blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-f1-red/[0.03] blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header currentView={currentView} setCurrentView={setCurrentView} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
          {loading ? (
             <div className="h-96 flex items-center justify-center animate-pulse">
                <span className="text-[14px] font-semibold tracking-widest uppercase text-f1-text-muted">Syncing Data</span>
             </div>
          ) : data === null ? (
             <div className="h-96 flex items-center justify-center">
                <span className="text-[14px] font-medium text-f1-red">无法连接赛事网络</span>
             </div>
          ) : (
            <div className="animate-in fade-in duration-700">
              {currentView === "home" && <Home setCurrentView={setCurrentView} data={data} onDriverClick={openDriver} onTeamClick={openTeam} onRaceClick={openRace} />}
              {currentView === "schedule" && <Schedule scheduleData={data.schedule} allRaces={data.allRaces} onRaceClick={openRace} />}
              {currentView === "standings" && <Standings driverData={data.driverStandings} teamData={data.teamStandings} onDriverClick={openDriver} onTeamClick={openTeam} />}
            </div>
          )}
        </main>
        <Footer />
      </div>
      <DriverDrawer driverId={selectedDriverId} data={data} onClose={closeDriver} />
      <TeamDrawer teamId={selectedTeamId} data={data} onClose={closeTeam} />
      <RaceDrawer raceRound={selectedRaceRound} data={data} onClose={closeRace} onDriverClick={(id) => { setSelectedRaceRound(null); setTimeout(() => openDriver(id), 300); }} />
    </div>
  )
}

export default App
