const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

function isIpv4(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function isPrivateIpv4(hostname: string): boolean {
  return (
    /^10\./.test(hostname) ||
    /^127\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

function isPrivateIpv6(hostname: string): boolean {
  const value = hostname.toLowerCase();
  return (
    value === '::1' ||
    value.startsWith('fc') ||
    value.startsWith('fd') ||
    value.startsWith('fe80:')
  );
}

function isBlockedHostname(hostname: string): boolean {
  const value = hostname.toLowerCase();

  if (
    value === 'localhost' ||
    value === '127.0.0.1' ||
    value === '::1' ||
    value.endsWith('.local')
  ) {
    return true;
  }

  if (isIpv4(value) && isPrivateIpv4(value)) {
    return true;
  }

  if (value.includes(':') && isPrivateIpv6(value)) {
    return true;
  }

  return false;
}

export function generateSlug(length: number = 7): string {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const bytes = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
}

export function normalizeAndValidateUrl(input: string): URL {
  const value = input.trim();

  if (!value) {
    throw new Error('Por favor ingresa una URL');
  }

  const url = new URL(value);

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new Error('Solo se permiten URLs http:// o https://');
  }

  if (url.username || url.password) {
    throw new Error('No se permiten URLs con usuario o contraseña');
  }

  if (isBlockedHostname(url.hostname)) {
    throw new Error('No se permiten URLs locales o privadas');
  }

  return url;
}

export function isValidUrl(input: string): boolean {
  try {
    normalizeAndValidateUrl(input);
    return true;
  } catch {
    return false;
  }
}