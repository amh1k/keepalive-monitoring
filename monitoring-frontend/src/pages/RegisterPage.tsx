import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage.module.css';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await authApi.register(data.email, data.password);
      // Auto-login after register
      const loginRes = await authApi.login(data.email, data.password);
      const { user: u } = loginRes.data as { user: { id: string; email: string } };
      setUser(u);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setServerError(err?.response?.data?.message ?? 'Registration failed.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span className={styles.logoText}>Keepalive</span>
        </div>
        <h1 className={styles.heading}>Create an account</h1>
        <p className={styles.sub}>Start monitoring your services in seconds</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email address</label>
            <input id="reg-email" type="email" className="form-input" placeholder="you@company.com" {...register('email')} />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" className="form-input" placeholder="min. 6 characters" {...register('password')} />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm password</label>
            <input id="reg-confirm" type="password" className="form-input" placeholder="••••••••" {...register('confirm')} />
            {errors.confirm && <span className="form-error">{errors.confirm.message}</span>}
          </div>
          {serverError && <span className={styles.serverError}>{serverError}</span>}
          <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', justifyContent: 'center' }}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
