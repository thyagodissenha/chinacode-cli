export type ModelTier = 'reasoning' | 'fast' | 'default' | 'local';

export interface ModelSelection {
  model: string;
  provider: string;
  tier: ModelTier;
}

export interface SessionModelOverride {
  model: string;
  provider?: string;
}

const REASONING_KEYWORDS = /\b(debug|analyze|analyse|refactor|explain|why|reason|trace|diagnose|review)\b/i;
const FAST_KEYWORDS = /\b(read|list|search|find|show|get|fetch|display|print)\b/i;
const TRIVIAL_PATTERNS = /^(hi|hello|thanks|ok|yes|no|sure)\b/i;

export function routeModel(message: string, override?: SessionModelOverride): ModelSelection {
  if (override) {
    return {
      model: override.model,
      provider: override.provider ?? 'dashscope',
      tier: 'default',
    };
  }

  const localEnabled = process.env.LOCAL_ENABLED === 'true';

  if (localEnabled && TRIVIAL_PATTERNS.test(message.trim())) {
    const localModel = process.env.LOCAL_MODEL ?? 'llama3';
    process.stderr.write(`[model: ${localModel}]\n`);
    return { model: localModel, provider: 'ollama', tier: 'local' };
  }

  if (REASONING_KEYWORDS.test(message)) {
    const model = process.env.REASONING_MODEL ?? 'deepseek-reasoner';
    process.stderr.write(`[model: ${model}]\n`);
    return { model, provider: 'deepseek', tier: 'reasoning' };
  }

  if (FAST_KEYWORDS.test(message)) {
    const model = process.env.FAST_MODEL ?? 'qwen-turbo';
    process.stderr.write(`[model: ${model}]\n`);
    return { model, provider: 'dashscope', tier: 'fast' };
  }

  const model = process.env.DEFAULT_MODEL ?? 'qwen-plus';
  process.stderr.write(`[model: ${model}]\n`);
  return { model, provider: 'dashscope', tier: 'default' };
}
