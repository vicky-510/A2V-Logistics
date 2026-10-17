const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Multi-model quota fallback middleware for Gemini.
 * If the primary model/key hits a 429 (quota exhaustion) or times out,
 * it transparently retries against the fallback model/key without
 * breaking the caller's session.
 */

const DEFAULT_TIMEOUT_MS = 15000;

function isQuotaOrTimeoutError(err) {
  if (!err) return false;
  const status = err.status || err.code;
  const message = (err.message || '').toLowerCase();
  return (
    status === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('timeout') ||
    err.name === 'AbortError'
  );
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`${label} timed out after ${ms}ms`);
      err.name = 'AbortError';
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

class LLMService {
  constructor(config = {}) {
    this.primaryKey = config.primaryKey || process.env.GEMINI_API_KEY_PRIMARY;
    this.fallbackKey = config.fallbackKey || process.env.GEMINI_API_KEY_FALLBACK;
    this.primaryModel = config.primaryModel || process.env.GEMINI_MODEL_PRIMARY || 'gemini-3.8-flash';
    this.fallbackModel = config.fallbackModel || process.env.GEMINI_MODEL_FALLBACK || 'gemini-2.5-flash-lite';
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    // Allow injection of a custom client factory for testing.
    this.clientFactory = config.clientFactory ?? ((apiKey) => new GoogleGenerativeAI(apiKey));
  }

  async _generate(apiKey, modelName, prompt) {
    if (!apiKey) {
      const err = new Error(`No API key configured for model ${modelName}`);
      throw err;
    }
    const client = this.clientFactory(apiKey);
    const model = client.getGenerativeModel({ model: modelName });
    const result = await withTimeout(model.generateContent(prompt), this.timeoutMs, modelName);
    return result.response.text();
  }

  /**
   * Generate a completion, falling back to the secondary model/key on
   * quota exhaustion or timeout. Returns { text, modelUsed, fallbackTriggered }.
   */
  async generate(prompt) {
    try {
      const text = await this._generate(this.primaryKey, this.primaryModel, prompt);
      return { text, modelUsed: this.primaryModel, fallbackTriggered: false };
    } catch (primaryErr) {
      if (!isQuotaOrTimeoutError(primaryErr)) {
        throw primaryErr;
      }
      console.warn(
        `[LLMService] Primary model "${this.primaryModel}" failed (${primaryErr.message}). ` +
        `Falling back to "${this.fallbackModel}"...`
      );
      try {
        const text = await this._generate(this.fallbackKey, this.fallbackModel, prompt);
        console.log(`[LLMService] Fallback to "${this.fallbackModel}" succeeded.`);
        return { text, modelUsed: this.fallbackModel, fallbackTriggered: true };
      } catch (fallbackErr) {
        console.error(
          `[LLMService] Fallback model "${this.fallbackModel}" also failed: ${fallbackErr.message}`
        );
        throw fallbackErr;
      }
    }
  }
}

module.exports = { LLMService, isQuotaOrTimeoutError };
