import styles from './Button.module.css';

const Button = ({ children, variant = 'primary', type = 'button', disabled = false, onClick, className = '' }) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${styles.button} ${styles[variant]} ${disabled ? styles.disabled : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
