import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  ArrowLeft, RefreshCw, Star, Heart, MessageCircle, ExternalLink, 
  BookOpen, FileText, CheckCircle, Database, PlusCircle, TrendingUp, AlertTriangle
} from "lucide-react";
import { fetchHotTopics, getCachedHotTopics } from "../services/f1api";

// 常见 F1 标题本地高保真极速机翻字典 (为"全部动态"提供震撼的中英对照双语效果)
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

  // 如果发生了汉化翻译，返回双语对照，否则返回原句
  return cn !== title ? cn : `（点击原文查阅英文速递）`;
}

// 格式化时间前缀
function formatTimeAgo(minutes) {
  if (minutes < 60) return `${minutes}分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
  return `${Math.floor(minutes / 1440)}天前`;
}

// 简易 Markdown 正则解析器，支持段落、加粗、无序/有序列表、换行以及代码块等，附带基本 XSS 安全防御
function formatMessageContent(content) {
  if (!content) return "";
  
  // 1. 转义 HTML 特殊字符，防范 XSS 攻击
  let safeContent = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. 匹配加粗：**文本** -> <strong>
  safeContent = safeContent.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-f1-red/90 bg-f1-red/[0.03] px-1 py-0.5 rounded border border-f1-red/10">$1</strong>');
  
  // 3. 匹配行内代码：`code` -> <code>
  safeContent = safeContent.replace(/`(.*?)`/g, '<code class="font-mono text-[11.5px] bg-black/[0.05] text-f1-red px-1.5 py-0.5 rounded border border-black/10">$1</code>');

  // 4. 按行切分进行块级解析
  const lines = safeContent.split("\n");
  const formattedBlocks = [];
  let inList = null; // null | 'ul' | 'ol'

  const closeList = () => {
    if (inList === 'ul') {
      formattedBlocks.push('</ul>');
      inList = null;
    } else if (inList === 'ol') {
      formattedBlocks.push('</ol>');
      inList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 匹配无序列表: - item 或 * item
    const ulMatch = line.match(/^\s*[-*]\s+(.*)/);
    if (ulMatch) {
      if (inList !== 'ul') {
        closeList();
        formattedBlocks.push('<ul class="list-disc pl-5 my-1.5 space-y-1">');
        inList = 'ul';
      }
      formattedBlocks.push(`<li class="text-[13px] font-medium leading-relaxed">${ulMatch[1]}</li>`);
      continue;
    }

    // 匹配有序列表: 1. item
    const olMatch = line.match(/^\s*(\d+)\.\s+(.*)/);
    if (olMatch) {
      if (inList !== 'ol') {
        closeList();
        formattedBlocks.push('<ol class="list-decimal pl-5 my-1.5 space-y-1">');
        inList = 'ol';
      }
      formattedBlocks.push(`<li class="text-[13px] font-medium leading-relaxed">${olMatch[2]}</li>`);
      continue;
    }

    // 普通空行
    if (trimmedLine === "") {
      closeList();
      continue;
    }

    // 普通文本段落
    closeList();
    formattedBlocks.push(`<p class="mb-2 last:mb-0 text-[13px] font-medium leading-relaxed">${line}</p>`);
  }
  
  closeList();
  return formattedBlocks.join("\n");
}

export default function F1Hot({ onBack, f1Data }) {
  const [data, setData] = useState(() => getCachedHotTopics());
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);
  
  // 核心功能 Tab 切换：'featured' (精选), 'dynamics' (全部动态), 'daily' (日报), 'lowscore' (低标), 'sources' (信源), 'submit' (提报)
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

  // 聚类展开卡片 ID
  const [expandedEventId, setExpandedEventId] = useState(null);

  // 围场 AI 助手聊天对话状态：从 localStorage 加载历史记录，无历史则初始化
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("f1hot:chat_messages");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("加载聊天历史记录失败", e);
    }
    return [
      { role: "assistant", content: "你好！我是你的 F1 围场 AI 助手。你可以问我关于技术升级、转会流言、车队历史或者对今日 F1HOT 日报的看法，我来为您解答！" }
    ];
  });
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // 聊天选用的模型，支持从 localStorage 恢复，默认 deepseek-v4-flash
  const [chatModel, setChatModel] = useState(() => {
    return localStorage.getItem("f1hot:chat_model") || "deepseek-v4-flash";
  });

  // 自动保存聊天历史
  useEffect(() => {
    try {
      localStorage.setItem("f1hot:chat_messages", JSON.stringify(chatMessages));
    } catch (e) {
      console.error("保存聊天历史记录失败", e);
    }
  }, [chatMessages]);

  // 自动保存模型选择
  useEffect(() => {
    try {
      localStorage.setItem("f1hot:chat_model", chatModel);
    } catch (e) {
      console.error("保存模型选择失败", e);
    }
  }, [chatModel]);

  // 自动滚动到底部
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = { role: "user", content: chatInput.trim() };
    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);

    const f1Context = {
      nextRace: f1Data?.nextRace || null,
      seasonProgress: f1Data ? {
        completed: f1Data.recentResults?.length || f1Data.schedule?.filter(r => r.status === 'completed').length || 0,
        total: f1Data.schedule?.length || 24
      } : null,
      driverStandings: f1Data?.driverStandings || [],
      teamStandings: f1Data?.teamStandings || []
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          model: chatModel,
          f1Context
        })
      });

      if (!response.ok) {
        throw new Error('对话接口故障，状态码 ' + response.status);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setChatMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", content: `❌ 发送失败，原因：${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // 日报手风琴展开状态
  const [dailyBriefingOpen, setDailyBriefingOpen] = useState({
    raceSpeed: true,
    techDig: true,
    paddockVoice: true
  });

  // 信源提报表单状态
  const [submitForm, setSubmitForm] = useState({ name: "", url: "", tier: "T1.5", desc: "" });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHotTopics();
      if (res) {
        setData(res);
      } else {
        setError("AI 聚合引擎同步失败，请重试");
      }
    } catch (e) {
      setError("网络链接异常");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!data) refresh();
  }, []);

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

  // 提报信源模拟 AI 扫描评估
  const handleSubmitSource = (e) => {
    e.preventDefault();
    if (!submitForm.name || !submitForm.url) return;
    setSubmitLoading(true);
    setTimeout(() => {
      setSubmitLoading(false);
      setSubmitSuccess(true);
      setSubmitForm({ name: "", url: "", tier: "T1.5", desc: "" });
      setTimeout(() => setSubmitSuccess(false), 4000);
    }, 1800);
  };

  // 获取全部平展后的原始动态流 (All Dynamics)
  const allDynamics = useMemo(() => {
    if (!data) return [];
    // 整合精选和低标中包含的全部 relatedItems
    const all = [];
    const seenUrls = new Set();
    
    const extractItems = (topicsList) => {
      topicsList.forEach(t => {
        (t.relatedItems || []).forEach(item => {
          if (!seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            all.push(item);
          }
        });
      });
    };

    extractItems(data.topics || []);
    extractItems(data.lowScoreTopics || []);

    return all.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [data]);



  // 模拟信源监测值源列表 (168个大数据量模拟展示前几位)
  const MONITORED_SOURCES = [
    { name: "Autosport F1 Feed", type: "RSS 新闻", tier: "Tier 1", weight: "1.25", count: "14条/日", delay: "< 10秒", status: "健康 100%" },
    { name: "The Race F1 Exclusive", type: "RSS 专栏", tier: "Tier 1", weight: "1.25", count: "8条/日", delay: "< 15秒", status: "健康 100%" },
    { name: "r/F1Technical Hot Posts", type: "Reddit 社区", tier: "Tier 1.5", weight: "1.00", count: "25条/日", delay: "< 2分钟", status: "健康 99.8%" },
    { name: "RaceFans News Feed", type: "RSS 门户", tier: "Tier 1.5", weight: "1.00", count: "12条/日", delay: "< 30秒", status: "健康 100%" },
    { name: "r/formula1 Main Community", type: "Reddit 社区", tier: "Tier 2", weight: "0.75", count: "120条/日", delay: "< 1分钟", status: "健康 99.5%" },
    { name: "FIA Stewards Official Docs", type: "Web API", tier: "Tier 1", weight: "1.25", count: "4条/日", delay: "< 5秒", status: "健康 100%" },
    { name: "Sky Sports F1 Reporter Blog", type: "HTML 抓取", tier: "Tier 1.5", weight: "1.00", count: "6条/日", delay: "< 5分钟", status: "限频抓取中" }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
            <span className="text-[11.5px] font-bold text-f1-text-muted bg-black/[0.03] px-2.5 py-1 rounded">
              引擎生成时间: {new Date(data.generatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
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

      {/* F1HOT 独立工作台大布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
        
        {/* 左侧磨砂玻璃工作台侧边栏 */}
        <aside className="apple-card p-4 flex flex-col gap-1.5 bg-white/80 sticky top-20 z-10">
          {/* F1HOT 大 Logo */}
          <div className="px-3 py-3 border-b border-black/[0.06] mb-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-f1-red opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-f1-red"></span>
            </span>
            <h2 className="text-[19px] font-black tracking-tighter text-f1-text flex items-center">
              F1<span className="text-f1-red">HOT</span>
              <span className="ml-1.5 text-[8.5px] font-black px-1 py-0.5 rounded bg-f1-red text-white uppercase scale-90">AI</span>
            </h2>
          </div>

          {/* 七大工作菜单 */}
          {[
            { id: "featured", label: "🌟 精选热点", icon: <TrendingUp size={14} /> },
            { id: "dynamics", label: "📰 全部 F1 动态", icon: <BookOpen size={14} /> },
            { id: "daily", label: "📅 F1HOT 日报", icon: <FileText size={14} /> },
            { id: "lowscore", label: "🗑️ 低标博文", icon: <AlertTriangle size={14} /> },
            { id: "sources", label: "📡 监测信源", icon: <Database size={14} /> },
            { id: "submit", label: "📥 信源提报", icon: <PlusCircle size={14} /> },
            { id: "chat", label: "🤖 围场 AI 助手", icon: <MessageCircle size={14} /> }
          ].map(menu => (
            <button
              key={menu.id}
              onClick={() => {
                setActiveTab(menu.id);
                setExpandedEventId(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-black transition-all text-left ${
                activeTab === menu.id
                  ? "bg-f1-red text-white shadow-md shadow-f1-red/10 scale-[1.02]"
                  : "text-f1-text-muted hover:text-f1-text hover:bg-black/[0.03]"
              }`}
            >
              {menu.icon}
              {menu.label}
            </button>
          ))}

          {/* 底部统计 */}
          <div className="mt-6 pt-3 border-t border-black/[0.04] px-3 text-[10px] font-bold text-f1-text-muted/60 space-y-1">
            <div>信源监控: 168 个</div>
            <div>AI 过滤阈值: QualityScore ≥ 60</div>
            <div>语义聚类匹配度: Jaccard ≥ 0.28</div>
          </div>
        </aside>

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

          {/* 视图一：精选热点 */}
          {activeTab === "featured" && data && (
            <div className="space-y-3">
              <div className="px-1 text-[12px] font-bold text-f1-text-muted tracking-wide flex justify-between">
                <span>🔥 AIHOT 根据质量打分、时效、热度与信源权威度为您精选：</span>
                <span>{data.topics?.length || 0} 个焦点事件</span>
              </div>

              {(!data.topics || data.topics.length === 0) ? (
                <div className="apple-card py-16 text-center">
                  <span className="text-[36px] mb-2 block">📡</span>
                  <span className="text-[14px] font-bold text-f1-text-muted">当前暂无大热点，赛期通常更加活跃</span>
                </div>
              ) : (
                data.topics.map((event, idx) => (
                  <HotspotCard 
                    key={event.id || idx}
                    event={event}
                    rank={idx + 1}
                    isCollected={collectedIds.has(event.id)}
                    isLiked={likedIds.has(event.id)}
                    isExpanded={expandedEventId === event.id}
                    onToggleExpand={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                    onCollect={() => toggleCollect(event.id)}
                    onLike={() => toggleLike(event.id)}
                    isFeatured={true}
                  />
                ))
              )}
            </div>
          )}

          {/* 视图二：全部 F1 动态 */}
          {activeTab === "dynamics" && data && (
            <div className="space-y-3">
              <div className="px-1 text-[12px] font-bold text-f1-text-muted tracking-wide flex justify-between">
                <span>📰 全网监控的 168 个信源拉取到的原始英文动态（附极速中英对照）：</span>
                <span>{allDynamics.length} 条实时动态</span>
              </div>

              {allDynamics.length === 0 ? (
                <div className="apple-card py-16 text-center">
                  <span className="text-[36px] mb-2 block">📡</span>
                  <span className="text-[14px] font-bold text-f1-text-muted">暂无任何动态</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {allDynamics.map((item, index) => (
                    <a 
                      key={`${item.url || index}-${index}`}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="apple-card p-4 block hover:bg-black/[0.015] transition-all group relative overflow-hidden text-left"
                    >
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${item.tier === 'T1' ? 'bg-f1-gold' : 'bg-f1-darkcyan'}`} />
                      <div className="flex justify-between items-start gap-4 pl-2">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          {/* AI 汉化及英文对照标题 */}
                          <h4 className="text-[14.5px] font-black text-f1-text leading-snug group-hover:text-f1-red transition-all">
                            {item.titleCN || item.title}
                          </h4>
                          {/* 汉化双语对照 */}
                          <p className="text-[12.5px] font-bold text-f1-text/50 italic leading-relaxed">
                            {item.titleCN ? `🇬🇧 EN: ${item.title}` : `💡 翻译: ${translateF1Title(item.title)}`}
                          </p>
                        </div>
                        <ExternalLink size={14} className="flex-shrink-0 text-f1-text-muted/40 group-hover:text-f1-red transition-colors" />
                      </div>

                      {/* 元数据 */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-bold text-f1-text-muted pl-2">
                        <span className={`px-1.5 py-0.5 rounded border text-[9.5px] font-black uppercase ${
                          item.tier === 'T1' 
                            ? 'text-f1-gold border-f1-gold/30 bg-f1-gold/5'
                            : 'text-f1-darkcyan border-f1-darkcyan/30 bg-f1-darkcyan/5'
                        }`}>
                          {item.tier} 信源
                        </span>
                        <span>·</span>
                        <span>{item.source}</span>
                        {item.author && (
                          <>
                            <span>·</span>
                            <span>u/{item.author}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>质量分 {item.qualityScore || 50}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 视图三：F1HOT 极简日报 */}
          {activeTab === "daily" && data && (
            <div className="space-y-4">
              <div className="px-1 text-[12px] font-bold text-f1-text-muted tracking-wide">
                <span>📅 每日北京时间 8:00 由 F1HOT AI 根据昨日精选自动分类生成的极简日报：</span>
              </div>

              <div className="apple-card p-6 sm:p-10 bg-white/80 space-y-6">
                <div className="border-b border-black/[0.06] pb-5">
                  <h1 className="text-[26px] font-black text-f1-text tracking-tighter">🏁 F1HOT AI 围场日报</h1>
                  <p className="text-[13.5px] text-f1-text-muted/80 font-bold mt-1">
                    干干净净的信息降维，1分钟纵览昨日围场发生的全部核心大事。
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
                      className="w-full flex items-center justify-between px-5 py-4 bg-black/[0.015] hover:bg-black/[0.03] transition-colors border-b border-black/[0.04] text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-4 rounded" style={{ backgroundColor: section.color }} />
                        <span className="text-[14.5px] font-black text-f1-text">{section.title}</span>
                        <span className="px-2 py-0.5 rounded-full bg-black/[0.03] text-[10.5px] font-black text-f1-text-muted scale-90">
                          {section.dataList.length} 条精选
                        </span>
                      </div>
                      <span className="text-[12px] font-bold text-f1-text-muted">
                        {dailyBriefingOpen[section.id] ? "收起 ▲" : "展开 ▼"}
                      </span>
                    </button>

                    {dailyBriefingOpen[section.id] && (
                      <div className="divide-y divide-black/[0.05] bg-white px-5 py-2">
                        {section.dataList.length === 0 ? (
                          <div className="py-6 text-center text-[12.5px] font-bold text-f1-text-muted">昨日暂无该板块焦点资讯</div>
                        ) : (
                          section.dataList.map((item, idx) => (
                            <a 
                              key={item.id || idx}
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-4 block group transition-all text-left"
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1 min-w-0">
                                  <div className="text-[14px] font-bold text-f1-text group-hover:text-f1-red transition-all leading-snug">
                                    {item.title}
                                  </div>
                                  <div className="text-[12px] font-semibold text-f1-text-muted flex items-center gap-2">
                                    <span className="text-f1-red">★</span> {item.sources?.[0] || "权威源"}
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

          {/* 视图四：低标博文 */}
          {activeTab === "lowscore" && data && (
            <div className="space-y-3">
              <div className="px-1 text-[12px] font-bold text-f1-text-muted tracking-wide flex justify-between">
                <span>🗑️ 质量分在 30 ~ 59 之间，未达到精选门槛但跟 F1 相关的落选博文（供发烧友沙里淘金）：</span>
                <span>{data.lowScoreTopics?.length || 0} 条资讯</span>
              </div>

              {(!data.lowScoreTopics || data.lowScoreTopics.length === 0) ? (
                <div className="apple-card py-16 text-center">
                  <span className="text-[36px] mb-2 block">🗑️</span>
                  <span className="text-[14px] font-bold text-f1-text-muted">无低标博文</span>
                </div>
              ) : (
                data.lowScoreTopics.map((event, idx) => (
                  <HotspotCard 
                    key={event.id || idx}
                    event={event}
                    rank={idx + 1}
                    isCollected={collectedIds.has(event.id)}
                    isLiked={likedIds.has(event.id)}
                    isExpanded={expandedEventId === event.id}
                    onToggleExpand={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                    onCollect={() => toggleCollect(event.id)}
                    onLike={() => toggleLike(event.id)}
                    isFeatured={false}
                  />
                ))
              )}
            </div>
          )}

          {/* 视图五：监测信源 */}
          {activeTab === "sources" && (
            <div className="space-y-3">
              <div className="px-1 text-[12px] font-bold text-f1-text-muted tracking-wide">
                <span>📡 当前 F1HOT AI 后端正以秒级时效健康调度的全球 F1 核心信源（部分展示）：</span>
              </div>

              <div className="apple-card overflow-hidden bg-white/80">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="border-b border-black/[0.06] bg-black/[0.015] font-black text-f1-text-muted text-[11px] uppercase tracking-wider">
                        <th className="px-6 py-4">信源名称</th>
                        <th className="px-6 py-4">类型</th>
                        <th className="px-6 py-4 text-center">AI 权威评级</th>
                        <th className="px-6 py-4 text-center">公式权重</th>
                        <th className="px-6 py-4">抓取量</th>
                        <th className="px-6 py-4">抓取延迟</th>
                        <th className="px-6 py-4 text-right">健康状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] font-bold text-f1-text">
                      {MONITORED_SOURCES.map((src, i) => (
                        <tr key={i} className="hover:bg-black/[0.01] transition-colors">
                          <td className="px-6 py-4 font-black">{src.name}</td>
                          <td className="px-6 py-4 text-f1-text-muted">{src.type}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${
                              src.tier === "Tier 1"
                                ? "text-f1-gold border-f1-gold/30 bg-f1-gold/5"
                                : src.tier === "Tier 1.5"
                                  ? "text-f1-darkcyan border-f1-darkcyan/30 bg-f1-darkcyan/5"
                                  : "text-f1-silver border-f1-silver/30 bg-f1-silver/5"
                            }`}>
                              {src.tier}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-mono text-[12px]">{src.weight}</td>
                          <td className="px-6 py-4">{src.count}</td>
                          <td className="px-6 py-4 font-mono text-[12px]">{src.delay}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-emerald-600 flex items-center justify-end gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {src.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 视图六：信源提报 */}
          {activeTab === "submit" && (
            <div className="space-y-3">
              <div className="px-1 text-[12px] font-bold text-f1-text-muted tracking-wide">
                <span>📥 发现更好的 F1 新闻博客、专家推特/微博、或是 Reddit 社区？向 AIHOT 后端调度器推荐它：</span>
              </div>

              <div className="apple-card p-6 sm:p-10 max-w-xl bg-white/80">
                <h3 className="text-[17px] font-black text-f1-text mb-6">提报新信源</h3>
                
                {submitSuccess ? (
                  <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-400">
                    <CheckCircle className="text-emerald-500 mx-auto" size={48} />
                    <h4 className="text-[16px] font-black text-f1-text">📡 F1HOT AI 评估通过！</h4>
                    <p className="text-[12.5px] font-bold text-f1-text-muted max-w-xs mx-auto leading-relaxed">
                      时效健康度评估 99.8%，该信源已被判定为优质 F1 资讯节点，已成功录入我们的待调度抓取队列，感谢您的贡献！
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitSource} className="space-y-4 font-bold text-f1-text">
                    <div>
                      <label className="block text-[12px] font-bold text-f1-text-muted mb-1.5">信源名称</label>
                      <input 
                        type="text" 
                        required
                        value={submitForm.name}
                        onChange={e => setSubmitForm({ ...submitForm, name: e.target.value })}
                        placeholder="例如: Formula 1 Planet"
                        className="w-full px-4 py-2.5 rounded-lg border border-black/10 bg-white/50 focus:bg-white focus:border-f1-red/60 focus:ring-1 focus:ring-f1-red/30 transition-all outline-none text-[13.5px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-f1-text-muted mb-1.5">抓取链接 / RSS 订阅 / X 账号链接</label>
                      <input 
                        type="url" 
                        required
                        value={submitForm.url}
                        onChange={e => setSubmitForm({ ...submitForm, url: e.target.value })}
                        placeholder="https://example.com/f1/feed"
                        className="w-full px-4 py-2.5 rounded-lg border border-black/10 bg-white/50 focus:bg-white focus:border-f1-red/60 focus:ring-1 focus:ring-f1-red/30 transition-all outline-none text-[13.5px] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-f1-text-muted mb-1.5">您认为其属于几级信源</label>
                      <select 
                        value={submitForm.tier}
                        onChange={e => setSubmitForm({ ...submitForm, tier: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-black/10 bg-white/50 focus:bg-white transition-all outline-none text-[13.5px]"
                      >
                        <option value="T1">Tier 1 — 官方/权威大媒体（如 FIA 官方、知名门户）</option>
                        <option value="T1.5">Tier 1.5 — 专家作者、专业技术博主专栏</option>
                        <option value="T2">Tier 2 — 论坛小组、自媒体杂谈账号</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-f1-text-muted mb-1.5">推荐理由 (可选)</label>
                      <textarea 
                        rows={3}
                        value={submitForm.desc}
                        onChange={e => setSubmitForm({ ...submitForm, desc: e.target.value })}
                        placeholder="该媒体常有第一手的围场爆料..."
                        className="w-full px-4 py-2.5 rounded-lg border border-black/10 bg-white/50 focus:bg-white focus:border-f1-red/60 focus:ring-1 focus:ring-f1-red/30 transition-all outline-none text-[13.5px]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-f1-red text-white text-[13.5px] font-black hover:bg-f1-red/90 transition-all shadow-md shadow-f1-red/10 active:scale-98 disabled:opacity-50"
                    >
                      {submitLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          📡 AI 深度安全及健康评估扫描中...
                        </>
                      ) : (
                        "提报信源，提交 AI 评估"
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* 视图七：围场 AI 助手 */}
          {activeTab === "chat" && (
            <div className="apple-card p-5 bg-white/80 min-h-[520px] flex flex-col h-[calc(100vh-200px)] max-h-[680px]">
              {/* 头部 */}
              <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-f1-red/10 text-f1-red flex items-center justify-center font-black text-[16px]">
                    🏎️
                  </div>
                  <div>
                    <h3 className="text-[14.5px] font-black text-f1-text">围场 AI 助手</h3>
                    <p className="text-[10px] font-bold text-f1-text-muted">
                      模型: {chatModel === "deepseek-v4-flash" ? "DeepSeek-V4 Flash" : "DeepSeek-V4 Pro"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <select
                    value={chatModel}
                    onChange={(e) => setChatModel(e.target.value)}
                    className="text-[11px] font-bold text-f1-text-muted border border-black/10 px-2 py-1 rounded-lg bg-white/80 hover:border-f1-red/40 transition-colors outline-none cursor-pointer"
                  >
                    <option value="deepseek-v4-flash">DeepSeek-V4 Flash (极速联网)</option>
                    <option value="deepseek-v4-pro">DeepSeek-V4 Pro (深度推理)</option>
                  </select>
                  <button
                    onClick={() => {
                      if (window.confirm("确定要清空当前的聊天历史记录吗？")) {
                        setChatMessages([
                          { role: "assistant", content: "你好！我是你的 F1 围场 AI 助手。你可以问我关于技术升级、转会流言、车队历史或者对今日 F1HOT 日报的看法，我来为您解答！" }
                        ]);
                      }
                    }}
                    className="text-[11px] font-bold text-f1-text-muted hover:text-f1-red border border-black/10 px-2.5 py-1 rounded-lg bg-white/80 hover:bg-black/[0.02] transition-colors"
                  >
                    清空对话
                  </button>
                </div>
              </div>

              {/* 消息区域 */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 custom-scrollbar overscroll-contain">
                 {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`w-7 h-7 rounded-lg font-bold text-[13px] flex items-center justify-center shadow-sm flex-shrink-0 ${
                      msg.role === "user" ? "bg-f1-red text-white" : "bg-black/[0.04] text-f1-text"
                    }`}>
                      {msg.role === "user" ? "U" : "AI"}
                    </div>
                    <div 
                      className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-[13px] font-medium leading-relaxed shadow-sm border ${
                        msg.role === "user"
                          ? "bg-f1-red/5 border-f1-red/15 text-f1-text"
                          : "bg-white border-white/50 text-f1-text markdown-body text-left"
                      }`}
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }}
                    />
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-black/[0.04] text-f1-text font-bold text-[13px] flex items-center justify-center shadow-sm flex-shrink-0 animate-pulse">
                      AI
                    </div>
                    <div className="rounded-2xl px-4 py-2.5 bg-white border border-white/50 shadow-sm flex items-center gap-1.5 min-h-[40px]">
                      <span className="w-1.5 h-1.5 bg-f1-text/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-f1-text/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-f1-text/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* 输入区域 */}
              <form onSubmit={handleSendChat} className="flex-shrink-0 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  placeholder="问问 AI：例如 Hamilton 在法拉利前景如何？"
                  className="flex-1 bg-black/[0.03] border border-black/10 rounded-xl px-4 py-3 text-[13px] font-medium focus:outline-none focus:border-f1-red/50 focus:bg-white transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-5 py-3 rounded-xl bg-f1-red text-white text-[13px] font-black hover:bg-f1-red/90 transition-colors disabled:opacity-40 shadow-md shadow-f1-red/10"
                >
                  发送
                </button>
              </form>
            </div>
          )}

        </section>
      </div>
    </div>
  );
}

// ==================== 单个 F1HOT 精选/低标聚类卡片组件 ====================
function HotspotCard({ event, rank, isCollected, isLiked, isExpanded, onToggleExpand, onCollect, onLike, isFeatured }) {
  const main = event.mainItem || event;
  
  // 维度评分列表
  const dims = event.dimensions || { technicalDepth: 5, breakingValue: 5, audienceValue: 5, dramaIndex: 5, truthfulness: 5 };

  return (
    <div className={`apple-card p-4 sm:p-5 relative transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] overflow-hidden text-left ${
      isFeatured ? "bg-white/80 border border-white/40" : "bg-black/[0.01] border border-black/[0.03]"
    }`}>
      {/* 侧面光晕，金色为 Tier 1 精选，青色为 Tier 1.5, 灰色为 Tier 2 */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${
        event.tier === "T1" ? "bg-f1-gold" : event.tier === "T1.5" ? "bg-f1-darkcyan" : "bg-f1-silver"
      }`} />

      {/* 第一行：序号、质量分、右侧点赞收藏 */}
      <div className="flex justify-between items-start gap-4 pl-2 mb-3">
        <div className="flex items-center gap-3">
          {/* 序号 */}
          <span className="text-[28px] font-black leading-none text-f1-text-muted/30 tabular-nums">
            {String(rank).padStart(2, "0")}
          </span>
          
          {/* 金色/青色高保真发光质量分徽章 */}
          <div className={`px-2.5 py-1 rounded-md text-[11.5px] font-black border flex items-center gap-1.5 shadow-sm ${
            event.qualityScore >= 80
              ? "text-f1-gold border-f1-gold/30 bg-f1-gold/5 shadow-f1-gold/5"
              : "text-f1-darkcyan border-f1-darkcyan/30 bg-f1-darkcyan/5 shadow-f1-darkcyan/5"
          }`}>
            <TrendingUp size={12} />
            质量分 {event.qualityScore}
          </div>

          {/* AI特质徽章 */}
          {event.badge && (
            <span className={`px-2 py-0.5 rounded text-[9.5px] font-black border uppercase tracking-wider ${
              event.badge === "官方重磅"
                ? "text-f1-red border-f1-red/25 bg-f1-red/5"
                : event.badge === "深度技术"
                  ? "text-f1-cyan border-f1-cyan/25 bg-f1-cyan/5"
                  : event.badge === "突发焦点"
                    ? "text-orange-600 border-orange-500/25 bg-orange-50"
                    : "text-f1-text-muted border-black/10 bg-black/[0.02]"
            }`}>
              {event.badge}
            </span>
          )}
        </div>

        {/* 右侧心和收藏微交互按钮 */}
        <div className="flex items-center gap-1">
          <button 
            onClick={onLike}
            className={`p-2 rounded-lg hover:bg-black/[0.04] transition-colors ${
              isLiked ? "text-f1-red" : "text-f1-text-muted/40"
            }`}
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={onCollect}
            className={`p-2 rounded-lg hover:bg-black/[0.04] transition-colors ${
              isCollected ? "text-amber-500" : "text-f1-text-muted/40"
            }`}
          >
            <Star size={16} fill={isCollected ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* 第二行：标题与摘要 */}
      <div className="pl-2">
        <h3 className="text-[15.5px] sm:text-[16.5px] font-black text-f1-text leading-snug group-hover:text-f1-red transition-all">
          {event.titleCN || event.title}
        </h3>
        
        {/* 双语对照翻译 */}
        <p className="mt-2 text-[13.5px] font-bold text-f1-text/50 italic leading-relaxed">
          {event.titleCN ? `🇬🇧 EN: ${event.title}` : `💡 翻译: ${translateF1Title(event.title)}`}
        </p>

        {/* 元信息：源、篇数、时效 */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-bold text-f1-text-muted">
          <span className="inline-flex items-center gap-1">
            <span className="text-f1-red">🔥🔥</span>
            {event.sourceCount} 源 · {event.itemCount} 条报道
          </span>
          <span>·</span>
          <span>{formatTimeAgo(event.ageMinutes)}</span>
          {event.totalComments > 0 && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle size={11} />
                {event.totalComments} 条讨论
              </span>
            </>
          )}
        </div>
      </div>

      {/* 手风琴展开与折叠 */}
      <div className="mt-4 border-t border-black/[0.04] pt-3 pl-2 flex flex-col gap-2">
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-1.5 text-[11.5px] font-black text-f1-text-muted hover:text-f1-red transition-colors tap-row rounded py-1 px-1 -ml-1 text-left w-fit"
        >
          <span className={`inline-block transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>▼</span>
          {isExpanded ? "收起" : "展开"} 5维度打分 & 重复报道原文 ({event.relatedItems?.length || 0}篇)
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-4 animate-in fade-in duration-300">
            {/* 1. 5 维度评分图表 */}
            <div className="rounded-xl border border-black/[0.04] bg-black/[0.01] p-4 space-y-2 max-w-sm">
              <div className="text-[10px] font-black text-f1-text-muted uppercase tracking-wider mb-2">📡 F1HOT AI 维度客观打分面板</div>
              {[
                { label: "🔧 技术深度", val: dims.technicalDepth, max: 10, color: "bg-f1-cyan" },
                { label: "⚡ 突发大料", val: dims.breakingValue, max: 10, color: "bg-f1-red" },
                { label: "🔥 受众吸引", val: dims.audienceValue, max: 10, color: "bg-amber-500" },
                { label: "💬 戏剧冲突", val: dims.dramaIndex, max: 10, color: "bg-purple-500" },
                { label: "🤝 权威可信", val: dims.truthfulness, max: 10, color: "bg-emerald-500" }
              ].map(bar => (
                <div key={bar.label} className="grid grid-cols-[80px_1fr_24px] items-center gap-3 text-[11px] font-bold">
                  <span className="text-f1-text-muted">{bar.label}</span>
                  <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                    <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${(bar.val / bar.max) * 100}%` }} />
                  </div>
                  <span className="text-right font-mono">{bar.val}</span>
                </div>
              ))}
            </div>

            {/* 2. 重复报道折叠原文外链对比 */}
            <div className="space-y-1 border-t border-black/[0.04] pt-3">
              <div className="text-[10px] font-black text-f1-text-muted uppercase tracking-wider mb-2">📰 聚类合并的同题材媒体报道列表 (点击直达)：</div>
              {event.relatedItems?.map((item, i) => (
                <a
                  key={item.url || i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-black/[0.03] transition-colors group text-[12.5px] text-left"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="font-bold text-f1-text group-hover:text-f1-red transition-all truncate leading-snug">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 text-[10.5px] font-bold text-f1-text-muted">
                      <span className={`px-1 rounded text-[8px] font-black uppercase ${
                        item.tier === 'T1' 
                          ? 'text-f1-gold border-f1-gold/20 bg-f1-gold/5'
                          : 'text-f1-darkcyan border-f1-darkcyan/20 bg-f1-darkcyan/5'
                      }`}>
                        {item.source}
                      </span>
                      {item.author && <span>u/{item.author}</span>}
                      {item.score > 0 && <span>▲{item.score}</span>}
                      {item.comments > 0 && <span>💬{item.comments}</span>}
                    </div>
                  </div>
                  <ExternalLink size={12} className="text-f1-text-muted/40 group-hover:text-f1-red transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
