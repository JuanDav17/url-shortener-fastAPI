'use client';

import { useEffect, useState } from 'react';
import {
  Link2,
  Sparkles,
  Scissors,
  Copy,
  History,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { UrlForm } from '@/components/ui/UrlForm';
import { UrlList } from '@/components/ui/UrlList';
import { Toast } from '@/components/ui/Toast';
import { ShortenedUrl } from '@/types';
import styles from './page.module.css';

const STORAGE_KEY = 'shortenedUrls';

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
          <AlertTriangle size={22} strokeWidth={2} />
        </div>

        <h2 id="modal-title" className={styles.modalTitle}>
          Borrar historial
        </h2>

        <p className={styles.modalText}>
          Vas a eliminar <strong>{count} {count === 1 ? 'enlace' : 'enlaces'}</strong> guardados.
          Esta acción no se puede deshacer.
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
            <Trash2 size={14} strokeWidth={2.4} />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

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
    showToast('Enlace copiado');
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

  const totalLinks = urls.length;

  return (
    <>
      <div className={styles.pageBg} aria-hidden="true" />
      <div className={styles.gridOverlay} aria-hidden="true" />

      <main className={styles.main}>
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.brand}>
              <div className={styles.logoWrap} aria-hidden="true">
                <Link2 size={18} strokeWidth={2.4} />
              </div>

              <div>
                <p className={styles.brandName}>CorLink</p>
                <p className={styles.brandTag}>Acorta y comparte enlaces</p>
              </div>
            </div>

            {totalLinks > 0 && (
              <div className={styles.countPill}>
                {totalLinks} {totalLinks === 1 ? 'enlace' : 'enlaces'}
              </div>
            )}
          </header>

          <section className={styles.hero} aria-label="Inicio">
            <p className={styles.heroBadge}>
              <Sparkles size={14} strokeWidth={2.2} />
              Rápido y fácil
            </p>

            <h1 className={styles.heroTitle}>
              Tu enlace,
              <span className={styles.heroTitleAccent}> más corto</span>
              <br />
              y listo para compartir
            </h1>

            <p className={styles.heroSub}>
              Pega una URL larga, genera una versión corta en segundos y compártela sin complicaciones.
            </p>

            <div className={styles.heroSteps}>
              <article className={styles.stepCard}>
                <div className={styles.stepIcon}>
                  <Link2 size={16} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className={styles.stepTitle}>Pega tu enlace</h3>
                  <p className={styles.stepText}>
                    Copia cualquier URL y ponla en el campo.
                  </p>
                </div>
              </article>

              <article className={styles.stepCard}>
                <div className={styles.stepIcon}>
                  <Scissors size={16} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className={styles.stepTitle}>Acórtalo</h3>
                  <p className={styles.stepText}>
                    Obtén una versión más limpia y fácil de usar.
                  </p>
                </div>
              </article>

              <article className={styles.stepCard}>
                <div className={styles.stepIcon}>
                  <Copy size={16} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className={styles.stepTitle}>Copia y comparte</h3>
                  <p className={styles.stepText}>
                    Ten tu enlace listo para enviarlo donde quieras.
                  </p>
                </div>
              </article>
            </div>
          </section>

          <section className={styles.formCard} aria-label="Formulario para acortar enlace">
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.sectionEyebrow}>Nuevo enlace</p>
                <h2 className={styles.sectionTitle}>Acortar enlace</h2>
                <p className={styles.sectionSub}>
                  Pega tu URL y genera un enlace corto al instante.
                </p>
              </div>
            </div>

            <UrlForm onShorten={handleShorten} />
          </section>

          <section
            id="historial"
            className={styles.historySection}
            aria-label="Historial de enlaces"
          >
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.sectionEyebrow}>Tus enlaces</p>
                <h2 className={styles.sectionTitle}>Historial reciente</h2>
                <p className={styles.sectionSub}>
                  Aquí encontrarás tus enlaces generados para copiarlos cuando los necesites.
                </p>
              </div>

              <div className={styles.sectionBadge}>
                <History size={14} strokeWidth={2.2} />
                {totalLinks === 0
                  ? 'Aún no hay enlaces'
                  : `${totalLinks} ${totalLinks === 1 ? 'enlace' : 'enlaces'}`}
              </div>
            </div>

            <UrlList
              urls={urls}
              onCopy={handleCopy}
              onClearHistory={handleClearHistory}
            />
          </section>

          <footer className={styles.footer}>
            CorLink · Acorta, copia y comparte
          </footer>
        </div>
      </main>

      {showConfirmModal && (
        <ConfirmModal
          count={urls.length}
          onConfirm={confirmClear}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </>
  );
}