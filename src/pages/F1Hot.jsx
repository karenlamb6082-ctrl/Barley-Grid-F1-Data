import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, RefreshCw, Star, Heart, MessageCircle, ExternalLink, FileText, TrendingUp } from "lucide-react";
import { fetchHotTopics, getCachedHotTopics } from "../services/f1api";

// 常见 F1 标题本地高保真极速机翻字典
function translateF1Title(title) {
  let cn = title;
  const dict = [
    [/verstappen/i, "维斯塔潘"], [/norris/i, "诺里斯"], [/leclerc/i, "勒克莱尔"], [/hamilton/i, "汉密尔顿"],
    [/sainz/i, "塞恩斯"], [/russell/i, "拉塞尔"], [/piastri/i, "皮亚斯特里"], [/alonso/i, "阿隆索"],
    [/perez/i, "佩雷兹"], [/lawson/i, "劳森"], [/tsunoda/i, "角田裕毅"], [/wolff/i, "托托-沃尔夫"],
    [/horner/i, "霍纳"], [/red bull/i, "红牛车队"], [/ferrari/i, "法拉利车队"], [/mclaren/i, "迈凯伦车队"],
    [/mercedes/i, "梅赛德斯车队"], [/aston martin/i, "阿斯顿马丁车队"], [/williams/i, "威廉姆斯车队"],
    [/alpine/i, "阿尔派车队"], [/haas/i, "哈斯车队"], [/audi/i, "奥迪车队"], [/cadillac/i, "凯迪拉克车队"],
    [/penalty/i, "处罚"], [/penalised/i, "被处罚"], [/stewards/i, "干事"], [/investigation/i, "调查"],
    [/crash/i, "撞车"], [/collision/i, "碰撞"], [/accident/i, "事故"], [/dnf/i, "退赛"],
    [/retired/i, "退赛"], [/red flag/i, "红旗"], [/safety car/i, "安全车"], [/pole/i, "杆位"],
    [/qualifying/i, "排位赛"], [/quali/i, "排位赛"], [/fp1/i, "一练 FP1"], [/fp2/i, "二练 FP2"],
    [/fp3/i, "三练 FP3"], [/sprint/i, "冲刺赛"], [/contract/i, "合同"], [/signed/i, "签约"],
    [/extension/i, "续约"], [/leaving/i, "离开"], [/joining/i, "加入"], [/transfer/i, "转会"],
    [/upgrades/i, "升级件"], [/update/i, "升级更新"], [/new floor/i, "新底板"], [/wing/i, "机翼/翼片"],
    [/rumour/i, "传闻"], [/rumor/i, "传闻"], [/slams/i, "炮轰/怒喷"], [/criticizes/i, "批评"],
    [/furious/i, "狂怒"], [/angry/i, "愤怒"], [/victory/i, "胜利/夺冠"], [/win/i, "获胜"],
    [/podium/i, "领奖台"], [/stewards fine/i, "干事罚款"], [/grid drop/i, "罚退车格"]
  ];

  dict.forEach(([reg, rep]) => {
    cn = cn.replace(reg, rep);
  });

  return cn !== title ? cn : `（点击原文查阅英文速递）`;
}

// 格式化时间前缀
function formatTimeAgo(minutes) {
  if (minutes < 60) return `${minutes}分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
  return `${Math.floor(minutes / 1440)}天前`;
}

export default function F1Hot({ onBack }) {
  const [initialData] = useState(() => getCachedHotTopics());
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);
  
  // Tab 仅保留：'featured' (热点快讯), 'daily' (每日新闻)
  const [activeTab, setActiveTab] = useState("featured");
  
  // 收藏与点赞状态 (保存在 LocalStorage)
  const [collectedIds, setCollectedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("f1hot:collected") || "[]"));
    } catch { return new Set(); }
  });
  const [likedIds, setLikedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("f1hot:liked") || "[]"));
    } catch { return new Set(); }
  });

  // 日报手风琴展开状态
  const [dailyBriefingOpen, setDailyBriefingOpen] = useState({
    raceSpeed: true,
    techDig: true,
    paddockVoice: true
  });

  const refresh = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await fetchHotTopics();
      if (res) {
        setData(res);
      } else {
        if (!isSilent) setError("AI 流量引擎同步失败，请重试");
      }
    } catch {
      if (!isSilent) setError("网络链接异常");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 无论有没有本地缓存，在组件挂载时都发起刷新以保证数据最新。
    // 如果已有本地缓存，则采用静默方式在后台刷新，不闪烁 loading 动画，实现秒开且保新。
    const hasCache = !!initialData;
    refresh(hasCache);
  }, [initialData, refresh]);

  // 收藏/点赞交互逻辑
  const toggleCollect = (id) => {
    const next = new Set(collectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollectedIds(next);
    localStorage.setItem("f1hot:collected", JSON.stringify([...next]));
  };

  const toggleLike = (id) => {
    const next = new Set(likedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setLikedIds(next);
    localStorage.setItem("f1hot:liked", JSON.stringify([...next]));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pt-20">
      {/* 顶部返回导航 */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white/80 px-4 py-2 text-[14px] font-black text-f1-text hover:border-f1-red/40 hover:text-f1-red shadow-sm transition-all"
        >
          <ArrowLeft size={16} />
          返回概览
        </button>

        <div className="flex items-center gap-2">
          {data?.generatedAt && (
            <span className="hidden sm:inline-block text-[11.5px] font-bold text-f1-text-muted bg-black/[0.03] px-2.5 py-1 rounded">
              更新于: {new Date(data.generatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] font-black text-f1-red hover:bg-black/[0.02] shadow-sm disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            {loading ? "AI 聚类中" : "同步云端"}
          </button>
        </div>
      </div>

      {/* 顶部高保真胶囊式分段切换菜单 (代替原先繁杂的侧边栏，实现手机端极致手感) */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-f1-graphite rounded-xl border border-white/[0.06] shadow-md w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveTab("featured");
            }}
            className={`flex-1 sm:flex-initial px-6 py-2 rounded-lg text-[13px] font-bold transition-all btn-bounce ${
              activeTab === "featured"
                ? "bg-f1-lime text-f1-text shadow-sm font-black scale-[1.02]"
                : "text-white/65 hover:text-white"
            }`}
          >
            🔥 热点快讯
          </button>
          <button
            onClick={() => {
              setActiveTab("daily");
            }}
            className={`flex-1 sm:flex-initial px-6 py-2 rounded-lg text-[13px] font-bold transition-all btn-bounce ${
              activeTab === "daily"
                ? "bg-f1-lime text-f1-text shadow-sm font-black scale-[1.02]"
                : "text-white/65 hover:text-white"
            }`}
          >
            📅 每日新闻
          </button>
        </div>
      </div>

      {/* 右侧核心内容渲染 Feed 工作流 */}
      <section className="space-y-4">
        
        {/* 网络异常提示 */}
        {error && (
          <div className="rounded-xl border border-f1-red/20 bg-f1-red/[0.04] px-4 py-3.5 text-[13px] font-bold text-f1-red animate-in fade-in">
            ⚠️ {error} — 当前展示本地缓存数据，这可能是由于网络异常或接口受限导致。
          </div>
        )}

        {/* 加载状态 */}
        {loading && !data && (
          <div className="apple-card p-10 flex flex-col items-center justify-center min-h-[300px]">
            <div className="inline-block w-6 h-6 border-2 border-f1-red/20 border-t-f1-red rounded-full animate-spin mb-4" />
            <span className="text-[13px] font-bold text-f1-text-muted tracking-widest uppercase animate-pulse">F1HOT AI 语义引擎聚类中...</span>
          </div>
        )}

        {/* 视图一：热点快讯 */}
        {activeTab === "featured" && data && (
          <div className="space-y-3">
            <div className="px-1 text-[11.5px] font-bold text-f1-text-muted tracking-wide flex justify-between">
              <span>🔥 聚合 168 个核心信源的昨日及今日围场大事件：</span>
              <span>{data.topics?.length || 0} 个焦点</span>
            </div>

            {(!data.topics || data.topics.length === 0) ? (
              <div className="apple-card py-16 text-center">
                <span className="text-[36px] mb-2 block">📡</span>
                <span className="text-[14px] font-bold text-f1-text-muted">当前暂无大热点，赛期通常更加活跃</span>
              </div>
            ) : (
              data.topics.map((event, idx) => {
                const eventUniqueId = event.id || event.title || String(idx);
                return (
                  <HotspotCard 
                    key={eventUniqueId}
                    event={event}
                    rank={idx + 1}
                    isCollected={collectedIds.has(eventUniqueId)}
                    isLiked={likedIds.has(eventUniqueId)}
                    onCollect={() => toggleCollect(eventUniqueId)}
                    onLike={() => toggleLike(eventUniqueId)}
                  />
                );
              })
            )}
          </div>
        )}

        {/* 视图二：每日新闻 */}
        {activeTab === "daily" && data && (
          <div className="space-y-4">
            <div className="px-1 text-[11.5px] font-bold text-f1-text-muted tracking-wide">
              <span>📅 F1HOT AI 主编根据昨日大盘事件智能归类与精写生成的围场日报：</span>
            </div>

            <div className="apple-card p-5 sm:p-10 bg-white/80 space-y-6">
              <div className="border-b border-black/[0.06] pb-5">
                <h1 className="text-[23px] font-black text-f1-text tracking-tighter">🏁 F1HOT AI 围场日报</h1>
                <p className="text-[12.5px] text-f1-text-muted/80 font-bold mt-1 leading-relaxed">
                  高效的信息降维，快速吃透昨日至今围场内发生的官方公告与技术升级。
                </p>
              </div>

              {/* 三大日报手风琴 */}
              {[
                { id: "raceSpeed", title: "🏁 赛事前沿与官方重磅", dataList: data.dailyBriefing?.raceSpeed || [], color: "var(--color-f1-danger, #C83232)" },
                { id: "techDig", title: "🔧 技术解构与升级分析", dataList: data.dailyBriefing?.techDig || [], color: "var(--color-f1-darkcyan, #36696A)" },
                { id: "paddockVoice", title: "💬 围场声音与转会传闻", dataList: data.dailyBriefing?.paddockVoice || [], color: "var(--color-f1-gold, #D2B056)" }
              ].map(section => (
                <div key={section.id} className="border border-black/[0.06] rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setDailyBriefingOpen({ ...dailyBriefingOpen, [section.id]: !dailyBriefingOpen[section.id] })}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-black/[0.015] hover:bg-black/[0.03] transition-colors border-b border-black/[0.04] text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-3.5 rounded" style={{ backgroundColor: section.color }} />
                      <span className="text-[13.5px] font-black text-f1-text">{section.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/[0.03] text-[9.5px] font-black text-f1-text-muted scale-90">
                        {section.dataList.length} 条
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-f1-text-muted">
                      {dailyBriefingOpen[section.id] ? "收起 ▲" : "展开 ▼"}
                    </span>
                  </button>

                  {dailyBriefingOpen[section.id] && (
                    <div className="divide-y divide-black/[0.05] bg-white px-4 py-1">
                      {section.dataList.length === 0 ? (
                        <div className="py-6 text-center text-[12px] font-bold text-f1-text-muted">本期暂无该板块焦点资讯</div>
                      ) : (
                        section.dataList.map((item, idx) => (
                          <a 
                            key={item.id || idx}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-3.5 block group transition-all text-left"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1 min-w-0">
                                <div className="text-[13.5px] font-bold text-f1-text group-hover:text-f1-red transition-all leading-snug">
                                  {item.title}
                                </div>
                                <div className="text-[11px] font-semibold text-f1-text-muted flex items-center gap-2">
                                  <span className="text-f1-red">★</span> {item.sources?.[0] || "AI-Summarized"}
                                  <span>·</span>
                                  <span>质量分 {item.qualityScore}</span>
                                </div>
                              </div>
                              <ExternalLink size={13} className="text-f1-text-muted/40 group-hover:text-f1-red transition-colors flex-shrink-0 mt-0.5" />
                            </div>
                          </a>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </section>
    </div>
  );
}

// ==================== 单个 F1HOT 精选聚类卡片组件 ====================
const INFORMATION_TYPE_LABELS = {
  official: { label: "官方确认", className: "text-emerald-700 border-emerald-500/20 bg-emerald-50" },
  reported: { label: "媒体报道", className: "text-blue-700 border-blue-500/20 bg-blue-50" },
  rumour: { label: "尚未证实", className: "text-amber-700 border-amber-500/20 bg-amber-50" },
  opinion: { label: "围场观点", className: "text-purple-700 border-purple-500/20 bg-purple-50" },
  community: { label: "社区讨论", className: "text-f1-text-muted border-black/10 bg-black/[0.02]" },
};

function HotspotCard({ event, rank, isCollected, isLiked, onCollect, onLike }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dims = event.dimensions || { technicalDepth: 5, breakingValue: 5, audienceValue: 5, dramaIndex: 5, truthfulness: 5 };
  const infoType = INFORMATION_TYPE_LABELS[event.informationType] || INFORMATION_TYPE_LABELS.reported;

  return (
    <div className="apple-card p-5 relative transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)] overflow-hidden text-left bg-white/90 border border-black/[0.04]">
      {/* 侧面标志色，金色为 Tier 1 精选，青色为 Tier 1.5, 灰色为 Tier 2 */}
      <div className={`absolute top-0 left-0 w-1 h-full ${
        event.tier === "T1" ? "bg-f1-gold" : event.tier === "T1.5" ? "bg-f1-cyan" : "bg-f1-silver"
      }`} />

      {/* 第一行：序号、质量分、右侧点赞收藏 */}
      <div className="flex justify-between items-start gap-4 pl-2.5 mb-3">
        <div className="flex items-center gap-2.5">
          {/* 序号 */}
          <span className="font-data-numeric text-[20px] leading-none text-black/15 tabular-nums">
            {String(rank).padStart(2, "0")}
          </span>
          
          {/* 编辑价值分 */}
          <div className={`px-2.5 py-0.5 rounded-lg font-label-caps text-[9px] border flex items-center gap-1.5 shadow-sm ${
            event.qualityScore >= 80
              ? "text-f1-gold border-f1-gold/25 bg-f1-gold/5"
              : "text-f1-cyan border-f1-cyan/25 bg-f1-cyan/5"
            }`}>
            <TrendingUp size={10} />
            价值 {event.valueScore || event.qualityScore}
          </div>

          <span className={`px-2 py-0.5 rounded-lg font-label-caps text-[9px] border tracking-wider ${infoType.className}`}>
            {infoType.label}
          </span>
        </div>

        {/* 收藏/点赞 */}
        <div className="flex items-center gap-0.5">
          <button 
            onClick={onLike}
            className={`p-1.5 rounded-lg hover:bg-black/[0.04] transition-colors ${
              isLiked ? "text-f1-red" : "text-f1-text-muted/30"
            }`}
          >
            <Heart size={13} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={onCollect}
            className={`p-1.5 rounded-lg hover:bg-black/[0.04] transition-colors ${
              isCollected ? "text-f1-gold" : "text-f1-text-muted/30"
            }`}
          >
            <Star size={13} fill={isCollected ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* 第二行：标题与摘要 */}
      <div className="pl-2.5">
        <h3 className="font-headline-md text-[17px] sm:text-[18px] text-f1-text leading-snug hover:text-f1-red transition-all cursor-pointer">
          {event.titleCN || event.title}
        </h3>

        {event.whatHappened && (
          <div className="mt-3 rounded-xl border border-black/[0.04] bg-f1-bg/30 px-3.5 py-3">
            <div className="font-label-caps text-[9px] tracking-[0.12em] text-f1-text-muted">发生了什么</div>
            <p className="mt-1 text-[13px] font-semibold leading-relaxed text-f1-text">{event.whatHappened}</p>
          </div>
        )}

        {event.whyItMatters && (
          <div className="mt-2 border-l-2 border-f1-red/70 pl-3">
            <div className="font-label-caps text-[9px] tracking-[0.12em] text-f1-red">为什么值得关注</div>
            <p className="mt-1 text-[13px] leading-relaxed text-f1-text/80">{event.whyItMatters}</p>
          </div>
        )}
        
        {/* 翻译对照 */}
        <p className="mt-2 font-sans text-[12px] text-f1-text-muted/70 italic leading-relaxed">
          {event.titleCN ? `🇬🇧 EN: ${event.title}` : `💡 翻译: ${translateF1Title(event.title)}`}
        </p>

        {/* 元数据 */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10.5px] font-bold text-f1-text-muted">
          <span className="inline-flex items-center gap-1 text-f1-red">
            🔥🔥 {event.sourceCount} 源 · {event.itemCount} 报道
          </span>
          <span>·</span>
          <span>{formatTimeAgo(event.ageMinutes)}</span>
          {event.importance && <span>重要性 {event.importance}/5</span>}
          {event.confidence && <span>可信度 {event.confidence}/5</span>}
        </div>
        {event.confidenceReason && (
          <p className="mt-2 text-[11px] leading-relaxed text-f1-text-muted">判断依据：{event.confidenceReason}</p>
        )}
        {event.tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {event.tags.map(tag => <span key={tag} className="rounded bg-black/[0.035] px-2 py-1 text-[9px] font-bold text-f1-text-muted">{tag}</span>)}
          </div>
        )}
      </div>

      {/* 手风琴详情折叠 */}
      <div className="mt-3 border-t border-black/[0.04] pt-2.5 pl-2 flex flex-col gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-[11px] font-black text-f1-text-muted hover:text-f1-red transition-colors tap-row rounded py-0.5 px-1 -ml-1 text-left w-fit"
        >
          <span className={`inline-block transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>▼</span>
          {isExpanded ? "收起" : "展开"} 维度评分与重复报道原文 ({event.relatedItems?.length || 0}篇)
        </button>

        {isExpanded && (
          <div className="mt-1.5 space-y-3.5 animate-in fade-in duration-300">
            {(event.confirmedFacts?.length > 0 || event.unconfirmedClaims?.length > 0) && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-50/60 p-3">
                  <div className="text-[10px] font-black text-emerald-700">已确认事实</div>
                  <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-f1-text/75">
                    {event.confirmedFacts?.length > 0 ? event.confirmedFacts.map(fact => <li key={fact}>• {fact}</li>) : <li>暂无可独立确认的事实</li>}
                  </ul>
                </div>
                <div className="rounded-xl border border-amber-500/15 bg-amber-50/60 p-3">
                  <div className="text-[10px] font-black text-amber-700">仍待证实</div>
                  <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-f1-text/75">
                    {event.unconfirmedClaims?.length > 0 ? event.unconfirmedClaims.map(claim => <li key={claim}>• {claim}</li>) : <li>没有额外的未证实说法</li>}
                  </ul>
                </div>
              </div>
            )}
            {/* 5 维度评分图表 */}
            <div className="rounded-xl border border-black/[0.04] bg-black/[0.01] p-3 space-y-1.5 max-w-xs">
              {[
                { label: "🔧 技术深度", val: dims.technicalDepth, max: 10, color: "bg-f1-cyan" },
                { label: "⚡ 突发大料", val: dims.breakingValue, max: 10, color: "bg-f1-red" },
                { label: "🔥 受众吸引", val: dims.audienceValue, max: 10, color: "bg-amber-500" },
                { label: "💬 戏剧冲突", val: dims.dramaIndex, max: 10, color: "bg-purple-500" },
                { label: "🤝 权威可信", val: dims.truthfulness, max: 10, color: "bg-emerald-500" }
              ].map(bar => (
                <div key={bar.label} className="grid grid-cols-[68px_1fr_16px] items-center gap-2 text-[10px] font-bold">
                  <span className="text-f1-text-muted">{bar.label}</span>
                  <div className="h-1 rounded-full bg-black/5 overflow-hidden">
                    <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${(bar.val / bar.max) * 100}%` }} />
                  </div>
                  <span className="text-right font-mono">{bar.val}</span>
                </div>
              ))}
            </div>

            {/* 重复报道外链列表 */}
            <div className="space-y-1 border-t border-black/[0.04] pt-2.5">
              <div className="text-[9.5px] font-black text-f1-text-muted uppercase tracking-wider mb-1.5">📰 聚类合并的同题材报道列表 (点击阅读原文)：</div>
              {event.relatedItems?.map((item, i) => (
                <a
                  key={item.url || i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 p-1.5 rounded-lg hover:bg-black/[0.03] transition-colors group text-[11.5px] text-left"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="font-bold text-f1-text group-hover:text-f1-red transition-all truncate leading-snug">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-f1-text-muted">
                      <span className={`px-1 rounded text-[8px] font-black uppercase ${
                        item.tier === 'T1' 
                          ? 'text-f1-gold border-f1-gold/20 bg-f1-gold/5'
                          : 'text-f1-darkcyan border-f1-darkcyan/20 bg-f1-darkcyan/5'
                      }`}>
                        {item.source}
                      </span>
                      {item.author && <span>u/{item.author}</span>}
                    </div>
                  </div>
                  <ExternalLink size={11} className="text-f1-text-muted/40 group-hover:text-f1-red transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
