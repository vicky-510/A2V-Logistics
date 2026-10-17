const { LLMService } = require('../services/llmService');

function mockClientFactory(behavior) {
  // behavior: { [apiKey]: () => Promise<string> | throws }
  return (apiKey) => ({
    getGenerativeModel: ({ model }) => ({
      generateContent: async () => {
        const fn = behavior[apiKey];
        if (!fn) throw new Error(`No mock behavior for key ${apiKey}`);
        const text = await fn(model);
        return { response: { text: () => text } };
      },
    }),
  });
}

describe('LLMService fallback middleware', () => {
  test('uses the primary model when it succeeds', async () => {
    const clientFactory = mockClientFactory({
      'primary-key': async () => 'primary response',
    });
    const service = new LLMService({
      primaryKey: 'primary-key',
      fallbackKey: 'fallback-key',
      primaryModel: 'gemini-2.5-flash',
      fallbackModel: 'gemini-1.5-flash',
      clientFactory,
    });

    const result = await service.generate('hello');

    expect(result.text).toBe('primary response');
    expect(result.modelUsed).toBe('gemini-2.5-flash');
    expect(result.fallbackTriggered).toBe(false);
  });

  test('falls back transparently on a 429 quota error', async () => {
    const quotaErr = Object.assign(new Error('Quota exceeded'), { status: 429 });
    const clientFactory = mockClientFactory({
      'primary-key': async () => { throw quotaErr; },
      'fallback-key': async () => 'fallback response',
    });
    const service = new LLMService({
      primaryKey: 'primary-key',
      fallbackKey: 'fallback-key',
      clientFactory,
    });

    const result = await service.generate('hello');

    expect(result.text).toBe('fallback response');
    expect(result.fallbackTriggered).toBe(true);
    expect(result.modelUsed).toBe(service.fallbackModel);
  });

  test('falls back on a timeout-style error', async () => {
    const timeoutErr = Object.assign(new Error('request timeout'), {});
    const clientFactory = mockClientFactory({
      'primary-key': async () => { throw timeoutErr; },
      'fallback-key': async () => 'fallback after timeout',
    });
    const service = new LLMService({ primaryKey: 'primary-key', fallbackKey: 'fallback-key', clientFactory });

    const result = await service.generate('hi');
    expect(result.text).toBe('fallback after timeout');
    expect(result.fallbackTriggered).toBe(true);
  });

  test('does not fall back on a non-quota, non-timeout error', async () => {
    const otherErr = new Error('invalid prompt');
    const clientFactory = mockClientFactory({
      'primary-key': async () => { throw otherErr; },
    });
    const service = new LLMService({ primaryKey: 'primary-key', fallbackKey: 'fallback-key', clientFactory });

    await expect(service.generate('hi')).rejects.toThrow('invalid prompt');
  });

  test('propagates the error when both primary and fallback fail', async () => {
    const quotaErr = Object.assign(new Error('Quota exceeded'), { status: 429 });
    const fallbackErr = new Error('fallback also down');
    const clientFactory = mockClientFactory({
      'primary-key': async () => { throw quotaErr; },
      'fallback-key': async () => { throw fallbackErr; },
    });
    const service = new LLMService({ primaryKey: 'primary-key', fallbackKey: 'fallback-key', clientFactory });

    await expect(service.generate('hi')).rejects.toThrow('fallback also down');
  });
});
