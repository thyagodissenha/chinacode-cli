import readline from 'readline';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
}

async function testDashScopeKey(apiKey: string): Promise<boolean> {
  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({
      apiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
    await client.models.list();
    return true;
  } catch {
    return false;
  }
}

async function testDeepSeekKey(apiKey: string): Promise<boolean> {
  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com/v1' });
    await client.models.list();
    return true;
  } catch {
    return false;
  }
}

async function testOllamaConnection(baseURL: string): Promise<string[]> {
  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: 'ollama', baseURL: `${baseURL}/v1` });
    const models = await client.models.list();
    return models.data.map((m: { id: string }) => m.id);
  } catch {
    return [];
  }
}

export async function isFirstRun(): Promise<boolean> {
  if (process.env.OPENAI_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.DEEPSEEK_API_KEY) {
    return false;
  }
  const envPath = join(homedir(), '.chinacode', '.env');
  try {
    await import('fs/promises').then(fs => fs.access(envPath));
    return false;
  } catch {
    return true;
  }
}

export async function runOnboardingWizard(): Promise<void> {
  console.log(chalk.bold('\n🎉 Welcome to ChinaCode CLI!\n'));
  console.log('Let\'s set up your API key to get started.\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const provider = await prompt(rl, 'Choose provider:\n  1. DashScope (Qwen models)\n  2. DeepSeek\n  3. Ollama (local)\n> ');
  const choice = provider.trim();

  const chinaDir = join(homedir(), '.chinacode');
  const envPath = join(chinaDir, '.env');
  await mkdir(chinaDir, { recursive: true });

  if (choice === '1' || choice.toLowerCase().includes('dash')) {
    let valid = false;
    let apiKey = '';
    while (!valid) {
      apiKey = await prompt(rl, 'DashScope API key (sk-...): ');
      apiKey = apiKey.trim();
      process.stdout.write('Validating...');
      valid = await testDashScopeKey(apiKey);
      if (!valid) {
        console.log(chalk.red('\n✗ Invalid key. Get one at: https://dashscope.aliyuncs.com/'));
      } else {
        console.log(chalk.green(' ✓'));
      }
    }
    const content = `DASHSCOPE_API_KEY=${apiKey}\nDEFAULT_PROVIDER=dashscope\nDEFAULT_MODEL=qwen-plus\n`;
    await writeFile(envPath, content, 'utf8');
  } else if (choice === '2' || choice.toLowerCase().includes('deep')) {
    let valid = false;
    let apiKey = '';
    while (!valid) {
      apiKey = await prompt(rl, 'DeepSeek API key: ');
      apiKey = apiKey.trim();
      process.stdout.write('Validating...');
      valid = await testDeepSeekKey(apiKey);
      if (!valid) {
        console.log(chalk.red('\n✗ Invalid key. Get one at: https://platform.deepseek.com/'));
      } else {
        console.log(chalk.green(' ✓'));
      }
    }
    const content = `DEEPSEEK_API_KEY=${apiKey}\nDEFAULT_PROVIDER=deepseek\nDEFAULT_MODEL=deepseek-chat\n`;
    await writeFile(envPath, content, 'utf8');
  } else {
    const ollamaURL = (await prompt(rl, 'Ollama URL [http://localhost:11434]: ')).trim() || 'http://localhost:11434';
    process.stdout.write('Connecting to Ollama...');
    const models = await testOllamaConnection(ollamaURL);
    if (models.length === 0) {
      console.log(chalk.red('\n✗ Could not connect to Ollama. Make sure it\'s running.'));
    } else {
      console.log(chalk.green(` ✓ Found models: ${models.slice(0, 3).join(', ')}`));
    }
    const content = `OLLAMA_BASE_URL=${ollamaURL}/v1\nDEFAULT_PROVIDER=ollama\nDEFAULT_MODEL=${models[0] ?? 'llama3'}\nLOCAL_ENABLED=true\n`;
    await writeFile(envPath, content, 'utf8');
  }

  rl.close();
  console.log(chalk.green('\n✓ Configuration saved to ~/.chinacode/.env'));
  console.log('\nTry: "List all TypeScript files in this project"\n');
}
