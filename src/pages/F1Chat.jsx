import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Trash2, HelpCircle, Send } from "lucide-react";

// 简易 Markdown 正则解析器，支持段落、加粗、无序/有序列表、换行以及代码块等，附带基本 XSS 安全防御
function formatMessageContent(content) {
  if (!content) return "";
  
  let safeContent = content;
  if (typeof safeContent !== "string") {
    try {
      safeContent = String(safeContent);
    } catch (e) {
      return "";
    }
  }

  // 1. 转义 HTML 特殊字符，防范 XSS 攻击
  safeContent = safeContent
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. 匹配加粗：**文本** -> <strong>
  safeContent = safeContent.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-f1-red bg-f1-red/[0.02] px-1 py-0.5 rounded">$1</strong>');
  
  // 3. 匹配行内代码：`code` -> <code>
  safeContent = safeContent.replace(/`(.*?)`/g, '<code class="font-mono text-[11.5px] bg-black/[0.04] text-f1-red px-1.5 py-0.5 rounded border border-black/[0.05]">$1</code>');

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

    // 匹配无序列表: - item
    const ulMatch = line.match(/^\s*[-*]\s+(.*)/);
    if (ulMatch) {
      if (inList !== 'ul') {
        closeList();
        formattedBlocks.push('<ul class="list-disc pl-5 my-1.5 space-y-1 text-f1-text-muted">');
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
        formattedBlocks.push('<ol class="list-decimal pl-5 my-1.5 space-y-1 text-f1-text-muted">');
        inList = 'ol';
      }
      formattedBlocks.push(`<li class="text-[13px] font-medium leading-relaxed">${olMatch[2]}</li>`);
      continue;
    }

    if (trimmedLine === "") {
      closeList();
      continue;
    }

    closeList();
    formattedBlocks.push(`<p class="mb-1.5 last:mb-0 text-[13px] font-medium leading-relaxed">${line}</p>`);
  }
  
  closeList();
  return formattedBlocks.join("\n");
}

export default function F1Chat({ onBack, f1Data }) {
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("f1hot:chat_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("加载聊天历史记录失败", e);
    }
    return [
      { role: "assistant", content: "你好！我是您的 Paddock AI 围场策略助手。我已经实时获取了 2026 赛季大奖赛日程、车手及车队积分榜等最新的遥测与赛况数据。您可以向我咨询任何赛事分析、车队战略部署，或者让我为您总结当前的赛段状态！" }
    ];
  });
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  const [chatModel, setChatModel] = useState(() => {
    return localStorage.getItem("f1hot:chat_model") || "deepseek-v4-flash";
  });

  useEffect(() => {
    try {
      localStorage.setItem("f1hot:chat_messages", JSON.stringify(chatMessages));
    } catch (e) {
      console.error("保存聊天历史记录失败", e);
    }
  }, [chatMessages]);

  useEffect(() => {
    try {
      localStorage.setItem("f1hot:chat_model", chatModel);
    } catch (e) {
      console.error("保存模型选择失败", e);
    }
  }, [chatModel]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const handleSendChat = async (e) => {
    if (e) e.preventDefault();
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

  const handleClear = () => {
    if (window.confirm("确定要清空当前的聊天历史记录吗？")) {
      setChatMessages([
        { role: "assistant", content: "你好！我是您的 Paddock AI 围场策略助手。我已经实时获取了 2026 赛季大奖赛日程、车手及车队积分榜等最新的遥测与赛况数据。您可以向我咨询任何赛事分析、车队战略部署，或者让我为您总结当前的赛段状态！" }
      ]);
    }
  };

  const handleSuggestClick = (text) => {
    setChatInput(text);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto px-4 pb-20 pt-20">
      
      {/* 顶部社论返回栏 */}
      <div className="flex items-center justify-between border-b border-black/[0.05] pb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-black/[0.05] bg-white px-4 py-2 text-[13px] font-bold text-f1-text hover:bg-f1-bg transition-colors"
        >
          <ArrowLeft size={15} />
          返回主页
        </button>

        <span className="font-label-caps text-[9px] text-f1-text-muted bg-black/[0.03] px-3 py-1 rounded-lg">
          TELEMETRY & RESULTS DATA SYNCED
        </span>
      </div>

      {/* 独立大屏聊天对话框 (Stitch 画廊静谧风格) */}
      <div className="apple-card p-6 bg-white flex flex-col h-[calc(100vh-240px)] min-h-[500px]">
        
        {/* AI 头部状态栏 */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.05] mb-5">
          <div className="flex items-center gap-3.5">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[14px] text-white"
              style={{ backgroundColor: '#C5A880' }}
            >
              ✦
            </div>
            <div>
              <h2 className="font-headline-md text-[18px] text-f1-text leading-none mb-1">Paddock AI</h2>
              <span className="font-label-caps text-[9px] text-f1-text-muted tracking-[0.14em]">Strategic Assistant Active</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <select
              value={chatModel}
              onChange={(e) => setChatModel(e.target.value)}
              className="font-sans text-[11px] font-bold text-f1-text-muted border border-black/[0.05] px-2.5 py-1.5 rounded-lg bg-f1-bg/40 hover:border-black/20 transition-colors outline-none cursor-pointer"
            >
              <option value="deepseek-v4-flash">DeepSeek V4 (极速走势)</option>
              <option value="deepseek-v4-pro">DeepSeek V4 Pro (深度决策)</option>
            </select>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1 font-label-caps text-[10px] text-f1-text-muted hover:text-f1-red border border-black/[0.05] px-2.5 py-1.5 rounded-lg bg-white hover:bg-f1-bg transition-colors"
            >
              <Trash2 size={12} />
              CLEAR
            </button>
          </div>
        </div>

        {/* 消息历史滚动区 */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 mb-4 custom-scrollbar overscroll-contain">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* 头像 */}
              <div 
                className={`w-8 h-8 rounded-lg font-data-numeric text-[13px] flex items-center justify-center shadow-sm flex-shrink-0 ${
                  msg.role === "user" 
                    ? "bg-f1-text text-white" 
                    : "bg-f1-lime text-white"
                }`}
              >
                {msg.role === "user" ? "U" : "A"}
              </div>
              
              {/* 气泡 */}
              <div 
                className={`px-5 py-3.5 max-w-[80%] text-[13.5px] leading-relaxed border ${
                  msg.role === "user"
                    ? "bg-f1-bg border-black/[0.03] text-f1-text rounded-2xl rounded-tr-none font-medium"
                    : "bg-white border-black/[0.04] text-f1-text rounded-2xl rounded-tl-none markdown-body text-left"
                }`}
                dangerouslySetInnerHTML={{ __html: formatMessageContent(msg.content) }}
              />
            </div>
          ))}
          {chatLoading && (
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-f1-lime text-white font-data-numeric text-[13px] flex items-center justify-center shadow-sm flex-shrink-0">
                A
              </div>
              <div className="rounded-2xl rounded-tl-none px-5 py-3.5 bg-white border border-black/[0.04] shadow-sm flex items-center gap-1.5 min-h-[44px]">
                <span className="w-1.5 h-1.5 bg-f1-text/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-f1-text/20 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-f1-text/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* 智能快捷引导问题 */}
        {chatMessages.length <= 2 && !chatLoading && (
          <div className="flex-shrink-0 pb-3 flex flex-wrap gap-2 animate-in fade-in duration-300">
            <span className="font-label-caps text-[9px] text-f1-text-muted flex items-center gap-1 py-1">SUGGESTIONS:</span>
            {[
              "帮我看看目前的车手积分榜情况",
              "下一站大奖赛时间与地点是多久？",
              "今年目前完成了多少站？"
            ].map(txt => (
              <button
                key={txt}
                onClick={() => handleSuggestClick(txt)}
                className="font-sans text-[11px] font-semibold text-f1-text-muted bg-f1-bg/50 hover:bg-f1-lime/10 hover:text-f1-lime border border-black/[0.03] rounded-lg px-3 py-1.5 transition-colors"
              >
                {txt}
              </button>
            ))}
          </div>
        )}

        {/* 输入区域 (Stitch 下边线极简设计) */}
        <form onSubmit={handleSendChat} className="flex-shrink-0 flex items-center relative border-t border-black/[0.05] pt-4 mt-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={chatLoading}
            placeholder="Query telemetry or strategy... 输入您的提问"
            className="w-full bg-f1-bg/20 border-b border-black/[0.06] focus:border-f1-text px-4 py-3.5 rounded-t-lg text-[13.5px] font-sans font-medium text-f1-text placeholder-black/30 focus:outline-none transition-colors border-x-0 border-t-0 shadow-none ring-0 focus:ring-0 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="absolute right-4 top-1/2 transform -translate-y-[10%] text-f1-text-muted hover:text-f1-text transition-colors disabled:opacity-20 cursor-pointer"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
