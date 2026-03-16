import type { RecentAlert } from '../../types';
import styles from './AlertsList.module.css';

interface Props {
  alerts: RecentAlert[];
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AlertsList({ alerts }: Props) {
  if (!alerts.length) {
    return <p className={styles.empty}>No recent alerts 🎉</p>;
  }
  return (
    <ul className={styles.list}>
      {alerts.map((a) => (
        <li key={a.id} className={styles.item}>
          <span className={styles.dot} />
          <div className={styles.info}>
            <span className={styles.name}>{a.monitor.name}</span>
            <span className={styles.code}>HTTP {a.statusCode ?? '—'}</span>
          </div>
          <span className={styles.time}>{timeAgo(a.timestamp)}</span>
        </li>
      ))}
    </ul>
  );
}
