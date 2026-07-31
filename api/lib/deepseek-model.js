export const DEEPSEEK_FLASH_MODEL = 'deepseek-v4-flash';
export const DEEPSEEK_PRO_MODEL = 'deepseek-v4-pro';
// DeepSeek upgraded this stable API ID to the official V4-Flash release on
// 2026-07-31. Keep the F1HOT editorial pipeline pinned to it so a shared
// DEEPSEEK_MODEL environment value cannot silently route evaluations to Pro.
export const F1HOT_EDITOR_MODEL = DEEPSEEK_FLASH_MODEL;

// Keep old environment values and saved client preferences working after the
// legacy deepseek-chat/deepseek-reasoner model names were retired.
export function mapDeepSeekModel(modelName) {
  const name = String(modelName || '').toLowerCase();

  if (name.includes('v4-pro') || name.includes('reasoner') || name.includes('deepseek-r1')) {
    return DEEPSEEK_PRO_MODEL;
  }

  return DEEPSEEK_FLASH_MODEL;
}
