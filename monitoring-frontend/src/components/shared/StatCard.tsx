import { type ReactNode } from 'react';
import styles from './StatCard.module.css';

interface Props {
  label: string;
  value: number | string;
  icon: ReactNode;
  accent?: 'default' | 'up' | 'down' | 'pending';
  sublabel?: string;
}

export default function StatCard({ label, value, icon, accent = 'default', sublabel }: Props) {
  return (
    <div className={`${styles.card} ${styles[accent]} card fade-in`}>
      <div className={styles.iconWrap}>{icon}</div>
      <div className={styles.content}>
        <span className={styles.value}>{value}</span>
        <span className={styles.label}>{label}</span>
        {sublabel && <span className={styles.sublabel}>{sublabel}</span>}
      </div>
    </div>
  );
}
