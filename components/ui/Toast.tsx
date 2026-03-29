'use client';
import { useEffect } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, visible, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3200);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <div className={styles.toast}>
        <span className={styles.icon} aria-hidden="true">✓</span>
        <span className={styles.message}>{message}</span>
      </div>
    </div>
  );
};
