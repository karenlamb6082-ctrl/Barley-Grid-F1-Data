import { useState, useEffect, useRef } from 'react';
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
  const panelRef = useRef(null);
  const gestureRef = useRef(null);

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
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [triggerId]);

  // 组件卸载时确保滚动锁定被完全释放
  useEffect(() => {
    return () => unlockScroll();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 260);
  };

  const resetPanelStyle = () => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.removeProperty('transition');
    panel.style.removeProperty('transform');
    panel.style.removeProperty('will-change');
  };

  const drawerProps = {
    ref: panelRef,
    style: { touchAction: 'pan-y' },
    onPointerDown: (event) => {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      if (!isOpen || gestureRef.current || event.pointerType === 'mouse' && event.button !== 0) return;
      const panel = panelRef.current;
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      if (event.clientX > rect.left + 32) return;
      gestureRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastTime: performance.now(),
        velocity: 0,
        dragging: false,
      };
    },
    onPointerMove: (event) => {
      const gesture = gestureRef.current;
      const panel = panelRef.current;
      if (!gesture || !panel || gesture.pointerId !== event.pointerId) return;
      const dx = Math.max(0, event.clientX - gesture.startX);
      const dy = Math.abs(event.clientY - gesture.startY);
      if (!gesture.dragging) {
        if (dx < 10 && dy < 10) return;
        if (dy > dx) { gestureRef.current = null; return; }
        gesture.dragging = true;
        panel.setPointerCapture(event.pointerId);
        panel.style.transition = 'none';
        panel.style.willChange = 'transform';
      }
      const now = performance.now();
      const elapsed = Math.max(1, now - gesture.lastTime);
      gesture.velocity = (event.clientX - gesture.lastX) / elapsed;
      gesture.lastX = event.clientX;
      gesture.lastTime = now;
      panel.style.transform = `translateX(${dx}px)`;
    },
    onPointerUp: (event) => {
      const gesture = gestureRef.current;
      const panel = panelRef.current;
      if (!gesture || !panel || gesture.pointerId !== event.pointerId) return;
      gestureRef.current = null;
      if (!gesture.dragging) return;
      const distance = Math.max(0, event.clientX - gesture.startX);
      const shouldClose = distance >= Math.min(panel.offsetWidth * 0.28, 130) || gesture.velocity > 0.11;
      panel.style.transition = 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)';
      panel.style.transform = shouldClose ? 'translateX(100%)' : 'translateX(0)';
      window.setTimeout(() => {
        resetPanelStyle();
        if (shouldClose) handleClose();
      }, 260);
    },
    onPointerCancel: () => {
      const panel = panelRef.current;
      gestureRef.current = null;
      if (!panel) return;
      panel.style.transition = 'transform 220ms cubic-bezier(0.23, 1, 0.32, 1)';
      panel.style.transform = 'translateX(0)';
      window.setTimeout(resetPanelStyle, 220);
    },
  };

  const isVisible = !!(isOpen || activeId);

  return { isOpen, activeId, handleClose, isVisible, drawerProps };
}
