'use client';
import { useState } from 'react';
import { Button } from './Button';
import { isValidUrl } from '@/lib/utils';
import styles from './UrlForm.module.css';

interface UrlFormProps {
  onShorten: (originalUrl: string, shortUrl: string) => void;
}

export const UrlForm: React.FC<UrlFormProps> = ({ onShorten }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Por favor ingresa una URL');
      return;
    }
    if (!isValidUrl(url)) {
      setError('URL inválida. Debe incluir http:// o https://');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalUrl: url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al acortar');

      onShorten(url, data.shortUrl);
      setUrl('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit} className={styles.card} noValidate>
        <label htmlFor="url-input" className={styles.label}>
          Pega tu enlace aquí
        </label>
        <div className={styles.inputRow}>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon} aria-hidden="true">🔗</span>
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ejemplo.com/mi-url-muy-larga"
              className={styles.input}
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Acortando…' : 'Acortar'}
          </Button>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
            {error}
          </p>
        )}
      </form>
    </div>
  );
};
