import type { MonitorStatus } from '../../types';
import styles from './MonitorStatusBadge.module.css';

interface Props {
  status: MonitorStatus;
}

const labels: Record<MonitorStatus, string> = {
  UP: 'Up',
  DOWN: 'Down',
  PENDING: 'Pending',
};

export default function MonitorStatusBadge({ status }: Props) {
  return (
    <span className={`${styles.badge} ${styles[status.toLowerCase() as 'up' | 'down' | 'pending']}`}>
      <span className={styles.dot} />
      {status === 'PENDING' && <span className={styles.ping} />}
      {labels[status]}
    </span>
  );
}
