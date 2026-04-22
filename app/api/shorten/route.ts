import { NextRequest, NextResponse } from 'next/server';
import { saveUrl } from '@/lib/store';
import { generateSlug, normalizeAndValidateUrl } from '@/lib/utils';
import { MAX_SLUG_ATTEMPTS, DEFAULT_SLUG_LENGTH } from '@/lib/server.constants';
import { enforceShortenRateLimit } from '@/lib/rate-limit';
import { logError, logInfo, logWarn } from '@/lib/logger';

class BadRequestError extends Error {}
class TooManyRequestsError extends Error {
  constructor(
    message: string,
    public readonly retryAfterSeconds: number
  ) {
    super(message);
  }
}

function getBaseUrl(request: NextRequest): string {
  const configured = process.env.APP_BASE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  return request.nextUrl.origin;
}

function getRequestIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();

  return forwardedFor || realIp || 'unknown';
}

async function createUniqueSlug(originalUrl: string): Promise<string> {
  for (let i = 0; i < MAX_SLUG_ATTEMPTS; i++) {
    const candidate = generateSlug(DEFAULT_SLUG_LENGTH);
    const wasSaved = await saveUrl(candidate, originalUrl, { onlyIfNotExists: true });

    if (wasSaved) {
      return candidate;
    }
  }

  throw new Error('No se pudo generar un slug único. Intenta de nuevo.');
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const identifier = getRequestIdentifier(request);
    const rateLimit = await enforceShortenRateLimit(identifier);

    if (!rateLimit.allowed) {
      throw new TooManyRequestsError(
        'Demasiadas solicitudes. Intenta de nuevo en unos segundos.',
        rateLimit.retryAfterSeconds
      );
    }

    const body = await request.json();
    const rawOriginalUrl =
      typeof body?.originalUrl === 'string' ? body.originalUrl : '';

    let normalizedUrl: string;

    try {
      normalizedUrl = normalizeAndValidateUrl(rawOriginalUrl).toString();
    } catch (error) {
      throw new BadRequestError(
        error instanceof Error ? error.message : 'URL inválida'
      );
    }

    const slug = await createUniqueSlug(normalizedUrl);
    const shortUrl = `${getBaseUrl(request)}/${slug}`;

    logInfo('URL acortada correctamente', {
      requestId,
      slug,
      latencyMs: Date.now() - start,
    });

    return NextResponse.json({ shortUrl, slug });
  } catch (error) {
    const latencyMs = Date.now() - start;

    if (error instanceof TooManyRequestsError) {
      logWarn('Rate limit en /api/shorten', {
        requestId,
        latencyMs,
        error,
      });

      return NextResponse.json(
        { error: error.message },
        {
          status: 429,
          headers: {
            'Retry-After': String(error.retryAfterSeconds),
          },
        }
      );
    }

    const message =
      error instanceof Error && error.message
        ? error.message
        : 'No se pudo acortar la URL';

    const status = error instanceof BadRequestError ? 400 : 500;

    logError('Error en /api/shorten', {
      requestId,
      latencyMs,
      status,
      error,
    });

    return NextResponse.json({ error: message }, { status });
  }
}
