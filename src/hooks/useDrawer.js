import { useState, useEffect } from 'react';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

/**
 * 共享的 F1 抽屉控制 Hook
 * 处理弹窗打开/关闭逻辑、防抖锁屏控制
 * 
 * @param {string|number|null} triggerId 触发 Drawer 打开的 ID (如 driverId, teamId, raceRound)
 * @param {function} onClose 外部关闭回调
 */
export function useDrawer(triggerId, onClose) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (triggerId) {
      setActiveId(triggerId);
      lockScroll();
      // 使用双重 requestAnimationFrame 确保过渡效果在 DOM 就绪后被触发
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpen(true);
        });
      });
    } else {
      setIsOpen(false);
      unlockScroll();
      const timer = setTimeout(() => {
        setActiveId(null);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [triggerId]);

  // 组件卸载时确保滚动锁定被完全释放
  useEffect(() => {
    return () => unlockScroll();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 320);
  };

  const isVisible = !!(isOpen || activeId);

  return { isOpen, activeId, handleClose, isVisible };
}
