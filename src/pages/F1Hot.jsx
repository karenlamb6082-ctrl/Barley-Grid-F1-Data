import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDown, ExternalLink, RefreshCw } from "lucide-react";
import { fetchHotTopics, getCachedHotTopics } from "../services/f1api";

function formatTimeAgo(minutes = 0) {
  if (minutes < 60) return `${minutes}分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
  return `${Math.floor(minutes / 1440)}天前`;
}

function formatCollectedAt(timestamp) {
  if (!timestamp) return "等待首次云端采集";
  const minutes = Math.max(0, Math.floor((Date.now() - Number(timestamp)) / 60000));
  return minutes < 1 ? "刚刚采集" : `${formatTimeAgo(minutes)}采集`;
}

const INFORMATION_TYPE_LABELS = {
  official: "官方确认",
  reported: "媒体报道",
  rumour: "尚未证实",
  opinion: "围场观点",
  community: "社区讨论",
};

export default function F1Hot() {
  const [initialData] = useState(() => getCachedHotTopics());
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("featured");
  const [dailyBriefingOpen, setDailyBriefingOpen] = useState({ raceSpeed: false, techDig: false, paddockVoice: false });
  const initialRefreshStarted = useRef(false);

  const refresh = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await fetchHotTopics();
      if (res) {
        setData(res);
        if (res.stale) setError("网络异常，当前显示缓存数据");
      } else if (!isSilent) setError("云端同步失败，请重试");
    } catch {
      if (!isSilent) setError("网络异常，当前显示缓存数据");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialRefreshStarted.current) {
      initialRefreshStarted.current = true;
      refresh(Boolean(initialData));
    }
  }, [initialData, refresh]);

  const topics = data?.topics?.slice(0, 12) || [];

  return (
    <div className="app-page-top mx-auto max-w-3xl pb-4 animate-in">
      <header className="border-b border-f1-text pb-3">
        <div className="flex items-end justify-between gap-4">
          <div><p className="race-mono text-[11px] font-extrabold tracking-[0.14em] text-f1-text-muted">PADDOCK BRIEF</p><h1 className="mt-1 text-[38px] font-black leading-none tracking-[-0.06em]">F1HOT</h1></div>
          <button onClick={() => refresh(false)} disabled={loading} className="pressable flex items-center gap-1.5 whitespace-nowrap border-b border-f1-text px-1 py-1 text-[11px] font-extrabold disabled:opacity-40"><RefreshCw size={12} className={loading ? "animate-spin" : ""} />{loading ? "同步中" : "同步云端"}</button>
        </div>
        <div className="mt-4 flex gap-6">
          {[["featured", "热点判断"], ["daily", "围场日报"]].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)} className={`pressable relative pb-1 text-[14px] font-extrabold ${activeTab === id ? "text-f1-text after:absolute after:inset-x-0 after:-bottom-[13px] after:h-[3px] after:bg-f1-red" : "text-f1-text-muted"}`}>{label}</button>
          ))}
        </div>
      </header>

      {error && <div className="mt-4 border-l-[3px] border-f1-red bg-red-50 px-3 py-2.5 text-[13px] font-bold text-red-700">{error}</div>}
      {loading && !data && <div className="grid min-h-[280px] place-items-center"><span className="race-mono text-[12px] font-extrabold tracking-[0.14em] text-f1-text-muted">SEMANTIC CLUSTERING...</span></div>}

      {activeTab === "featured" && data && (
        <section className="mt-5">
          <div className="flex items-end justify-between border-b border-f1-text pb-2"><h2 className="text-[18px] font-black tracking-[-0.04em]">今日焦点</h2><span className="race-mono whitespace-nowrap text-[10px] font-bold tracking-[0.14em] text-f1-text-muted">{String(topics.length).padStart(2, "0")} EVENTS</span></div>
          {topics.length === 0 ? <div className="py-16 text-center text-[14px] font-bold text-f1-text-muted">当前暂无高价值事件</div> : topics.map((event, idx) => <HotspotRow key={event.id || event.title || idx} event={event} rank={idx + 1} />)}
        </section>
      )}

      {activeTab === "daily" && data && (
        <section className="mt-5">
          <div className="flex items-end justify-between border-b border-f1-text pb-2"><h2 className="text-[18px] font-black tracking-[-0.04em]">围场日报</h2><span className="race-mono whitespace-nowrap text-[10px] font-bold tracking-[0.14em] text-f1-text-muted">DAILY EDITION</span></div>
          {[
            { id: "raceSpeed", code: "01", title: "赛事与官方", dataList: data.dailyBriefing?.raceSpeed || [] },
            { id: "techDig", code: "02", title: "技术与升级", dataList: data.dailyBriefing?.techDig || [] },
            { id: "paddockVoice", code: "03", title: "围场与转会", dataList: data.dailyBriefing?.paddockVoice || [] },
          ].map((section) => (
            <div key={section.id} className="border-b border-[#dedbd2]">
              <button onClick={() => setDailyBriefingOpen({ ...dailyBriefingOpen, [section.id]: !dailyBriefingOpen[section.id] })} className="tap-row grid min-h-[66px] w-full grid-cols-[40px_1fr_auto] items-center gap-3 py-3 text-left">
                <span className="race-mono text-[23px] font-black text-[#aaa79f]">{section.code}</span>
                <span className="min-w-0"><strong className="block truncate text-[16px] font-extrabold">{section.title}</strong><small className="race-mono mt-1 block text-[10px] font-bold tracking-[0.1em] text-f1-text-muted">{section.dataList.length} STORIES</small></span>
                <ChevronDown size={14} className={`transition-transform ${dailyBriefingOpen[section.id] ? "rotate-180" : ""}`} />
              </button>
              {dailyBriefingOpen[section.id] && <div className="border-t border-[#dedbd2] pb-2 pl-[52px]">{section.dataList.length === 0 ? <p className="py-5 text-[13px] font-semibold text-f1-text-muted">本期暂无该板块焦点资讯</p> : section.dataList.map((item, idx) => <a key={item.id || idx} href={item.url} target="_blank" rel="noopener noreferrer" className="group flex items-start justify-between gap-3 border-b border-[#dedbd2] py-3 last:border-b-0"><div className="min-w-0"><p className="text-[14px] font-extrabold leading-snug group-hover:text-f1-red">{item.titleCN || item.title}</p><p className="race-mono mt-1 truncate text-[10px] font-bold tracking-[0.08em] text-f1-text-muted">{item.sources?.[0] || "CURATED SOURCE"}</p></div><ExternalLink size={12} className="mt-1 shrink-0 text-f1-text-muted" /></a>)}</div>}
            </div>
          ))}
        </section>
      )}

      {data?.sourceHealth && <p className={`race-mono mt-5 text-center text-[10px] font-bold tracking-[0.1em] ${data.sourceHealth.status === "healthy" ? "text-f1-text-muted" : "text-amber-700"}`}>CLOUD · {formatCollectedAt(data.lastCollectedAt)} · {data.sourceHealth.healthy}/{data.sourceHealth.total} SOURCES ONLINE</p>}
    </div>
  );
}

function HotspotRow({ event, rank }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const infoType = INFORMATION_TYPE_LABELS[event.informationType] || "媒体报道";

  return (
    <article className="border-b border-[#dedbd2]">
      <button type="button" onClick={() => setIsExpanded((value) => !value)} className="tap-row grid min-h-[84px] w-full grid-cols-[42px_1fr_18px] items-center gap-2 py-3 text-left" aria-expanded={isExpanded}>
        <span className="race-mono text-[25px] font-black text-[#aaa79f]">{String(rank).padStart(2, "0")}</span>
        <span className="min-w-0"><span className="block truncate text-[10px] font-semibold text-f1-text-muted">{infoType} · {formatTimeAgo(event.ageMinutes)} · {event.sourceCount || 1} 源</span><strong className="mt-1 block text-[16px] font-extrabold leading-[1.28] tracking-[-0.02em]">{event.titleCN || event.title}</strong></span>
        <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>
      {isExpanded && (
        <div className="mb-4 ml-[50px] border-l-2 border-f1-text pl-4 animate-in">
          {event.whatHappened && <InfoBlock code="01" title="发生了什么"><p>{event.whatHappened}</p></InfoBlock>}
          {event.whyItMatters && <InfoBlock code="02" title="为什么值得关注"><p>{event.whyItMatters}</p></InfoBlock>}
          {event.confirmedFacts?.length > 0 && <InfoBlock code="03" title="已确认">{event.confirmedFacts.map((fact) => <p key={fact} className="before:mr-2 before:text-f1-red before:content-['●']">{fact}</p>)}</InfoBlock>}
          {event.unconfirmedClaims?.length > 0 && <InfoBlock code="04" title="尚未证实">{event.unconfirmedClaims.map((claim) => <p key={claim} className="before:mr-2 before:content-['○']">{claim}</p>)}</InfoBlock>}
          {event.confidenceReason && <InfoBlock code="05" title="判断依据"><p>{event.confidenceReason}</p></InfoBlock>}
          {event.relatedItems?.length > 0 && <div className="pt-3"><p className="race-mono text-[10px] font-extrabold tracking-[0.13em] text-f1-text-muted">SOURCES / {event.relatedItems.length}</p>{event.relatedItems.map((item, i) => <a key={item.url || i} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 border-b border-[#dedbd2] py-2 text-[12px] font-bold last:border-b-0"><span className="truncate">{item.source || item.title}</span><ExternalLink size={11} /></a>)}</div>}
        </div>
      )}
    </article>
  );
}

function InfoBlock({ code, title, children }) {
  return <section className="border-b border-[#dedbd2] py-3 last:border-b-0"><div className="flex items-center gap-2"><span className="race-mono text-[11px] font-black text-f1-red">{code}</span><h4 className="text-[12px] font-extrabold">{title}</h4></div><div className="mt-1.5 space-y-1 text-[13px] font-medium leading-relaxed text-f1-text/80">{children}</div></section>;
}
