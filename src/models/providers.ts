export type ProviderName = 'dashscope' | 'deepseek' | 'ollama' | 'generic';

export interface ProviderConfig {
  name: ProviderName;
  baseURL: string;
  apiKey: string;
  defaultModel: string;
}

export function getProviderConfig(provider: ProviderName): ProviderConfig {
  switch (provider) {
    case 'dashscope':
      return {
        name: 'dashscope',
        baseURL: process.env.DASHSCOPE_BASE_URL ?? 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: process.env.DASHSCOPE_API_KEY ?? '',
        defaultModel: 'qwen-plus',
      };
    case 'deepseek':
      return {
        name: 'deepseek',
        baseURL: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1',
        apiKey: process.env.DEEPSEEK_API_KEY ?? '',
        defaultModel: 'deepseek-chat',
      };
    case 'ollama':
      return {
        name: 'ollama',
        baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
        apiKey: 'ollama',
        defaultModel: process.env.OLLAMA_DEFAULT_MODEL ?? 'llama3',
      };
    case 'generic':
      return {
        name: 'generic',
        baseURL: process.env.OPENAI_BASE_URL ?? '',
        apiKey: process.env.OPENAI_API_KEY ?? '',
        defaultModel: process.env.DEFAULT_MODEL ?? 'gpt-4o',
      };
  }
}

export function resolveDefaultProvider(): ProviderName {
  const p = process.env.DEFAULT_PROVIDER ?? 'dashscope';
  if (['dashscope', 'deepseek', 'ollama', 'generic'].includes(p)) {
    return p as ProviderName;
  }
  return 'dashscope';
}
