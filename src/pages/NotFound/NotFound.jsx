import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import styles from './NotFound.module.css';

const NotFound = () => {
  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <h1 className={styles.title}>404</h1>
        <p className={styles.message}>Página no encontrada</p>
        <p className={styles.description}>
          La página que estás buscando no existe o ha sido movida.
        </p>
        <Link to="/">
          <Button>Volver al Inicio</Button>
        </Link>
      </Card>
    </div>
  );
};

export default NotFound;
