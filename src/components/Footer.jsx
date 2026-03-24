export default function Footer() {
  return (
    <footer className="mt-16 bg-white border-t border-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* 品牌信息 */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M2.5 21.5C2.5 11.0066 11.0066 2.5 21.5 2.5" stroke="#8E8E93" strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="21.5" cy="2.5" r="2.5" fill="#C83232" />
              </svg>
              <span className="text-[14px] font-bold text-f1-text-muted">Barley Grid</span>
            </div>
            <p className="text-[13px] text-black/30 max-w-sm leading-relaxed">
              F1 赛季数据看板 · 仅供学习和展示用途
            </p>
            <p className="text-[12px] text-black/20 mt-1">
              数据来源：Ergast F1 API · © {new Date().getFullYear()} Barley Grid
            </p>
          </div>
          
          {/* 链接 */}
          <div className="flex items-center gap-6 text-[13px] text-black/30">
            <a href="https://ergast.com/mrd/" target="_blank" rel="noreferrer" className="hover:text-f1-text transition-colors">
              数据接口
            </a>
            <span className="text-black/10">|</span>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-f1-text transition-colors">
              开源代码
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
