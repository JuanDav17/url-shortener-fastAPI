import { NextRequest, NextResponse } from 'next/server';
import { saveUrl, slugExists } from '@/lib/store';
import { generateSlug, normalizeAndValidateUrl } from '@/lib/utils';

class BadRequestError extends Error {}

const MAX_SLUG_ATTEMPTS = 8;

function getBaseUrl(request: NextRequest): string {
  const configured = process.env.APP_BASE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  try {
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

    let slug = '';

    for (let i = 0; i < MAX_SLUG_ATTEMPTS; i++) {
      const candidate = generateSlug(7);
      const exists = await slugExists(candidate);

      if (!exists) {
        slug = candidate;
        break;
      }
    }

    if (!slug) {
      throw new Error('No se pudo generar un slug único. Intenta de nuevo.');
    }

    await saveUrl(slug, normalizedUrl);

    const shortUrl = `${getBaseUrl(request)}/${slug}`;

    return NextResponse.json({
      shortUrl,
      slug,
    });
  } catch (error) {
    console.error('Error en /api/shorten:', error);

    const message =
      error instanceof Error && error.message
        ? error.message
        : 'No se pudo acortar la URL';

    const status = error instanceof BadRequestError ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}