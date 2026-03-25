/**
 * 滚动锁定工具 —— 解决移动端 Drawer/模态框打开时 overflow:hidden 导致滚动位置丢失的问题
 * 
 * 原理：用 position:fixed + top 偏移来锁定 body，关闭时恢复滚动位置
 * 这是业界处理 iOS Safari 等移动端浏览器的标准方案
 */

let savedScrollY = 0;
let isLocked = false;

/**
 * 锁定页面滚动（Drawer/模态框打开前调用）
 * 保存当前滚动位置，并通过 position:fixed 冻结 body
 */
export function lockScroll() {
  if (isLocked) return;
  savedScrollY = window.scrollY;
  isLocked = true;

  const body = document.body;
  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.overflow = 'hidden';
}

/**
 * 解锁页面滚动（Drawer/模态框关闭后调用）
 * 移除 position:fixed 并恢复之前的滚动位置
 */
export function unlockScroll() {
  if (!isLocked) return;
  isLocked = false;

  const body = document.body;
  body.style.position = '';
  body.style.top = '';
  body.style.left = '';
  body.style.right = '';
  body.style.overflow = '';

  // 立即恢复滚动位置
  window.scrollTo(0, savedScrollY);
}

/**
 * 获取当前保存的滚动位置（供外部读取，如 history state）
 */
export function getSavedScrollY() {
  return isLocked ? savedScrollY : window.scrollY;
}
