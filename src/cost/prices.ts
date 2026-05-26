import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const BUNDLED_PRICES: Record<string, { input: number; output: number }> = require('./model-prices.json');

export interface ModelPrice {
  input: number;
  output: number;
  estimated: boolean;
}

function normalizeModelKey(model: string): string {
  return model.toUpperCase().replace(/-/g, '_').replace(/\./g, '_');
}

export function getPrice(model: string): ModelPrice {
  const envKey = normalizeModelKey(model);

  const inputEnv = process.env[`PRICE_${envKey}_INPUT`];
  const outputEnv = process.env[`PRICE_${envKey}_OUTPUT`];
  if (inputEnv && outputEnv) {
    return { input: parseFloat(inputEnv), output: parseFloat(outputEnv), estimated: false };
  }

  // Check exact match
  if (BUNDLED_PRICES[model]) {
    return { ...BUNDLED_PRICES[model], estimated: false };
  }

  // Check if starts with 'ollama' or is local
  if (model.startsWith('ollama') || model.startsWith('local')) {
    return { input: 0, output: 0, estimated: false };
  }

  // Partial match (e.g. model variant)
  for (const [key, price] of Object.entries(BUNDLED_PRICES)) {
    if (model.startsWith(key) || key.startsWith(model)) {
      return { ...price, estimated: false };
    }
  }

  return { input: 0, output: 0, estimated: true };
}
