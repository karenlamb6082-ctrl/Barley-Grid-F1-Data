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
    <header className="bg-f1-bg/95 border-b border-black/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 font-black text-[18px] text-f1-text tracking-tight cursor-pointer antialiased hover:opacity-80 transition-opacity" onClick={() => handleNav('home')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-[1px]">
             <path d="M2.5 21.5C2.5 11.0066 11.0066 2.5 21.5 2.5" stroke="#101010" strokeWidth="3.2" strokeLinecap="round" />
             <circle cx="21.5" cy="2.5" r="2.5" fill="#FF2D2D" />
          </svg>
          <span className="pt-[1px]">Barley Grid</span>
          <span className="hidden sm:block w-10 h-1 bg-f1-lime -skew-x-12 ml-1"></span>
        </div>
        
        {/* 桌面端导航 */}
        <nav className="hidden md:flex space-x-1.5 bg-[#171717] text-white p-1 rounded-lg border border-black/10 shadow-[0_10px_28px_rgba(16,16,16,0.14)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.id)}
              className={`btn-bounce px-5 py-1.5 rounded-md text-[13px] font-bold ${
                currentView === tab.id 
                  ? 'bg-[#D7FF38] text-[#101010] shadow-sm'
                  : 'text-white/65 hover:text-white hover:bg-white/10'
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
          <span className={`block w-5 h-0.5 bg-f1-text rounded-full transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[4px]' : ''}`} />
          <span className={`block w-5 h-0.5 bg-f1-text rounded-full transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[4px]' : ''}`} />
        </button>
      </div>
      
      {/* 移动端下拉菜单 */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${menuOpen ? 'max-h-48 border-t border-black/[0.04]' : 'max-h-0'}`}>
        <nav className="px-4 py-3 space-y-1 bg-[#171717] text-white">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.id)}
              className={`block w-full text-left px-4 py-3 rounded-xl text-[15px] font-semibold transition-all ${
                currentView === tab.id 
                  ? 'bg-[#D7FF38] text-[#101010]'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
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
