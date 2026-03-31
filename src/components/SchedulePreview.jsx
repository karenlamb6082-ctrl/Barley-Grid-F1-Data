import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { getRaceNameCN, getCountryNameCN } from '../services/f1api';

/**
 * 主页赛季日程预览
 * 显示最近完赛 + 接下来的几场比赛
 */
export default function SchedulePreview({ schedule = [], allRaces = [], onRaceClick, onViewAll }) {
  if (!schedule || schedule.length === 0) return null;

  const completedRoundNums = new Set(allRaces.map(r => parseInt(r.round, 10)));

  // 找到第一个 upcoming 的索引
  const firstUpcomingIdx = schedule.findIndex(r => r.status === 'upcoming');
  
  // 显示策略：最近 1 场已完赛 + 接下来 4 场 = 共 5 场
  let displayRaces = [];
  if (firstUpcomingIdx > 0) {
    // 有已完赛的，取最近 1 场
    displayRaces.push(schedule[firstUpcomingIdx - 1]);
  }
  // 接下来最多 4 场
  const upcoming = schedule.filter(r => r.status === 'upcoming').slice(0, 4);
  displayRaces = [...displayRaces, ...upcoming];

  // 如果都完赛了，显示最后 5 场
  if (displayRaces.length === 0) {
    displayRaces = schedule.slice(-5);
  }

  return (
    <div className="apple-card overflow-hidden">
      <div className="px-8 py-6 border-b border-black/5 flex justify-between items-center">
        <h3 className="text-[19px] font-semibold text-f1-text tracking-tight">赛季日程</h3>
        <button 
          className="text-[14px] font-medium text-f1-cyan hover:text-f1-text transition-colors"
          onClick={() => onViewAll && onViewAll()}
        >
          完整赛程
        </button>
      </div>

      <div className="divide-y divide-black/5">
        {displayRaces.map((race) => {
          const raceDate = new Date(race.date);
          const isCompleted = race.status === 'completed';
          const hasResults = completedRoundNums.has(parseInt(race.round, 10));
          const isNext = !isCompleted && displayRaces.filter(r => r.status === 'upcoming')[0]?.round === race.round;

          return (
            <div
              key={race.id}
              className={`px-8 py-5 flex items-center gap-5 cursor-pointer tap-row hover:bg-black/[0.02] ${isCompleted ? 'opacity-60 hover:opacity-90' : ''}`}
              onClick={() => onRaceClick && onRaceClick(race.round)}
            >
              {/* 日期 */}
              <div className="min-w-[48px] text-center flex-shrink-0">
                <div className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isCompleted ? 'text-black/30' : 'text-f1-cyan'}`}>
                  {format(raceDate, "MMM", { locale: zhCN })}
                </div>
                <div className={`text-[22px] font-bold tracking-tighter leading-tight ${isCompleted ? 'text-black/30' : 'text-f1-text'}`}>
                  {format(raceDate, "dd")}
                </div>
              </div>

              {/* 分隔线 */}
              <div className="w-px h-10 bg-black/[0.06] flex-shrink-0"></div>

              {/* 赛事信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-f1-text-muted uppercase tracking-[0.12em]">
                    R{String(race.round).padStart(2, '0')}
                  </span>
                  {isNext && (
                    <span className="text-[9px] font-bold text-f1-red bg-f1-red/10 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Next</span>
                  )}
                  {race.isSprint && (
                    <span className="text-[9px] font-bold text-f1-cyan bg-f1-cyan/10 px-1.5 py-0.5 rounded-sm">冲刺</span>
                  )}
                </div>
                <div className="text-[15px] font-semibold text-f1-text truncate leading-snug">
                  {getRaceNameCN(race.name) || race.name}
                </div>
                <div className="text-[12px] text-f1-text-muted truncate mt-0.5">
                  {getCountryNameCN(race.country)}
                </div>
              </div>

              {/* 状态 */}
              <div className="flex-shrink-0">
                {hasResults ? (
                  <span className="text-[11px] font-semibold text-f1-cyan">查看 →</span>
                ) : isCompleted ? (
                  <span className="text-[11px] font-medium text-f1-text-muted">已完赛</span>
                ) : (
                  <span className="text-[11px] font-medium text-f1-text-muted">
                    {format(raceDate, "HH:mm")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
