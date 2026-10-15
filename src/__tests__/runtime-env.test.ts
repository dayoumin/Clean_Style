import { afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ context: vi.fn() }));
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: mocks.context }));
import { getAiRuntimeEnv } from '@/lib/runtime-env';
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); mocks.context.mockReset(); });
describe('OpenAI runtime key', () => {
  it('prefers the Worker key over local process values', async () => {
    mocks.context.mockResolvedValue({ env: { OPENAI_API_KEY: ' worker-test ' } });
    vi.stubEnv('OPENAI_API_KEY', 'local-test');
    expect((await getAiRuntimeEnv()).OPENAI_API_KEY).toBe('worker-test');
  });
  it('uses the local OpenAI key without a Worker context', async () => {
    mocks.context.mockRejectedValue(new Error('local development'));
    vi.stubEnv('OPENAI_API_KEY', 'local-test');
    expect((await getAiRuntimeEnv()).OPENAI_API_KEY).toBe('local-test');
  });
  it('does not substitute an OpenRouter key', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.context.mockResolvedValue({ env: { OPENROUTER_API_KEY: 'old-test' } });
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('OPENROUTER_API_KEY', 'old-test');
    expect((await getAiRuntimeEnv()).OPENAI_API_KEY).toBeUndefined();
  });
});
