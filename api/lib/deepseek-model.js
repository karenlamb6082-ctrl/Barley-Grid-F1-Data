export const DEEPSEEK_FLASH_MODEL = 'deepseek-v4-flash';
export const DEEPSEEK_PRO_MODEL = 'deepseek-v4-pro';

// Keep old environment values and saved client preferences working after the
// legacy deepseek-chat/deepseek-reasoner model names were retired.
export function mapDeepSeekModel(modelName) {
  const name = String(modelName || '').toLowerCase();

  if (name.includes('v4-pro') || name.includes('reasoner') || name.includes('deepseek-r1')) {
    return DEEPSEEK_PRO_MODEL;
  }

  return DEEPSEEK_FLASH_MODEL;
}
