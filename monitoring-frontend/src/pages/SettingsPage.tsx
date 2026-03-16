import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';
import type { ChannelType } from '../types';
import styles from './SettingsPage.module.css';

const channelSchema = z.object({
  type: z.enum(['DISCORD', 'SLACK', 'EMAIL', 'WEBHOOK']),
  value: z.string().min(1, 'Webhook URL or email is required'),
});
type ChannelForm = z.infer<typeof channelSchema>;

const channelTypeOptions: { value: ChannelType; label: string; placeholder: string }[] = [
  { value: 'DISCORD', label: 'Discord Webhook', placeholder: 'https://discord.com/api/webhooks/...' },
  { value: 'SLACK', label: 'Slack Webhook', placeholder: 'https://hooks.slack.com/services/...' },
  { value: 'EMAIL', label: 'Email', placeholder: 'alerts@mycompany.com' },
  { value: 'WEBHOOK', label: 'Custom Webhook', placeholder: 'https://myapp.com/webhook' },
];

export default function SettingsPage() {
  const [success, setSuccess] = useState('');
  const [serverError, setServerError] = useState('');
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ChannelForm>({
    resolver: zodResolver(channelSchema),
    defaultValues: { type: 'DISCORD', value: '' },
  });

  const selectedType = watch('type');
  const placeholder = channelTypeOptions.find(o => o.value === selectedType)?.placeholder ?? '';

  const mutation = useMutation({
    mutationFn: (data: ChannelForm) => notificationsApi.create(data),
    onSuccess: () => {
      setSuccess('Notification channel added successfully!');
      setServerError('');
      reset();
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setTimeout(() => setSuccess(''), 4000);
    },
    onError: (err: any) => {
      setServerError(err?.response?.data?.message ?? 'Failed to add channel');
    },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your notification channels</p>
      </div>

      <div className={`card ${styles.section}`}>
        <h2 className={styles.sectionTitle}>Add Notification Channel</h2>
        <p className={styles.sectionDesc}>
          Get alerted via Discord, Slack, Email, or any custom webhook when a monitor goes down or recovers.
        </p>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className={styles.form} noValidate>
          <div className="form-group">
            <label className="form-label">Channel type</label>
            <select className="form-select" {...register('type')}>
              {channelTypeOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              {selectedType === 'EMAIL' ? 'Email address' : 'Webhook URL'}
            </label>
            <input
              className="form-input"
              placeholder={placeholder}
              {...register('value')}
            />
            {errors.value && <span className="form-error">{errors.value.message}</span>}
          </div>
          {serverError && (
            <span className={styles.errorBox}>{serverError}</span>
          )}
          {success && (
            <span className={styles.successBox}>{success}</span>
          )}
          <div>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending} id="add-channel-btn">
              {mutation.isPending ? 'Adding…' : 'Add Channel'}
            </button>
          </div>
        </form>
      </div>

      <div className={`card ${styles.infoCard}`}>
        <h2 className={styles.sectionTitle}>How notifications work</h2>
        <ul className={styles.infoList}>
          <li>🔴 An alert fires when a monitor exceeds its <strong>failure threshold</strong> consecutive failures</li>
          <li>✅ A recovery notification fires when the monitor comes back up</li>
          <li>📡 All active channels receive the same notification simultaneously</li>
        </ul>
      </div>
    </div>
  );
}
