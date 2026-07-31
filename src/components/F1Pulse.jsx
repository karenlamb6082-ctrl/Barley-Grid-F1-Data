import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { fetchHotTopics, getCachedHotTopics } from "../services/f1api";

function ageLabel(minutes = 0) {
  if (minutes < 60) return `${minutes} 分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`;
  return `${Math.floor(minutes / 1440)} 天前`;
}

function topicType(topic) {
  const type = topic?.informationType || topic?.category || "围场动态";
  const labels = {
    report: "媒体报道", reported: "媒体报道", official: "官方确认", analysis: "分析",
    rumor: "尚未证实", rumour: "尚未证实", opinion: "围场观点", community: "社区讨论",
  };
  return labels[type] || type;
}

export default function F1Pulse({ onViewAll }) {
  const [initialData] = useState(() => getCachedHotTopics());
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const initialRefreshStarted = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchHotTopics();
      if (result) {
        setData(result);
        if (result.stale) setError("正在显示上次更新");
      } else setError("暂时无法更新");
    } catch {
      setError("正在显示上次更新");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData && !initialRefreshStarted.current) {
      initialRefreshStarted.current = true;
      refresh();
    }
    const timer = setInterval(refresh, 3 * 60 * 1000);
    return () => clearInterval(timer);
  }, [initialData, refresh]);

  const topics = data?.topics?.slice(0, 3) || [];
  return (
    <section className="mt-6">
      <div className="flex items-end justify-between border-b border-f1-text pb-2">
        <h2 className="text-[20px] font-black tracking-[-0.045em]">F1 HOT</h2>
        <div className="flex items-center gap-2">
          <span className="race-mono text-[10px] font-bold tracking-[0.14em] text-f1-text-muted">PADDOCK BRIEF / {String(topics.length).padStart(2, "0")}</span>
          <button onClick={refresh} disabled={loading} className="pressable text-f1-text-muted disabled:opacity-40" aria-label="刷新热点"><RefreshCw size={13} className={loading ? "animate-spin" : ""} /></button>
        </div>
      </div>
      {error && <p className="mt-2 text-[12px] font-semibold text-amber-700">{error}</p>}
      <div>
        {topics.map((topic, index) => (
          <article key={topic.id || index} className="grid min-h-[68px] grid-cols-[42px_1fr_14px] items-center gap-2 border-b border-[#dedbd2] py-2.5">
            <span className="race-mono text-[24px] font-black text-[#aaa79f]">{String(index + 1).padStart(2, "0")}</span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold text-f1-text-muted">{topicType(topic)} · {ageLabel(topic.ageMinutes)}</p>
              <h3 className="mt-1 line-clamp-2 text-[16px] font-extrabold leading-[1.25] tracking-[-0.02em]">{topic.titleCN || topic.title}</h3>
            </div>
            <ArrowRight size={13} className="text-f1-text-muted" />
          </article>
        ))}
        {loading && topics.length === 0 && <div className="animate-pulse py-8"><div className="h-3 w-24 bg-black/[0.06]" /><div className="mt-3 h-4 w-4/5 bg-black/[0.08]" /></div>}
      </div>
      <button onClick={onViewAll} className="pressable mt-3 inline-flex items-center gap-1.5 text-[13px] font-extrabold">查看全部 <ArrowRight size={13} /></button>
    </section>
  );
}
