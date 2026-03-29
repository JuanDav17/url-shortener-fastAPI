'use client';
import { useState } from 'react';
import { Button } from './Button';
import styles from './UrlList.module.css';

interface UrlItem {
  id: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: number;
}

interface UrlListProps {
  urls: UrlItem[];
  onCopy: (url: string) => void;
  onClearHistory: () => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getProvider(shortUrl: string): string {
  try {
    return new URL(shortUrl).hostname;
  } catch {
    return 'enlace corto';
  }
}

function CopyButton({ url, onCopy }: { url: string; onCopy: (u: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    onCopy(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
      aria-label="Copiar URL corta"
      type="button"
    >
      <span aria-hidden="true">{copied ? '✓' : '⎘'}</span>
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

export const UrlList: React.FC<UrlListProps> = ({ urls, onCopy, onClearHistory }) => {
  if (urls.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>↗</span>
        <p className={styles.emptyTitle}>No hay registros aún</p>
        <p className={styles.emptyText}>Cuando acortes una URL, aparecerá aquí con fecha, proveedor y acceso rápido para copiar.</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.headerEyebrow}>Historial</p>
          <h2 className={styles.headerTitle}>URLs acortadas recientemente</h2>
        </div>

        <div className={styles.headerActions}>
          <span className={styles.badge}>{urls.length} registros</span>
          <Button type="button" variant="secondary" size="sm" onClick={onClearHistory}>
            Limpiar historial
          </Button>
        </div>
      </div>

      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span>URL original</span>
          <span>URL corta</span>
          <span>Fecha</span>
          <span>Acción</span>
        </div>

        <div className={styles.list}>
          {urls.map((item) => (
            <article key={item.id} className={styles.item}>
              <div className={styles.originalCell}>
                <span className={styles.cellLabel}>Original</span>
                <p className={styles.originalUrl} title={item.originalUrl}>
                  {item.originalUrl}
                </p>
              </div>

              <div className={styles.shortCell}>
                <span className={styles.cellLabel}>URL corta</span>
                <a
                  href={item.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.shortLink}
                  title={item.shortUrl}
                >
                  {item.shortUrl}
                </a>
                <span className={styles.provider}>{getProvider(item.shortUrl)}</span>
              </div>

              <div className={styles.metaCell}>
                <span className={styles.cellLabel}>Fecha</span>
                <p className={styles.meta}>{formatDate(item.createdAt)}</p>
              </div>

              <div className={styles.actions}>
                <CopyButton url={item.shortUrl} onCopy={onCopy} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
