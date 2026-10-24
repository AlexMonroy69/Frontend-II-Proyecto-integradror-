import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import styles from '../Login/Login.module.css';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { changePassword } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = {};

    if (!formData.currentPassword) {
      validationErrors.currentPassword = 'La contraseña actual es obligatoria';
    }
    if (!formData.newPassword) {
      validationErrors.newPassword = 'La nueva contraseña es obligatoria';
    } else if (formData.newPassword.length < 8) {
      validationErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      navigate('/login', {
        replace: true,
        state: { notice: 'La contraseña se cambió. Inicia sesión con tu nueva contraseña.' },
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.details?.[0] ||
          'No se pudo cambiar la contraseña. Verifica los datos e inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <h1 className={styles.title}>Cambiar contraseña</h1>
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Contraseña actual"
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={(event) =>
              setFormData((previous) => ({
                ...previous,
                currentPassword: event.target.value,
              }))
            }
            error={errors.currentPassword}
          />
          <Input
            label="Nueva contraseña"
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={(event) =>
              setFormData((previous) => ({
                ...previous,
                newPassword: event.target.value,
              }))
            }
            error={errors.newPassword}
          />
          <Button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Cambiando...' : 'Cambiar contraseña'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ChangePassword;
