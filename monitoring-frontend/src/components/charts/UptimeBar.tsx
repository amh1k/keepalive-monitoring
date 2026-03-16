import type { UptimeStat } from '../../types';
import styles from './UptimeBar.module.css';

interface Props {
  data: UptimeStat[];
}

function getColor(pct: number): string {
  if (pct >= 99) return 'var(--color-up)';
  if (pct >= 90) return 'var(--color-pending)';
  return 'var(--color-down)';
}

export default function UptimeBar({ data }: Props) {
  if (!data.length) {
    return <p className={styles.empty}>No monitors to display</p>;
  }
  return (
    <div className={styles.list}>
      {data.map((m) => {
        const pct = parseFloat(m.uptimePercentage);
        const color = getColor(pct);
        return (
          <div key={m.id} className={styles.row}>
            <div className={styles.meta}>
              <span className={styles.name}>{m.name}</span>
              <span className={styles.pct} style={{ color }}>{m.uptimePercentage}%</span>
            </div>
            <div className={styles.track}>
              <div
                className={styles.fill}
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
