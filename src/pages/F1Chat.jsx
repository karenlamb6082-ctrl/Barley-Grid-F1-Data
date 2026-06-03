import { useState, useEffect, useRef } from "react";
import { ArrowLeft, RefreshCw, MessageCircle, Send, Trash2, HelpCircle } from "lucide-react";

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

export default function F1Chat({ onBack, f1Data }) {
  // 1. 聊天对话状态：从 localStorage 加载历史记录，无历史则初始化
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
      { role: "assistant", content: "你好！我是你的 F1 围场 AI 助手。我已经实时获取了赛事日程与车手积分榜等数据。你可以问我任何技术升级、围场爆料、车队历史，或者让我为您总结当前的赛程排名！" }
    ];
  });
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // 2. 聊天选用的模型，支持从 localStorage 恢复，默认 deepseek-v4-flash
  const [chatModel, setChatModel] = useState(() => {
    return localStorage.getItem("f1hot:chat_model") || "deepseek-v4-flash";
  });

  // 3. 自动保存聊天历史与选定模型
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

  // 4. 自动滚动到底部
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // 5. 发送请求
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
        { role: "assistant", content: "你好！我是你的 F1 围场 AI 助手。我已经实时获取了赛事日程与车手积分榜等数据。你可以问我任何技术升级、围场爆料、车队历史，或者让我为您总结当前的赛程排名！" }
      ]);
    }
  };

  const handleSuggestClick = (text) => {
    setChatInput(text);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* 顶部返回导航 */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white/80 px-4 py-2 text-[14px] font-black text-f1-text hover:border-f1-red/40 hover:text-f1-red shadow-sm transition-all"
        >
          <ArrowLeft size={16} />
          返回主页
        </button>

        <span className="text-[11.5px] font-bold text-f1-text-muted bg-black/[0.03] px-2.5 py-1 rounded">
          🧠 全局赛事数据已加载
        </span>
      </div>

      {/* 独立大屏聊天对话框 */}
      <div className="apple-card p-4 sm:p-6 bg-white/80 flex flex-col h-[calc(100vh-220px)] min-h-[480px] shadow-lg border border-white/40">
        
        {/* 头部控制区域 */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-f1-red/10 text-f1-red flex items-center justify-center font-black text-[18px]">
              🏎️
            </div>
            <div>
              <h3 className="text-[15.5px] font-black text-f1-text">围场 AI 助手</h3>
              <p className="text-[10px] font-bold text-f1-text-muted">
                当前运行: {chatModel === "deepseek-v4-flash" ? "DeepSeek-V4 Flash (极速)" : "DeepSeek-V4 Pro (推理)"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <select
              value={chatModel}
              onChange={(e) => setChatModel(e.target.value)}
              className="text-[11px] font-bold text-f1-text-muted border border-black/10 px-2 py-1.5 rounded-lg bg-white/80 hover:border-f1-red/40 transition-colors outline-none cursor-pointer"
            >
              <option value="deepseek-v4-flash">DeepSeek-V4 Flash (极速联网)</option>
              <option value="deepseek-v4-pro">DeepSeek-V4 Pro (深度推理)</option>
            </select>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-f1-text-muted hover:text-f1-red border border-black/10 px-2.5 py-1.5 rounded-lg bg-white/80 hover:bg-black/[0.02] transition-colors"
            >
              <Trash2 size={12} />
              清空
            </button>
          </div>
        </div>

        {/* 消息历史滚动区 */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 custom-scrollbar overscroll-contain">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-xl font-bold text-[13px] flex items-center justify-center shadow-sm flex-shrink-0 ${
                msg.role === "user" ? "bg-f1-red text-white" : "bg-black/[0.04] text-f1-text"
              }`}>
                {msg.role === "user" ? "U" : "AI"}
              </div>
              <div 
                className={`rounded-2xl px-4 py-3 max-w-[85%] text-[13px] font-medium leading-relaxed shadow-sm border ${
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
              <div className="w-8 h-8 rounded-xl bg-black/[0.04] text-f1-text font-bold text-[13px] flex items-center justify-center shadow-sm flex-shrink-0 animate-pulse">
                AI
              </div>
              <div className="rounded-2xl px-4 py-3 bg-white border border-white/50 shadow-sm flex items-center gap-1.5 min-h-[44px]">
                <span className="w-1.5 h-1.5 bg-f1-text/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-f1-text/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-f1-text/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* 智能快捷引导问题 (在历史较短时提示) */}
        {chatMessages.length <= 2 && !chatLoading && (
          <div className="flex-shrink-0 pb-3 flex flex-wrap gap-2 animate-in fade-in duration-300">
            <span className="text-[11px] font-black text-f1-text-muted flex items-center gap-1 py-1"><HelpCircle size={12}/> 快捷提问:</span>
            {[
              "帮我看看目前的车手积分榜情况",
              "下一站大奖赛时间与地点是多久？",
              "今年目前完成了多少站？"
            ].map(txt => (
              <button
                key={txt}
                onClick={() => handleSuggestClick(txt)}
                className="text-[11px] font-bold text-f1-text-muted bg-black/[0.03] hover:bg-f1-red/5 hover:text-f1-red border border-black/[0.05] rounded-full px-3 py-1.5 transition-colors"
              >
                {txt}
              </button>
            ))}
          </div>
        )}

        {/* 输入区域 */}
        <form onSubmit={handleSendChat} className="flex-shrink-0 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={chatLoading}
            placeholder="问问 AI：例如 谁排在积分榜第一名？"
            className="flex-1 bg-black/[0.03] border border-black/10 rounded-xl px-4 py-3 text-[13.5px] font-medium focus:outline-none focus:border-f1-red/50 focus:bg-white transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="px-5 py-3 rounded-xl bg-f1-red text-white text-[13px] font-black hover:bg-f1-red/90 transition-colors disabled:opacity-40 shadow-md shadow-f1-red/10 flex items-center justify-center"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
