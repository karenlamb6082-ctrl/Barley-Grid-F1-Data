import { useState } from 'react';
import { FUN_FACTS } from '../data/f1Fun';

export default function Footer({ lastUpdated }) {
  // 每次组件挂载随机取一条冷知识
  const [fact] = useState(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);

  return (
    <footer className="w-full relative bg-f1-bg border-t border-black/[0.05] py-12 md:py-16 mt-20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* 高雅社论冷知识展示区 */}
        <div className="mb-12 p-6 bg-white rounded-xl border border-black/[0.03] shadow-[0_4px_16px_rgba(0,0,0,0.005)]">
          <div className="font-label-caps text-f1-lime mb-2 tracking-[0.18em]">Paddock Trivia · 围场冷知识</div>
          <p className="font-sans text-[13px] text-f1-text-muted leading-relaxed font-medium">{fact}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="font-headline-md text-[18px] font-bold text-f1-text tracking-tight">Barley Grid</span>
              <span className="w-1 h-1 rounded-full bg-f1-lime"></span>
            </div>
            <p className="font-sans text-[13px] text-f1-text-muted max-w-sm leading-relaxed">
              F1 赛季全景数据看板 · 精英围场策略与表现追踪。
            </p>
            <p className="font-sans text-[11px] text-black/30 mt-4 leading-relaxed">
              数据来源：Ergast F1 API · © {new Date().getFullYear()} Barley Grid.
              {lastUpdated && (
                <span className="ml-1.5">更新于 {new Date(lastUpdated).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </p>
          </div>
          
          <div className="flex flex-wrap md:justify-end gap-x-8 gap-y-3 font-sans text-[12px] text-f1-text-muted">
            <a href="https://ergast.com/mrd/" target="_blank" rel="noreferrer" className="hover:text-f1-red transition-colors pb-1 border-b border-transparent hover:border-f1-red/30">
              数据接口 API
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-f1-red transition-colors pb-1 border-b border-transparent hover:border-f1-red/30">
              开源代码 Code
            </a>
            <a href="#" className="hover:text-f1-red transition-colors pb-1 border-b border-transparent hover:border-f1-red/30">
              社论条款 Privacy
            </a>
            <a href="#" className="hover:text-f1-red transition-colors pb-1 border-b border-transparent hover:border-f1-red/30">
              联系围场 Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
