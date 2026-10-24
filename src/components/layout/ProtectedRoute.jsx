import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const {
    isAuthenticated,
    isAdmin,
    loading,
    initializationError,
    retryAuth,
    sessionNotice,
  } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (initializationError) {
    return (
      <div role="alert">
        <p>{initializationError}</p>
        <Button onClick={retryAuth}>Reintentar</Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={sessionNotice ? { notice: sessionNotice } : undefined}
      />
    );
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
};

export default ProtectedRoute;
