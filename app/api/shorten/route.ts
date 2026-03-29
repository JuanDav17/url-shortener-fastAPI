import https from 'node:https';
import { NextRequest, NextResponse } from 'next/server';
import { saveUrl } from '@/lib/store';
import { isValidUrl } from '@/lib/utils';

interface IsGdResponse {
  shorturl?: string;
  errormessage?: string;
  errorcode?: number;
}

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

function requestIsGd(
  apiUrl: string,
  allowInsecureTls: boolean
): Promise<{ status: number; data: IsGdResponse }> {
  const url = new URL(apiUrl);
  const agent = new https.Agent({
    keepAlive: true,
    rejectUnauthorized: !allowInsecureTls,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        headers: { 'User-Agent': 'url-shortener-demo/1.0' },
        agent,
      },
      (res) => {
        let body = '';

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (!res.statusCode) {
            reject(new Error('is.gd no respondio con un status valido.'));
            return;
          }

          const normalizedBody = body.trim();
          const contentType = String(res.headers['content-type'] ?? '');
          const looksLikeHtml =
            contentType.includes('text/html') ||
            /^<!DOCTYPE html/i.test(normalizedBody) ||
            /^<html/i.test(normalizedBody);

          if (looksLikeHtml) {
            reject(createHtmlResponseError('is.gd', url.hostname, normalizedBody));
            return;
          }

          try {
            resolve({
              status: res.statusCode,
              data: JSON.parse(normalizedBody) as IsGdResponse,
            });
          } catch {
            reject(new Error(`Respuesta invalida de is.gd: ${normalizedBody.slice(0, 160)}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.end();
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalUrl } = body;

    if (!originalUrl || !isValidUrl(originalUrl)) {
      return NextResponse.json(
        { error: 'URL invalida o faltante' },
        { status: 400 }
      );
    }

    const apiUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(originalUrl)}`;
    const allowInsecureTls = process.env.ALLOW_INSECURE_SHORTENER_TLS === 'true';
    const { status, data } = await requestIsGd(apiUrl, allowInsecureTls);

    if (status < 200 || status >= 300) {
      throw new Error(`is.gd respondio con status ${status}`);
    }

    if (data.errorcode) {
      return NextResponse.json(
        { error: data.errormessage || 'Error al acortar con is.gd' },
        { status: 400 }
      );
    }

    if (!data.shorturl) {
      throw new Error('Respuesta inesperada de is.gd');
    }

    const slug = data.shorturl.split('/').pop() ?? '';

    if (slug) {
      await saveUrl(slug, originalUrl);
    }

    return NextResponse.json({ shortUrl: data.shorturl, slug });
  } catch (error) {
    console.error('Error en /api/shorten:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message
            ? error.message
            : 'No se pudo conectar con el servicio de acortado. Intenta de nuevo.',
      },
      { status: 500 }
    );
  }
}
