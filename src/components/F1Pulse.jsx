import { useState, useEffect, useCallback } from "react";
import { RefreshCw, MessageCircle, ExternalLink, TrendingUp } from "lucide-react";
import { fetchHotTopics, getCachedHotTopics } from "../services/f1api";

function SourcePill({ label, type }) {
  const isReddit = type === "reddit" || label?.startsWith("r/");
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-black border ${
        isReddit
          ? "text-[#FF4500] border-[#FF4500]/25 bg-[#FF4500]/[0.06]"
          : "text-[#F78422] border-[#F78422]/25 bg-[#F78422]/[0.06]"
      }`}
    >
      {label}
    </span>
  );
}

function HotTopicCard({ topic, rank }) {
  const [expanded, setExpanded] = useState(false);
  const ageText =
    topic.ageMinutes < 60
      ? `${topic.ageMinutes}分钟前`
      : topic.ageMinutes < 1440
        ? `${Math.floor(topic.ageMinutes / 60)}小时前`
        : `${Math.floor(topic.ageMinutes / 1440)}天前`;

  const fireEmoji = topic.sourceCount >= 4 ? "🔥🔥🔥" : topic.sourceCount >= 3 ? "🔥🔥" : "🔥";

  return (
    <div className="apple-card p-4 sm:p-5">
      {/* 排名 + 标题 */}
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 text-[28px] font-black leading-none text-f1-text-muted/40 tabular-nums">
          {String(rank).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-[14px] sm:text-[15px] font-black text-f1-text leading-snug line-clamp-2">
            {topic.title}
          </h4>
          {/* 元信息 */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-f1-text-muted">
            <span className="inline-flex items-center gap-1">
              <span className="text-f1-red">{fireEmoji}</span>
              {topic.sourceCount}源 · {topic.itemCount}条
            </span>
            <span>·</span>
            <span>{ageText}</span>
            {topic.totalComments > 0 && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5">
                  <MessageCircle size={11} />
                  {topic.totalComments}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 来源标签 */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(topic.sources || []).slice(0, 4).map((s) => (
          <SourcePill key={s} label={s} type={topic.sourceTypes?.[0]} />
        ))}
        {(topic.sources || []).length > 4 && (
          <span className="text-[11px] font-bold text-f1-text-muted self-center ml-1">
            +{topic.sources.length - 4}
          </span>
        )}
      </div>

      {/* 展开/折叠原文 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex items-center gap-1.5 text-[12px] font-black text-f1-text-muted hover:text-f1-red transition-colors tap-row rounded px-2 py-1 -ml-2"
      >
        <span className={expanded ? "rotate-180 transition-transform" : "transition-transform"}>▼</span>
        {expanded ? "收起" : "展开"}原文 ({topic.relatedItems?.length || 0}条)
      </button>

      {expanded && topic.relatedItems && (
        <div className="mt-2 border-t border-black/[0.06] pt-2 space-y-0.5">
          {topic.relatedItems.map((item, i) => (
            <a
              key={item.url || i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-black/[0.03] transition-colors group text-left"
            >
              <span className="min-w-0 flex-1 text-[12px] sm:text-[13px] font-bold text-f1-text leading-snug truncate group-hover:text-f1-red transition-colors">
                {item.title}
              </span>
              <span className="flex-shrink-0 flex items-center gap-2 text-[10px] font-bold text-f1-text-muted">
                <SourcePill label={item.source} type={item.sourceType} />
                {item.score > 0 && <span>▲{item.score}</span>}
                {item.comments > 0 && (
                  <span className="inline-flex items-center gap-0.5">
                    <MessageCircle size={10} />{item.comments}
                  </span>
                )}
              </span>
              <ExternalLink size={12} className="flex-shrink-0 text-f1-text-muted/40 group-hover:text-f1-red transition-colors" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function F1Pulse() {
  const [data, setData] = useState(() => getCachedHotTopics());
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHotTopics();
      if (res) {
        setData(res);
      } else {
        setError("数据获取失败");
      }
    } catch {
      setError("网络异常");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 首次加载：有缓存先用缓存，无缓存主动拉
    if (!data) {
      refresh();
    }

    // 定时刷新（5 分钟）
    const timer = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const topics = data?.topics || [];
  const empty = !loading && topics.length === 0;

  if (empty && !error) return null; // 无数据不显示模块

  return (
    <section className="animate-in fade-in" style={{ animationDelay: "160ms" }}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-f1-red opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-f1-red"></span>
          </span>
          <h2 className="text-[18px] font-black text-f1-text tracking-tight">
            围场热点
          </h2>
          <span className="hidden sm:inline text-[11px] font-bold text-f1-text-muted">
            {data?.totalItems || 0} 条信号源
          </span>
        </div>

        <div className="flex items-center gap-3">
          {data?.generatedAt && (
            <span className="hidden sm:inline text-[11px] font-bold text-f1-text-muted">
              更新于 {new Date(data.generatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-[12px] font-black text-f1-red hover:text-f1-text tap-row rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            {loading ? "刷新中" : "刷新"}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 rounded-lg border border-f1-red/20 bg-f1-red/[0.04] px-4 py-3 text-[12px] font-bold text-f1-red">
          {error} — 显示缓存数据
        </div>
      )}

      {/* 空状态 */}
      {empty && (
        <div className="apple-card flex flex-col items-center justify-center py-14 px-6 text-center">
          <span className="text-[36px] mb-3">📡</span>
          <h3 className="text-[16px] font-black text-f1-text mb-1">暂无热点</h3>
          <p className="text-[13px] font-bold text-f1-text-muted max-w-xs">
            当前没有检测到跨平台热议话题，赛期通常会更加活跃
          </p>
        </div>
      )}

      {/* 卡片流 */}
      {!empty && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {topics.slice(0, 8).map((topic, i) => (
            <HotTopicCard key={topic.id || i} topic={topic} rank={i + 1} />
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && topics.length === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="apple-card p-5 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-black/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-black/[0.06] rounded w-3/4" />
                  <div className="h-3 bg-black/[0.04] rounded w-1/2" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-5 w-16 bg-black/[0.04] rounded" />
                <div className="h-5 w-12 bg-black/[0.04] rounded" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
                                                                                                                                                                                                                                                                                                                                                         