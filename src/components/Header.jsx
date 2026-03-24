import { useState } from 'react';

export default function Header({ currentView, setCurrentView }) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const tabs = [
    { id: 'home', label: '概览' },
    { id: 'schedule', label: '赛程追踪' },
    { id: 'standings', label: '战果与积分' }
  ];

  const handleNav = (id) => {
    setCurrentView(id);
    setMenuOpen(false);
  };

  return (
    <header className="bg-white/70 backdrop-blur-xl border-b border-black/[0.04] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 font-bold text-[18px] text-[#1C1C1E] tracking-tight cursor-pointer antialiased hover:opacity-80 transition-opacity" onClick={() => handleNav('home')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-[1px]">
             <path d="M2.5 21.5C2.5 11.0066 11.0066 2.5 21.5 2.5" stroke="#1C1C1E" strokeWidth="3.2" strokeLinecap="round" />
             <circle cx="21.5" cy="2.5" r="2.5" fill="#C83232" />
          </svg>
          <span className="pt-[1px]">Barley Grid</span>
        </div>
        
        {/* 桌面端导航 */}
        <nav className="hidden md:flex space-x-2 bg-black/[0.03] p-1 rounded-full">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.id)}
              className={`px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300 ${
                currentView === tab.id 
                  ? 'bg-white text-f1-text shadow-sm' 
                  : 'text-f1-text-muted hover:text-f1-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* 移动端汉堡菜单按钮 */}
        <button 
          className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="菜单"
        >
          <span className={`block w-5 h-0.5 bg-[#1C1C1E] rounded-full transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[4px]' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#1C1C1E] rounded-full transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[4px]' : ''}`} />
        </button>
      </div>
      
      {/* 移动端下拉菜单 */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${menuOpen ? 'max-h-48 border-t border-black/[0.04]' : 'max-h-0'}`}>
        <nav className="px-4 py-3 space-y-1 bg-white/80 backdrop-blur-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.id)}
              className={`block w-full text-left px-4 py-3 rounded-xl text-[15px] font-semibold transition-all ${
                currentView === tab.id 
                  ? 'bg-black/[0.04] text-f1-text' 
                  : 'text-f1-text-muted hover:bg-black/[0.02] hover:text-f1-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
