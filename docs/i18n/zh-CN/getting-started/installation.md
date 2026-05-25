# 安装

## 前置要求

| 要求 | 最低版本 |
|------|----------|
| Node.js | 20.0.0 |
| npm | 10.0.0 |
| Docker（可选） | 24.0.0 |

> **Docker** 是可选的。没有 Docker 时，bash 命令会直接在主机系统上运行，不具备网络或内存隔离。

---

## 通过 npm 安装（推荐）

```bash
npm install -g chinacode
```

验证安装：

```bash
chinacode --version
```

---

## 从源代码安装

```bash
# 克隆仓库
git clone https://github.com/thyagodissenha/chinacode-cli.git
cd chinacode-cli

# 安装依赖
npm install

# 构建
npm run build

# 全局链接（可选）
npm link
```

---

## 初始配置

在你将要运行 `chinacode` 的目录根目录下创建 `.env` 文件：

```bash
cp .env.example .env   # 如果可用；也可以手动创建
```

`.env` 的最小内容：

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DEFAULT_MODEL=qwen-plus
```

> 查看 [config.md](../../../reference/config.md) 了解所有可用变量。

---

## 支持的提供商

| 提供商 | BASE_URL | 常用模型 |
|--------|----------|----------|
| DashScope（Qwen） | `https://dashscope.aliyuncs.com/compatible-mode/v1` | qwen-plus, qwen-max, qwen-turbo |
| DeepSeek | `https://api.deepseek.com/v1` | deepseek-chat, deepseek-reasoner |
| SiliconFlow | `https://api.siliconflow.cn/v1` | Qwen2.5, DeepSeek-V3 |
| Ollama（本地） | `http://localhost:11434/v1` | llama3, qwen2.5-coder |
| LM Studio（本地） | `http://localhost:1234/v1` | 任何已加载的模型 |

---

## 下一步

-> [快速开始](./quick-start.md)
