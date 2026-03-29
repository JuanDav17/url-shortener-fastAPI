import https from 'node:https';
import {
  Redis,
  type Requester,
  type UpstashRequest,
  type UpstashResponse,
} from '@upstash/redis';

let redisClient: Redis | undefined;

function getBlockPageTitle(body: string): string | null {
  const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch?.[1]?.replace(/\s+/g, ' ').trim() ?? null;
}

function createHtmlResponseError(serviceName: string, hostname: string, body: string): Error {
  const title = getBlockPageTitle(body);

  if (title && /web filter violation/i.test(title)) {
    return new Error(
      `La red local esta bloqueando ${serviceName} (${title}). Debes permitir el dominio ${hostname}.`
    );
  }

  return new Error(
    `${serviceName} devolvio HTML inesperado. Verifica acceso de red al dominio ${hostname}.`
  );
}

function createRequester(url: string, token: string, allowInsecureTls: boolean): Requester {
  const agent = new https.Agent({
    keepAlive: true,
    rejectUnauthorized: !allowInsecureTls,
  });

  const requester: Requester = {
    readYourWrites: true,
    upstashSyncToken: '',
    request: <TResult>(req: UpstashRequest): Promise<UpstashResponse<TResult>> =>
      new Promise((resolve, reject) => {
        const requestUrl = [url.replace(/\/$/, ''), ...(req.path ?? [])].join('/');
        const parsedUrl = new URL(requestUrl);
        const body = JSON.stringify(req.body ?? []);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
          'Content-Length': String(Buffer.byteLength(body)),
          ...(req.headers ?? {}),
        };

        if (requester.readYourWrites) {
          headers['upstash-sync-token'] = requester.upstashSyncToken ?? '';
        }

        const client = https.request(
          {
            protocol: parsedUrl.protocol,
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || undefined,
            path: `${parsedUrl.pathname}${parsedUrl.search}`,
            method: 'POST',
            headers,
            agent,
          },
          (response) => {
            let responseBody = '';

            response.setEncoding('utf8');
            response.on('data', (chunk) => {
              responseBody += chunk;
            });
            response.on('end', () => {
              if (requester.readYourWrites) {
                const syncToken = response.headers['upstash-sync-token'];
                requester.upstashSyncToken = Array.isArray(syncToken)
                  ? syncToken[0] ?? ''
                  : syncToken ?? '';
              }

              if (!response.statusCode) {
                reject(new Error('Upstash Redis no respondio con un status valido.'));
                return;
              }

              const normalizedBody = responseBody.trim();
              const contentType = String(response.headers['content-type'] ?? '');
              const looksLikeHtml =
                contentType.includes('text/html') ||
                /^<!DOCTYPE html/i.test(normalizedBody) ||
                /^<html/i.test(normalizedBody);

              if (looksLikeHtml) {
                reject(createHtmlResponseError('Upstash Redis', parsedUrl.hostname, normalizedBody));
                return;
              }

              let parsedBody: UpstashResponse<TResult>;

              try {
                parsedBody = normalizedBody
                  ? (JSON.parse(normalizedBody) as UpstashResponse<TResult>)
                  : {};
              } catch {
                reject(
                  new Error(
                    `Respuesta invalida de Upstash Redis: ${normalizedBody.slice(0, 160)}`
                  )
                );
                return;
              }

              if (response.statusCode < 200 || response.statusCode >= 300) {
                reject(
                  new Error(
                    parsedBody.error || `Upstash Redis respondio con status ${response.statusCode}`
                  )
                );
                return;
              }

              resolve(parsedBody);
            });
          }
        );

        client.on('error', reject);

        if (req.signal) {
          const abortRequest = () => {
            client.destroy(new Error('Request to Upstash Redis aborted.'));
          };

          if (req.signal.aborted) {
            abortRequest();
            return;
          }

          req.signal.addEventListener('abort', abortRequest, { once: true });
        }

        client.write(body);
        client.end();
      }),
  };

  return requester;
}

function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Upstash Redis es obligatorio. Configura UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN.'
    );
  }

  const allowInsecureTls = process.env.ALLOW_INSECURE_SHORTENER_TLS === 'true';

  redisClient = new Redis(createRequester(url, token, allowInsecureTls));
  return redisClient;
}

function getStorageKey(slug: string): string {
  return `short-url:${slug}`;
}

export const saveUrl = async (slug: string, originalUrl: string): Promise<void> => {
  await getRedisClient().set(getStorageKey(slug), originalUrl);
};

export const getUrl = async (slug: string): Promise<string | undefined> => {
  const result = await getRedisClient().get<string>(getStorageKey(slug));
  return result ?? undefined;
};

export const getAllUrls = async (): Promise<Array<[string, string]>> => {
  const redis = getRedisClient();
  const keys = await redis.keys(getStorageKey('*'));

  if (keys.length === 0) {
    return [];
  }

  const values = await redis.mget<(string | null)[]>(...keys);

  return keys.flatMap((key, index) => {
    const value = values[index];

    if (!value) {
      return [];
    }

    return [[key.replace('short-url:', ''), value] as [string, string]];
  });
};
