export default function Standings({ driverData = [], teamData = [], onDriverClick, onTeamClick }) {
  if (!driverData.length || !teamData.length) return null;

  const maxDriverPoints = driverData[0]?.points || 100;
  const maxTeamPoints = teamData[0]?.points || 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 车手榜 */}
        <div className="apple-card flex flex-col">
          <div className="px-8 py-6 border-b border-black/5 bg-black/[0.01]">
            <h2 className="text-[19px] font-semibold text-f1-text tracking-tight">车手锦标赛</h2>
          </div>
          <div className="p-10">
            <div className="divide-y divide-black/[0.04]">
              {driverData.map((driver, index) => {
                const percent = Math.max(2, (driver.points / maxDriverPoints) * 100);
                return (
                  <div 
                    key={driver.id} 
                    className="py-6 flex items-center group -mx-6 px-6 hover:bg-[#FAF9F7] transition-colors rounded-2xl cursor-pointer"
                    onClick={() => onDriverClick && onDriverClick(driver.id)}
                  >
                    <span className={`w-8 sm:w-10 text-center text-[18px] sm:text-[20px] font-bold mr-3 sm:mr-5 flex-shrink-0 ${index === 0 ? 'text-f1-text' : index < 3 ? 'text-f1-text/80' : 'text-f1-text-muted'}`}>
                      {driver.rank}
                    </span><div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 mr-3">
                           <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: driver.teamColor || '#E6E5E3' }}></div>
                           <span className="font-semibold text-[14px] sm:text-[16px] text-f1-text truncate">{driver.firstName} {driver.lastName}</span>
                         </div>
                         <div className="font-bold text-[16px] sm:text-[18px] text-f1-text tracking-tight flex-shrink-0">{driver.points} pts</div>
                      </div>
                      <div className="h-[4px] w-full bg-black/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, backgroundColor: driver.teamColor || '#376b6d' }}></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 车队榜 */}
        <div id="team-standings" className="apple-card flex flex-col">
          <div className="px-8 py-6 border-b border-black/5 bg-black/[0.01]">
            <h2 className="text-[19px] font-semibold text-f1-text tracking-tight">车队锦标赛</h2>
          </div>
          <div className="p-10">
            <div className="divide-y divide-black/[0.04]">
              {teamData.map((team, index) => {
                const percent = Math.max(2, (team.points / maxTeamPoints) * 100);
                return (
                  <div key={team.id} className="py-6 flex items-center group -mx-6 px-6 hover:bg-[#FAF9F7] transition-colors rounded-2xl cursor-pointer"
                    onClick={() => onTeamClick && onTeamClick(team.id)}
                  >
                    <span className={`w-10 text-center text-[20px] font-bold mr-5 ${index === 0 ? 'text-f1-text' : index < 3 ? 'text-f1-text/80' : 'text-f1-text-muted'}`}>
                      {team.rank}
                    </span><div className="flex-1 px-4 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center space-x-3 truncate pr-4">
                           <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: team.teamColor || '#E6E5E3' }}></div>
                           <span className="font-semibold text-[16px] text-f1-text truncate">{team.name}</span>
                         </div>
                         <div className="font-bold text-[18px] text-f1-text tracking-tight">{team.points} pts</div>
                      </div>
                      <div className="h-[4px] w-full bg-black/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, backgroundColor: team.teamColor || '#376b6d' }}></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
