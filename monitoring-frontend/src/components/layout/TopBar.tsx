import { useAuth } from '../../context/AuthContext';
import styles from './TopBar.module.css';

export default function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className={styles.topbar}>
      <div className={styles.spacer} />
      <div className={styles.right}>
        <span className={styles.email}>{user?.email}</span>
        <button className="btn btn-secondary" onClick={logout} id="logout-btn">
          Sign out
        </button>
      </div>
    </header>
  );
}
