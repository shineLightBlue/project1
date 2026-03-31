/**
 * 权益 code → i18n feature key（layout.membership.subscriptionPlans.{tier}.features.{key}）
 * 供 /member 与 /payment/success 共用，保证两处权益展示的 i18n 一致且不遗漏。
 */
export const privilegeCodeToFeatureKey: Record<string, string> = {
  TRANSCRIBE_MINUTES: 'transcription',
  UNLIMITED_CLOUD_STORAGE: 'storage',
  TRANSCRIBE_LANGUAGES: 'languages',
  SPEAKER_IDENTIFICATION: 'speaker',
  MULTIMODAL_INPUT: 'multimodal',
  ONE_CLICK_TAGGING: 'tagging',
  TEXT_EDITING: 'editing',
  AUDIO_IMPORT: 'import',
  CHATGPT_ACCESS: 'chatgpt',
  GEMINI_ACCESS: 'gemini',
  CLAUDE_ACCESS: 'claude',
  GROK_ACCESS: 'grok',
  DEEPSEEK_ACCESS: 'deepseek',
  DOUBAO_ACCESS: 'doubao',
  TONGYI_QIANWEN_ACCESS: 'tongyiQianwen',
  MINUTES_TRANSLATION: 'translation',
  MIND_MAP: 'mindmap',
  EXPORT_FORMATS: 'export',
  PROFESSIONAL_TEMPLATES: 'templates',
  CUSTOM_TEMPLATES: 'customTemplates',
  ASK_AI: 'askAI',
}
