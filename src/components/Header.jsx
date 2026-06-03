import { useState } from 'react';

export default function Header({ currentView, setCurrentView }) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const tabs = [
    { id: 'home', label: '概览' },
    { id: 'f1hot', label: 'F1HOT 热点' },
    { id: 'chat', label: '围场 AI' },
    { id: 'schedule', label: '赛程追踪' },
    { id: 'standings', label: '战果与积分' }
  ];

  const handleNav = (id) => {
    setCurrentView(id);
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-f1-bg/85 backdrop-blur-md border-b border-black/[0.05]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleNav('home')}>
          <span className="font-headline-md text-[20px] font-bold text-f1-text tracking-tight pt-[2px]">Barley Grid</span>
          <span className="w-1.5 h-1.5 rounded-full bg-f1-lime"></span>
        </div>
        
        {/* 桌面端导航 */}
        <nav className="hidden md:flex items-center space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.id)}
              className={`font-sans text-[14px] pb-1 border-b transition-all duration-200 ${
                currentView === tab.id 
                  ? 'text-f1-text border-f1-text font-semibold'
                  : 'text-f1-text-muted border-transparent hover:text-f1-text'
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
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out bg-f1-bg/95 backdrop-blur-md border-b border-black/[0.04] ${menuOpen ? 'max-h-80' : 'max-h-0'}`}>
        <nav className="px-6 py-4 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.id)}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-all ${
                currentView === tab.id 
                  ? 'bg-f1-lime/10 text-f1-lime font-bold'
                  : 'text-f1-text-muted hover:bg-black/[0.02]'
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
