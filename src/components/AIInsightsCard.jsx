import { useState, useEffect } from 'react';

export default function AIInsightsCard({ news = [] }) {
  const [localNews, setLocalNews] = useState(news);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. 初次挂载时直接请求 15 条作为初始数据，解决“刷新才出来”的问题
  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setErrorMsg('');
    try {
      const newsRes = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fsearch%3Fq%3DF1%2Bwhen%3A7d%26hl%3Dzh-CN%26gl%3DCN%26ceid%3DCN%3Azh-Hans`);
      const newsData = await newsRes.json();
      if (newsData?.status === "ok" && newsData.items?.length > 0) {
        const freshNews = newsData.items.slice(0, 15).map((item) => {
          const parts = item.title.split(' - ');
          const source = parts.length > 1 ? parts.pop() : "赛车网";
          return {
            id: item.guid || item.link,
            title: parts.join(' - '),
            source: source,
            link: item.link
          };
        });
        setLocalNews(freshNews);
      } else {
        setErrorMsg('数据受限');
      }
    } catch(e) {
      console.warn("Manual RSS sync failed.", e);
      setErrorMsg('线路异常');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); 
    }
  };

  return (
    <div className="apple-card p-8 sm:p-10 flex flex-col h-[500px] sm:h-[540px] bg-white">
      <div className="flex-shrink-0 flex items-center justify-between mb-6 sm:mb-8">
        <h3 className="text-[18px] sm:text-[20px] font-bold text-f1-text tracking-tight">围场快讯</h3>
        <div className="flex items-center space-x-3">
          {errorMsg && <span className="text-[11px] text-[#C83232] font-semibold">{errorMsg}</span>}
          <div className="flex items-center space-x-1.5 bg-black/[0.03] px-2.5 py-1 rounded">
             <span className="text-[11px] text-f1-text-muted font-bold uppercase tracking-[0.1em]">全网实况 RSS</span>
             <button 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className={`ml-1 text-f1-text-muted hover:text-f1-text transition-colors p-0.5 outline-none rounded-full ${isRefreshing ? 'animate-spin text-f1-text' : ''}`}
                title="刷新实况"
             >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                   <path d="M21 3v5h-5" />
                </svg>
             </button>
          </div>
        </div>
      </div>
      
      {/* 2. 避免横向滚动的核心：添加 overflow-x-hidden，并在列表项中移除负间距 */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-3 custom-scrollbar relative">
        {localNews.length > 0 ? (
          <div className="pb-4">
            {localNews.map((item, index) => (
              <a key={`${item.id}-${index}`} href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-4 py-4 px-4 rounded-2xl hover:bg-[#FAF9F7] transition-all group cursor-pointer mb-1 border-b border-black/[0.03] last:border-none">
                 <div className="w-1.5 h-1.5 mt-2 rounded-full flex-shrink-0 transition-transform duration-300 group-hover:scale-[2]" style={{ backgroundColor: index % 3 === 0 ? '#C83232' : index % 3 === 1 ? '#1C1C1E' : '#36696A' }}></div>
                 <div className="flex-1 min-w-0">
                   <h4 className="text-[14px] sm:text-[15px] font-bold text-f1-text mb-2 tracking-tight leading-snug group-hover:text-f1-red transition-colors break-words">{item.title}</h4>
                   <p className="text-[11px] sm:text-[12px] text-f1-text-muted font-bold uppercase tracking-[0.1em]">{item.source}</p>
                 </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[14px] font-medium text-f1-text-muted animate-pulse">
             Syncing Global News...
          </div>
        )}
      </div>
    </div>
  );
}
