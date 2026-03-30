'use client';
import { useState } from 'react';
import { Button } from './Button';
import styles from './UrlList.module.css';

interface UrlItem {
  id: string;
  originalUrl: string;
  shortUrl: string;
  slug: string;
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

/* 🔥 CLAVE: siempre construimos el link con TU dominio */
function buildPublicShortUrl(slug: string): string {
  if (typeof window === 'undefined') {
    return `/${slug}`;
  }

  return `${window.location.origin}/${slug}`;
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

export const UrlList: React.FC<UrlListProps> = ({
  urls,
  onCopy,
  onClearHistory,
}) => {
  if (urls.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>↗</span>
        <p className={styles.emptyTitle}>Aún no hay enlaces</p>
        <p className={styles.emptyText}>
          Acorta tu primer enlace y aparecerá aquí listo para copiar.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.headerEyebrow}>Historial</p>
          <h2 className={styles.headerTitle}>Tus enlaces</h2>
        </div>

        <div className={styles.headerActions}>
          <span className={styles.badge}>
            {urls.length} {urls.length === 1 ? 'enlace' : 'enlaces'}
          </span>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClearHistory}
          >
            Limpiar
          </Button>
        </div>
      </div>

      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span>URL original</span>
          <span>Enlace corto</span>
          <span>Fecha</span>
          <span></span>
        </div>

        <div className={styles.list}>
          {urls.map((item) => {
            const publicShortUrl = buildPublicShortUrl(item.slug);

            return (
              <article key={item.id} className={styles.item}>
                {/* ORIGINAL */}
                <div className={styles.originalCell}>
                  <span className={styles.cellLabel}>Original</span>
                  <p
                    className={styles.originalUrl}
                    title={item.originalUrl}
                  >
                    {item.originalUrl}
                  </p>
                </div>

                {/* SHORT */}
                <div className={styles.shortCell}>
                  <span className={styles.cellLabel}>Enlace</span>

                  {/* ❌ quitamos target="_blank" para evitar bugs en móvil */}
                  <a
                    href={publicShortUrl}
                    className={styles.shortLink}
                    title={publicShortUrl}
                  >
                    {publicShortUrl}
                  </a>
                </div>

                {/* META */}
                <div className={styles.metaCell}>
                  <span className={styles.cellLabel}>Fecha</span>
                  <p className={styles.meta}>
                    {formatDate(item.createdAt)}
                  </p>
                </div>

                {/* ACTIONS */}
                <div className={styles.actions}>
                  <CopyButton
                    url={publicShortUrl}
                    onCopy={onCopy}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};