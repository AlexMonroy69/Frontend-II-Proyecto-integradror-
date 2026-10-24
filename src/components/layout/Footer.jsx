import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.text}>
          © 2026 Todo App. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
