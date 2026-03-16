import { useEffect, useRef, type ReactNode } from 'react';
import styles from './Modal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}

export default function Modal({ isOpen, onClose, title, children, width = 480 }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (isOpen) { el.showModal(); }
    else { el.close(); }
  }, [isOpen]);

  useEffect(() => {
    const el = dialogRef.current;
    const handleCancel = (e: Event) => { e.preventDefault(); onClose(); };
    el?.addEventListener('cancel', handleCancel);
    return () => el?.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <dialog ref={dialogRef} className={styles.dialog} style={{ width }} onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className={styles.inner} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </dialog>
  );
}
