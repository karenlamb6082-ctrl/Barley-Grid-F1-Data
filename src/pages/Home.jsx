
import NextRaceCard from "../components/NextRaceCard";
import RecentResultsCard from "../components/RecentResultsCard";
import StandingsWidget from "../components/StandingsWidget";

export default function Home({ setCurrentView, data, onDriverClick, onTeamClick, onRaceClick }) {
  if (!data) return null;
  const { nextRace, recentResults, driverStandings, teamStandings } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 下一场比赛 - 全宽 */}
      <NextRaceCard race={nextRace} onClick={onRaceClick} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentResultsCard results={recentResults} onRaceClick={onRaceClick} />
        </div>
        <div className="flex flex-col gap-6">
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
      </div>
    </div>
  );
}
