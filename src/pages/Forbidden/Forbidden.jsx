import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import styles from './Forbidden.module.css';

const Forbidden = () => {
  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <h1 className={styles.title}>403</h1>
        <p className={styles.message}>Acceso Denegado</p>
        <p className={styles.description}>
          No tienes permisos para acceder a esta página.
        </p>
        <Link to="/">
          <Button>Volver al inicio</Button>
        </Link>
      </Card>
    </div>
  );
};

export default Forbidden;
