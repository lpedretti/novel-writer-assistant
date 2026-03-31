// ── LLM Client — Provider-agnostic transport layer ──
//
// Supports three providers via LLM_PROVIDER env var:
//   "local"  — llama.cpp server (default)
//   "openai" — OpenAI API
//   "gemini" — Gemini via OpenAI-compatible endpoint

// ── Error Class ──

export class LlmServerError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'LlmServerError';
  }
}

// Backward compatibility alias
export { LlmServerError as LlamaServerError };

// ── Provider Configuration ──

type LlmProvider = 'local' | 'openai' | 'gemini';

interface LlmConfig {
  provider: LlmProvider;
  baseUrl: string;
  completionsPath: string;
  modelId: string;
  timeoutMs: number;
  apiKey: string | null;
}

const PROVIDER_DEFAULTS: Record<LlmProvider, { baseUrl: string; completionsPath: string; modelId: string }> = {
  local: {
    baseUrl: 'http://127.0.0.1:8080',
    completionsPath: '/v1/chat/completions',
    modelId: 'Qwen/Qwen3-8B-GGUF:Q4_K_M',
  },
  openai: {
    baseUrl: 'https://api.openai.com',
    completionsPath: '/v1/chat/completions',
    modelId: 'gpt-4o-mini',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    completionsPath: '/chat/completions',
    modelId: 'gemini-2.5-flash',
  },
};

let cachedConfig: LlmConfig | null = null;

export function getConfig(): LlmConfig {
  if (cachedConfig) return cachedConfig;

  const provider = (process.env.LLM_PROVIDER || 'local') as LlmProvider;
  const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.local;

  // Backward compat: fall back to LLAMA_* vars for local provider
  const legacyBaseUrl = provider === 'local' ? process.env.LLAMA_BASE_URL : undefined;
  const legacyModelId = provider === 'local' ? process.env.LLAMA_MODEL_ID : undefined;
  const legacyTimeout = process.env.LLAMA_TIMEOUT_MS;

  cachedConfig = {
    provider,
    baseUrl: process.env.LLM_BASE_URL || legacyBaseUrl || defaults.baseUrl,
    completionsPath: defaults.completionsPath,
    modelId: process.env.LLM_MODEL_ID || legacyModelId || defaults.modelId,
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS || legacyTimeout) || 30000,
    apiKey: process.env.LLM_API_KEY || null,
  };

  return cachedConfig;
}

// ── Request Formatting ──

interface FormattedRequest {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

function formatRequest(
  messages: Array<{ role: string; content: string }>,
  options: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    responseFormat?: Record<string, unknown>;
  }
): FormattedRequest {
  const config = getConfig();
  const url = `${config.baseUrl}${config.completionsPath}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  // For local provider: prepend /no_think to last user message
  let formattedMessages = messages;
  if (config.provider === 'local') {
    formattedMessages = messages.map((msg, i) => {
      if (msg.role === 'user' && i === messages.length - 1) {
        return { ...msg, content: `/no_think\n${msg.content}` };
      }
      return msg;
    });
  }

  // OpenAI newer models use max_completion_tokens; local/gemini use max_tokens
  const maxTokensKey = config.provider === 'openai' ? 'max_completion_tokens' : 'max_tokens';

  const body: Record<string, unknown> = {
    model: config.modelId,
    messages: formattedMessages,
    temperature: options.temperature ?? 0.3,
    top_p: options.topP ?? 0.9,
    [maxTokensKey]: options.maxTokens ?? 800,
  };

  // Local provider: add Qwen-specific params
  if (config.provider === 'local') {
    body.chat_template_kwargs = { enable_thinking: false };
  }

  if (options.responseFormat) {
    body.response_format = options.responseFormat;
  }

  return { url, headers, body };
}

// ── Core LLM Functions ──

export interface LlmCompleteOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  validate?: (raw: string) => unknown;
}

/**
 * Structured JSON output with 2-attempt retry.
 * Replaces callLlama<T> and callLlamaServer.
 */
export async function llmComplete<T>(
  messages: Array<{ role: string; content: string }>,
  schema: { name: string; schema: Record<string, unknown> },
  options: LlmCompleteOptions = {}
): Promise<T> {
  const config = getConfig();
  const { temperature, maxTokens, timeoutMs = config.timeoutMs, validate } = options;

  const { url, headers, body } = formatRequest(messages, {
    temperature,
    maxTokens,
    responseFormat: {
      type: 'json_schema',
      json_schema: { name: schema.name, strict: true, schema: schema.schema },
    },
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new LlmServerError(`LLM server returned ${response.status}: ${errorBody}`, response.status);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (typeof content !== 'string') {
        throw new LlmServerError('Invalid response structure from LLM server', 502);
      }

      // Use custom validator or default JSON.parse
      if (validate) {
        return validate(content) as T;
      }
      return JSON.parse(content) as T;
    } catch (error) {
      clearTimeout(timeout);

      if (error instanceof LlmServerError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      const isAbort = (error instanceof DOMException && error.name === 'AbortError')
        || (error instanceof Error && error.name === 'AbortError');
      if (isAbort) {
        lastError = new LlmServerError(`Request timed out after ${timeoutMs}ms`, 504);
        break; // Don't retry timeouts
      }

      lastError = error instanceof LlmServerError
        ? error
        : new LlmServerError('LLM service unavailable', 502);

      if (attempt === 0) continue; // Retry once on network errors
    }
  }

  throw lastError!;
}

/**
 * Plain text output, single attempt.
 * Replaces callLlamaText and resolveFollowUpQuery's internal fetch.
 */
export async function llmCompleteText(
  messages: Array<{ role: string; content: string }>,
  options: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {}
): Promise<string> {
  const config = getConfig();
  const { temperature, maxTokens, timeoutMs = config.timeoutMs } = options;

  const { url, headers, body } = formatRequest(messages, { temperature, maxTokens });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new LlmServerError(`LLM server returned ${response.status}: ${errorBody}`, response.status);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new LlmServerError('Empty response from LLM server', 502);
    }

    return content.trim();
  } catch (error) {
    clearTimeout(timeout);

    const isAbort = (error instanceof DOMException && error.name === 'AbortError')
      || (error instanceof Error && error.name === 'AbortError');
    if (isAbort) {
      throw new LlmServerError(`Request timed out after ${timeoutMs}ms`, 504);
    }

    throw error;
  }
}

/**
 * Provider-aware health check.
 * Local: GET /health. Remote: minimal completions call (1 token).
 */
export async function checkLlmHealth(): Promise<boolean> {
  const config = getConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    if (config.provider === 'local') {
      const response = await fetch(`${config.baseUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response.ok;
    }

    // Remote providers: lightweight completions call
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const response = await fetch(`${config.baseUrl}${config.completionsPath}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.modelId,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    clearTimeout(timeout);
    return false;
  }
}
