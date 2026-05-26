export interface MappedError {
  message: string;
  actionable: string;
  flag?: 'context_length_exceeded';
}

const DASHSCOPE_MODELS = ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen2.5-coder-32b-instruct'];
const DEEPSEEK_MODELS = ['deepseek-chat', 'deepseek-reasoner'];

export function mapProviderError(error: unknown, provider: string): MappedError {
  const err = error as any;
  const code: string = err?.code ?? err?.error?.code ?? err?.error?.type ?? '';
  const status: number = err?.status ?? 0;
  const msg: string = err?.message ?? '';

  if (code === 'InvalidApiKey' || code === 'invalid_api_key' || status === 401) {
    const envVar = provider === 'dashscope' ? 'DASHSCOPE_API_KEY' : provider === 'deepseek' ? 'DEEPSEEK_API_KEY' : 'OPENAI_API_KEY';
    return {
      message: 'Invalid API key.',
      actionable: `Set your API key in .env:\n  ${envVar}=sk-your-key-here`,
    };
  }

  if (code === 'Arrearage') {
    return {
      message: 'Account has outstanding balance.',
      actionable: `Visit your provider billing dashboard to resolve the balance.`,
    };
  }

  if (code === 'DataInspectionFailed') {
    return {
      message: 'Content was blocked by provider safety filter.',
      actionable: 'Rephrase your request and avoid sensitive content.',
    };
  }

  if (code === 'context_length_exceeded' || msg.includes('context_length_exceeded')) {
    return {
      message: 'Context window exceeded.',
      actionable: 'Use /compact to summarize context, or start a new session.',
      flag: 'context_length_exceeded',
    };
  }

  if (code === 'ModelNotFound' || status === 404) {
    const available = provider === 'dashscope' ? DASHSCOPE_MODELS : DEEPSEEK_MODELS;
    return {
      message: `Model not found for provider "${provider}".`,
      actionable: `Available models: ${available.join(', ')}\nUse /model <name> to switch.`,
    };
  }

  if (code === 'Throttling.RateQuota' || code === 'limit_requests' || status === 429) {
    return {
      message: 'Rate limit exceeded.',
      actionable: 'Try /model qwen-turbo for a higher rate limit.',
    };
  }

  if (code === 'FreeTierOnly') {
    return {
      message: 'Free tier quota exhausted.',
      actionable: 'Upgrade your account or switch provider with /model.',
    };
  }

  return {
    message: `API error: ${msg || 'Unknown error'}`,
    actionable: `Error code: ${code || status || 'unknown'}. Check your configuration.`,
  };
}
