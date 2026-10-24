import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import styles from './Header.module.css';

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await logout();
    navigate('/login', {
      replace: true,
      state: result.revoked
        ? null
        : { notice: 'Se cerró la sesión en este dispositivo, pero no se pudo confirmar la revocación en el servidor.' },
    });
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          Todo App
        </Link>
        <nav className={styles.nav}>
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link to="/" className={styles.navLink}>
                  Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link to="/users" className={styles.navLink}>
                  Usuarios
                </Link>
              )}
              <Link to="/tasks" className={styles.navLink}>
                Tareas
              </Link>
              <span className={styles.userInfo}>
                {user?.username}
              </span>
              <Link to="/account/password" className={styles.navLink}>
                Cambiar contraseña
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.navLink}>
                Iniciar Sesión
              </Link>
              <Link to="/register">
                <Button variant="primary">Registrarse</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
