import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { getDriverImage } from "../services/f1api";

// 领奖台卡片组件 (画廊式高低错落人像排版)
function PodiumCard({ rank, item, type }) {
  const isP1 = rank === 1;
  const driverImage = type === "driver" ? getDriverImage(item.id) : null;
  const teamColor = item.teamColor || "#CBC6BD";

  return (
    <div
      className={`bg-white rounded-[20px] p-6 border flex flex-col items-center relative group transition-all duration-300 ${
        isP1
          ? "border-f1-lime/50 shadow-[0_12px_36px_rgba(0,0,0,0.03)] z-10 md:-translate-y-4"
          : "border-black/[0.045] md:mt-10"
      }`}
    >
      {/* 左上角大号衬线体排名 */}
      <div 
        className={`absolute top-4 left-5 font-display-hero text-[48px] leading-none ${
          isP1 ? "text-f1-lime" : "text-black/10 group-hover:text-f1-text transition-colors"
        }`}
      >
        {rank}
      </div>

      {/* 头像或字母占位 */}
      <div 
        className={`rounded-full overflow-hidden mb-5 mt-6 border-4 flex items-center justify-center bg-f1-bg ${
          isP1 ? "w-36 h-36 border-f1-lime/20" : "w-28 h-28 border-white shadow-sm"
        }`}
      >
        {type === "driver" && driverImage ? (
          <img
            src={driverImage}
            alt={item.lastName}
            className="w-full h-full object-cover grayscale transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="font-display-hero text-[44px] text-f1-text/25 uppercase select-none">
            {type === "driver" ? item.lastName?.[0] : item.name?.[0]}
          </div>
        )}
      </div>

      <h3 className="font-headline-md text-[20px] text-f1-text leading-tight text-center">
        {type === "driver" ? `${item.firstName?.[0]}. ${item.lastName}` : item.name}
      </h3>
      <p className="font-label-caps text-[10px] text-f1-text-muted mt-1.5 mb-5 tracking-[0.16em]">
        {type === "driver" ? item.team : "CONSTRUCTOR"}
      </p>

      <div className="font-data-numeric text-[24px] text-f1-text flex items-baseline gap-1">
        {item.points} <span className="font-sans text-[11px] font-bold text-f1-text-muted tracking-wide">PTS</span>
      </div>
      
      {/* 底部代表色细线 */}
      <div className="absolute bottom-0 left-0 w-full h-1 rounded-b-[20px]" style={{ backgroundColor: teamColor }}></div>
    </div>
  );
}

export default function Standings({ driverData = [], teamData = [], onDriverClick, onTeamClick, onBack }) {
  const [activeTab, setActiveTab] = useState("driver"); // "driver" 或 "team"
  
  const hasDrivers = driverData.length > 0;
  const hasTeams = teamData.length > 0;

  if (!hasDrivers && !hasTeams) return null;

  // 区分渲染数据
  const currentTab = activeTab === "driver" ? "driver" : "team";
  const rawList = currentTab === "driver" ? driverData : teamData;
  
  // 领奖台前三名
  const podiumItems = rawList.slice(0, 3);
  // 剩余列表
  const tableItems = rawList.slice(3);

  // 用来控制领奖台的渲染顺序（P2 - P1 - P3）
  const podiumOrder = [
    { rank: 2, item: podiumItems[1] },
    { rank: 1, item: podiumItems[0] },
    { rank: 3, item: podiumItems[2] }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-5xl mx-auto px-4 pb-20">
      
      {/* 头部社论导航 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-black/[0.05] pb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-black/[0.05] bg-white px-4 py-2 text-[13px] font-bold text-f1-text hover:bg-f1-bg transition-colors"
        >
          <ArrowLeft size={15} />
          返回概览
        </button>

        {/* 双切换大胶囊 */}
        <div className="flex rounded-xl bg-black/[0.04] p-1 border border-black/[0.01]">
          <button
            onClick={() => setActiveTab("driver")}
            className={`px-6 py-2.5 rounded-lg font-label-caps text-[11px] tracking-[0.16em] transition-all duration-300 ${
              activeTab === "driver"
                ? "bg-white text-f1-text shadow-sm"
                : "text-f1-text-muted hover:text-f1-text"
            }`}
          >
            DRIVERS / 车手
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={`px-6 py-2.5 rounded-lg font-label-caps text-[11px] tracking-[0.16em] transition-all duration-300 ${
              activeTab === "team"
                ? "bg-white text-f1-text shadow-sm"
                : "text-f1-text-muted hover:text-f1-text"
            }`}
          >
            CONSTRUCTORS / 车队
          </button>
        </div>
      </div>

      {/* 大字号社论标题 */}
      <div className="text-center">
        <p className="font-label-caps text-[10px] text-f1-text-muted tracking-[0.2em] mb-3">WORLD CHAMPIONSHIP CLASSIFICATION</p>
        <h1 className="font-display-hero text-[40px] sm:text-[60px] text-f1-text leading-none uppercase">
          {activeTab === "driver" ? "Driver Standings" : "Constructor Standings"}
        </h1>
      </div>

      {/* 领奖台区域 (P2 - P1 - P3 错落排序) */}
      {podiumItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {podiumOrder.map((pos) => {
            if (!pos.item) return null;
            return (
              <PodiumCard
                key={pos.item.id}
                rank={pos.rank}
                item={pos.item}
                type={currentTab}
              />
            );
          })}
        </div>
      )}

      {/* 积分表单分类区域 (Table) */}
      {tableItems.length > 0 && (
        <section className="max-w-4xl mx-auto pt-10 border-t border-black/[0.05]">
          <div className="font-label-caps text-[10px] text-f1-text-muted border-b border-black/[0.05] pb-4 mb-2 flex justify-between tracking-[0.18em]">
            <span>CLASSIFICATION / 排名</span>
            <span>POINTS / 积分</span>
          </div>
          
          <div className="flex flex-col divide-y divide-black/[0.04]">
            {tableItems.map((item) => (
              <div
                key={item.id}
                onClick={() => activeTab === "driver" ? onDriverClick?.(item.id) : onTeamClick?.(item.id)}
                className="flex items-center justify-between py-5 hover:bg-black/[0.015] px-4 -mx-4 rounded-xl cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-6 min-w-0">
                  <span className="font-data-numeric text-[24px] text-black/25 w-8 text-right group-hover:text-f1-text transition-colors">
                    {item.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: item.teamColor || '#CBC6BD' }}></span>
                      <span className="font-sans text-[15px] font-bold text-f1-text truncate group-hover:text-f1-red transition-colors">
                        {activeTab === "driver" ? `${item.firstName} ${item.lastName}` : item.name}
                      </span>
                    </div>
                    {activeTab === "driver" && (
                      <span className="font-sans text-[12px] text-f1-text-muted mt-1 block pl-4">
                        {item.team}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-data-numeric text-[18px] text-f1-text tabular-nums pl-4">
                  {item.points}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
