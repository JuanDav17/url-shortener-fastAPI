'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Link2,
  Zap,
  CalendarDays,
  Hash,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { UrlForm } from '@/components/ui/UrlForm';
import { UrlList } from '@/components/ui/UrlList';
import { Toast } from '@/components/ui/Toast';
import { ShortenedUrl } from '@/types';
import styles from './page.module.css';

const STORAGE_KEY = 'shortenedUrls';

/* ─── Confirm Modal ──────────────────────────────────────────────────────── */
function ConfirmModal({
  count,
  onConfirm,
  onCancel,
}: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalIconRing}>
          <AlertTriangle size={24} strokeWidth={2} />
        </div>

        <h2 id="modal-title" className={styles.modalTitle}>
          Eliminar historial
        </h2>
        <p className={styles.modalText}>
          Se borrarán <strong>{count} {count === 1 ? 'enlace' : 'enlaces'}</strong> guardados
          en este navegador. Esta acción no se puede deshacer.
        </p>

        <div className={styles.modalActions}>
          <button
            className={styles.modalBtnCancel}
            onClick={onCancel}
            autoFocus
          >
            Cancelar
          </button>
          <button
            className={styles.modalBtnDelete}
            onClick={onConfirm}
          >
            <Trash2 size={14} strokeWidth={2.5} />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function Home() {
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUrls(JSON.parse(stored));
    } catch {
      console.error('Error al cargar historial');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
  }, [urls]);

  const metrics = useMemo(() => {
    const latest = urls[0];
    return {
      total: urls.length,
      latest: latest
        ? new Date(latest.createdAt).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
          })
        : '—',
      provider: latest ? new URL(latest.shortUrl).hostname : 'is.gd',
    };
  }, [urls]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const handleShorten = (originalUrl: string, shortUrl: string) => {
    const newUrl: ShortenedUrl = {
      id: crypto.randomUUID(),
      originalUrl,
      shortUrl,
      slug: shortUrl.split('/').pop()!,
      createdAt: Date.now(),
    };
    setUrls((prev) => [newUrl, ...prev]);
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    showToast('Enlace copiado al portapapeles');
  };

  const handleClearHistory = () => {
    if (urls.length === 0) return;
    setShowConfirmModal(true);
  };

  const confirmClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUrls([]);
    setShowConfirmModal(false);
    showToast('Historial eliminado');
  };

  return (
    <>
      <div className={styles.pageBg} aria-hidden="true" />
      <div className={styles.gridOverlay} aria-hidden="true" />

      <main className={styles.main}>
        <div className={styles.container}>

          {/* ── Header ── */}
          <header className={styles.header}>
            <div className={styles.brand}>
              <div className={styles.logoWrap} aria-hidden="true">
                <Link2 size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className={styles.brandName}>CorLink</p>
                <p className={styles.brandTag}>Acortador de URLs</p>
              </div>
            </div>

            <div className={styles.statusPill} role="status">
              <span className={styles.statusDot} aria-hidden="true" />
              Servicio activo
            </div>
          </header>

          {/* ── Hero ── */}
          <section className={styles.hero} aria-label="Inicio">
            <div className={styles.heroIconRing} aria-hidden="true">
              <Link2 size={28} strokeWidth={1.8} />
            </div>
            <h1 className={styles.heroTitle}>
              URLs largas,{' '}
              <span>enlaces cortos</span>
            </h1>
            <p className={styles.heroSub}>
              Pega cualquier enlace y obtén una versión corta lista para compartir en segundos.
            </p>
          </section>

          {/* ── Stats ── */}
          <div className={styles.statsRow} role="group" aria-label="Estadísticas">
            <div className={styles.statCard}>
              <div className={styles.statIconBox} aria-hidden="true">
                <Hash size={16} strokeWidth={2.2} />
              </div>
              <div className={styles.statBody}>
                <strong className={styles.statValue}>{metrics.total}</strong>
                <span className={styles.statLabel}>Guardados</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconBox} aria-hidden="true">
                <CalendarDays size={16} strokeWidth={2} />
              </div>
              <div className={styles.statBody}>
                <strong className={styles.statValue}>{metrics.latest}</strong>
                <span className={styles.statLabel}>Último</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconBox} aria-hidden="true">
                <Zap size={16} strokeWidth={2} />
              </div>
              <div className={styles.statBody}>
                <strong className={styles.statValue}>{metrics.provider}</strong>
                <span className={styles.statLabel}>Proveedor</span>
              </div>
            </div>
          </div>

          {/* ── Form ── */}
          <div className={styles.formCard}>
            <p className={styles.formCardLabel} aria-hidden="true">
              <Link2 size={13} strokeWidth={2.5} />
              Acortar enlace
            </p>
            <UrlForm onShorten={handleShorten} />
          </div>

          {/* ── History ── */}
          <section className={styles.historySection} aria-label="Historial de enlaces">
            <UrlList urls={urls} onCopy={handleCopy} onClearHistory={handleClearHistory} />
          </section>

        </div>

        <footer className={styles.footer}>
          Los enlaces se guardan en tu navegador · Acortado vía is.gd
        </footer>
      </main>

      {/* ── Confirm Modal ── */}
      {showConfirmModal && (
        <ConfirmModal
          count={urls.length}
          onConfirm={confirmClear}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      {/* ── Toast ── */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </>
  );
}