
import HeroBanner from "../components/HeroBanner";
import NextRaceCard from "../components/NextRaceCard";
import RecentResultsCard from "../components/RecentResultsCard";
import StandingsWidget from "../components/StandingsWidget";
import SchedulePreview from "../components/SchedulePreview";

// 交错入场动画容器
function FadeInSection({ children, delay = 0, className = '' }) {
  return (
    <div 
      className={`animate-in ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home({ setCurrentView, data, onDriverClick, onTeamClick, onRaceClick }) {
  if (!data) return null;
  const { nextRace, recentResults, driverStandings, teamStandings, schedule, allRaces } = data;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <FadeInSection delay={0}>
        <HeroBanner setCurrentView={setCurrentView} />
      </FadeInSection>

      {/* 下一场比赛 - 全宽 */}
      <FadeInSection delay={100}>
        <NextRaceCard race={nextRace} onClick={onRaceClick} />
      </FadeInSection>

      {/* 分站结果 + 赛季日程 */}
      <FadeInSection delay={200}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentResultsCard 
            results={recentResults} 
            onRaceClick={onRaceClick} 
            onViewAll={() => setCurrentView('schedule')}
          />
          <SchedulePreview
            schedule={schedule}
            allRaces={allRaces}
            onRaceClick={onRaceClick}
            onViewAll={() => setCurrentView('schedule')}
          />
        </div>
      </FadeInSection>

      {/* 积分榜 */}
      <FadeInSection delay={300}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StandingsWidget 
            title="车手积分榜" 
            data={driverStandings.slice(0, 5)} 
            type="driver"
            maxPoints={driverStandings[0]?.points || 100} 
            onViewAll={() => setCurrentView('standings')}
            onItemClick={onDriverClick}
          />
          <StandingsWidget 
            title="车队积分榜" 
            data={teamStandings.slice(0, 5)} 
            type="team"
            maxPoints={teamStandings[0]?.points || 100} 
            onViewAll={() => setCurrentView('standings', 'team-standings')}
            onItemClick={onTeamClick}
          />
        </div>
      </FadeInSection>
    </div>
  );
}
