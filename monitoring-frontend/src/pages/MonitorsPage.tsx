import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { monitorsApi, type CreateMonitorPayload } from '../api/monitors.api';
import type { Monitor } from '../types';
import MonitorStatusBadge from '../components/shared/MonitorStatusBadge';
import Modal from '../components/shared/Modal';
import styles from './MonitorsPage.module.css';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  interval: z.number().int().min(30, 'Minimum 30 seconds').max(3600),
  failureThreshold: z.number().int().min(1).max(10),
});

type CreateForm = z.infer<typeof createSchema>;

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'never';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function MonitorCard({ monitor }: { monitor: Monitor }) {
  const avgLatency = monitor.checks.length
    ? Math.round(monitor.checks.reduce((s, c) => s + c.latency, 0) / monitor.checks.length)
    : null;

  return (
    <div className={`card ${styles.monitorCard} fade-in`}>
      <div className={styles.cardTop}>
        <div className={styles.cardInfo}>
          <h3 className={styles.monitorName}>{monitor.name}</h3>
          <a href={monitor.url} target="_blank" rel="noreferrer" className={styles.monitorUrl}>
            {monitor.url}
          </a>
        </div>
        <MonitorStatusBadge status={monitor.status} />
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.metaItem}>
          <span className={styles.metaLabel}>Last check</span>
          <span className={styles.metaValue}>{timeAgo(monitor.lastCheck)}</span>
        </span>
        <span className={styles.metaItem}>
          <span className={styles.metaLabel}>Interval</span>
          <span className={styles.metaValue}>{monitor.interval}s</span>
        </span>
        <span className={styles.metaItem}>
          <span className={styles.metaLabel}>Avg latency</span>
          <span className={styles.metaValue}>{avgLatency != null ? `${avgLatency}ms` : '—'}</span>
        </span>
        <span className={styles.metaItem}>
          <span className={styles.metaLabel}>Fails</span>
          <span className={styles.metaValue}>{monitor.currentFails}/{monitor.failureThreshold}</span>
        </span>
      </div>
    </div>
  );
}

export default function MonitorsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const queryClient = useQueryClient();

  const { data: monitors = [], isLoading } = useQuery({
    queryKey: ['monitors'],
    queryFn: async () => {
      const res = await monitorsApi.getAll();
      const d = res.data;
      return Array.isArray(d) ? (d as Monitor[]) : (d as any).data as Monitor[];
    },
    refetchInterval: 30_000,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { interval: 60, failureThreshold: 3 },
  });

  const mutation = useMutation({
    mutationFn: (payload: CreateMonitorPayload) => monitorsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      reset();
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      setCreateError(err?.response?.data?.message ?? 'Failed to create monitor');
    },
  });

  const onSubmit = (data: CreateForm) => {
    setCreateError('');
    mutation.mutate(data);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Monitors</h1>
          <p className={styles.subtitle}>{monitors.length} monitor{monitors.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button
          className="btn btn-primary"
          id="add-monitor-btn"
          onClick={() => setIsModalOpen(true)}
        >
          + Add Monitor
        </button>
      </div>

      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`skeleton ${styles.skeletonCard}`} />
          ))}
        </div>
      ) : monitors.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyIcon}>⬡</p>
          <p className={styles.emptyText}>No monitors yet</p>
          <p className={styles.emptySub}>Add your first monitor to start tracking uptime</p>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            Add your first monitor
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {monitors.map((m) => <MonitorCard key={m.id} monitor={m} />)}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setCreateError(''); }} title="Add Monitor">
        <form onSubmit={handleSubmit((d) => onSubmit(d))} className={styles.form} noValidate>
          <div className="form-group">
            <label className="form-label">Monitor name</label>
            <input className="form-input" placeholder="My API" {...register('name')} />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">URL to monitor</label>
            <input className="form-input" placeholder="https://api.myapp.com/health" {...register('url')} />
            {errors.url && <span className="form-error">{errors.url.message}</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Interval (seconds)</label>
              <input type="number" className="form-input" {...register('interval', { valueAsNumber: true })} />
              {errors.interval && <span className="form-error">{errors.interval.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Failure threshold</label>
              <input type="number" className="form-input" {...register('failureThreshold', { valueAsNumber: true })} />
              {errors.failureThreshold && <span className="form-error">{errors.failureThreshold.message}</span>}
            </div>
          </div>
          {createError && (
            <span style={{ fontSize: '13px', color: 'var(--color-down)', background: 'var(--color-down-bg)', borderRadius: '6px', padding: '8px 12px', display: 'block' }}>
              {createError}
            </span>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create Monitor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
