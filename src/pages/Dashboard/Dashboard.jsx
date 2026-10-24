import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/common/Card';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <h1 className={styles.title}>Bienvenido, {user?.username}!</h1>
        <p className={styles.text}>
          {isAdmin ? 'Tienes acceso de administrador.' : 'Tu cuenta está lista.'}
        </p>
      </Card>
    </div>
  );
};

export default Dashboard;
