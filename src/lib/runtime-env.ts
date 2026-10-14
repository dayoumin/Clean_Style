import { getCloudflareContext } from '@opennextjs/cloudflare';

export interface AiRuntimeEnv {
  OPENAI_API_KEY?: string;
  NEXT_PUBLIC_APP_URL?: string;
}

function normalized(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export async function getAiRuntimeEnv(): Promise<AiRuntimeEnv> {
  let cloudflareEnv: AiRuntimeEnv = {};
  let cloudflareContextAvailable = false;

  try {
    const { env } = await getCloudflareContext({ async: true });
    cloudflareEnv = env as AiRuntimeEnv;
    cloudflareContextAvailable = true;
  } catch {
    // `next dev` and unit tests do not always have an OpenNext request context.
  }

  const result = {
    OPENAI_API_KEY:
      normalized(cloudflareEnv.OPENAI_API_KEY) ?? normalized(process.env.OPENAI_API_KEY),
    NEXT_PUBLIC_APP_URL:
      normalized(cloudflareEnv.NEXT_PUBLIC_APP_URL) ?? normalized(process.env.NEXT_PUBLIC_APP_URL),
  };

  if (!result.OPENAI_API_KEY) {
    console.error('AI runtime env missing OPENAI_API_KEY', {
      cloudflareContextAvailable,
      processEnvPresent: Boolean(normalized(process.env.OPENAI_API_KEY)),
    });
  }

  return result;
}
