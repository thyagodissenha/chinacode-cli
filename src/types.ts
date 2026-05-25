// Shared types used across all modules

export type Role = 'system' | 'user' | 'assistant' | 'tool'

export interface ToolCallFunction {
  name: string
  arguments: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: ToolCallFunction
}

export interface Message {
  role: Role
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

export interface ToolResult {
  success: boolean
  output: string
  error?: string
}

export interface Tool {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema object
  execute: (args: unknown) => Promise<ToolResult>
}

export type ProviderType =
  | 'dashscope'
  | 'deepseek'
  | 'siliconflow'
  | 'together'
  | 'ollama'
  | 'lmstudio'
  | 'vllm'

export interface ModelConfig {
  provider: ProviderType
  model: string
  baseUrl: string
  apiKey: string
  maxTokens?: number
  temperature?: number
}

export interface ModelSet {
  default: ModelConfig
  reasoning?: ModelConfig
  fast?: ModelConfig
  local?: ModelConfig
}

export interface AgentConfig {
  models: ModelSet
  sandboxEnabled: boolean
  autoApprove: boolean
  maxIterations: number
  sessionTimeout: number
  workspaceDir: string
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

export interface CostEntry {
  model: string
  inputTokens: number
  outputTokens: number
  inputCost: number
  outputCost: number
  totalCost: number
  timestamp: number
}

export interface SessionRecord {
  id: string
  directory: string
  model: string
  createdAt: number
  updatedAt: number
  totalCost: number
  messageCount: number
  messages: string // JSON serialized Message[]
}

export interface DiffChunk {
  type: 'add' | 'remove' | 'equal'
  value: string
  count?: number
}

export type ApprovalChoice = 'yes' | 'no' | 'always'

export interface ApprovalResult {
  approved: boolean
  always: boolean
}

export type CircuitState = 'closed' | 'open' | 'half-open'

export interface CircuitBreaker {
  state: CircuitState
  failures: number
  lastFailure: number
  nextProbe: number
}

export interface LoopState {
  messages: Message[]
  iteration: number
  done: boolean
  cost: number
}

// Error codes from DashScope / OpenAI-compat APIs
export type ApiErrorCode =
  | 'InvalidApiKey'
  | 'invalid_api_key'
  | 'Arrearage'
  | 'InvalidParameter'
  | 'DataInspectionFailed'
  | 'model_not_exist'
  | 'context_length_exceeded'
  | 'limit_requests'
  | 'insufficient_quota'
  | 'limit_burst_rate'
  | 'FreeTierOnly'
  | 'internal_error'
  | 'RequestTimeOut'
  | 'ModelUnavailable'
  | 'AccessDenied'
  | 'Unpurchased'
  | 'ModelNotFound'
  | string

export interface ApiError {
  status: number
  code: ApiErrorCode
  message: string
  retryable: boolean
}

export interface SandboxResult {
  stdout: string
  stderr: string
  exitCode: number
  timedOut: boolean
  usedFallback: boolean
}
