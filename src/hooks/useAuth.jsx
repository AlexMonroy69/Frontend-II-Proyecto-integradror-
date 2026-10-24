import { useCallback, useEffect, useState } from 'react';
import {
  login as loginService,
  register as registerService,
  logout as logoutService,
  getCurrentUser,
  refreshTokens,
  changePassword as changePasswordService,
} from '../services/authService';
import { getRefreshToken, clearAllTokens } from '../utils/tokenManager';
import { AuthContext } from './authContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getRefreshToken()));
  const [error, setError] = useState(null);
  const [initializationError, setInitializationError] = useState(null);
  const [sessionNotice, setSessionNotice] = useState(null);

  const loadSession = useCallback(async () => {
    try {
      if (!getRefreshToken()) {
        return { userData: null, sessionError: null };
      }
      await refreshTokens();
      const userData = await getCurrentUser();
      return { userData, sessionError: null };
    } catch (err) {
      return { userData: null, sessionError: err };
    }
  }, []);

  const applySessionResult = useCallback(({ userData, sessionError }) => {
    if (sessionError) {
      if (
        !getRefreshToken() ||
        sessionError.response?.status === 400 ||
        sessionError.response?.status === 401
      ) {
        clearAllTokens();
      } else {
        setInitializationError(
          'No se pudo verificar la sesión. Comprueba la conexión e inténtalo de nuevo.'
        );
      }
      setUser(null);
      return;
    }

    setInitializationError(null);
    setUser(userData);
  }, []);

  useEffect(() => {
    let active = true;
    loadSession()
      .then((result) => {
        if (active) {
          applySessionResult(result);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [applySessionResult, loadSession]);

  const retryAuth = useCallback(() => {
    if (!getRefreshToken()) {
      setUser(null);
      setInitializationError(null);
      setLoading(false);
      return Promise.resolve();
    }
    setLoading(true);
    setInitializationError(null);
    return loadSession()
      .then(applySessionResult)
      .finally(() => setLoading(false));
  }, [applySessionResult, loadSession]);

  const login = async (usernameOrEmail, password) => {
    try {
      setError(null);
      const authData = await loginService(usernameOrEmail, password);
      const userData = await getCurrentUser();
      setSessionNotice(null);
      setUser(userData);
      return authData;
    } catch (err) {
      setError(err.response?.data?.details?.[0] || 'Error al iniciar sesión');
      throw err;
    }
  };

  const register = async (username, email, password) => {
    try {
      setError(null);
      const authData = await registerService(username, email, password);
      const userData = await getCurrentUser();
      setSessionNotice(null);
      setUser(userData);
      return authData;
    } catch (err) {
      setError(err.response?.data?.details?.[0] || 'Error al registrarse');
      throw err;
    }
  };

  const logout = async () => {
    try {
      const result = await logoutService();
      setSessionNotice(
        result.revoked
          ? null
          : 'Se cerró la sesión en este dispositivo, pero no se pudo confirmar la revocación en el servidor.'
      );
      return result;
    } finally {
      setUser(null);
      setError(null);
      setInitializationError(null);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      await changePasswordService(currentPassword, newPassword);
      setSessionNotice('La contraseña se cambió. Inicia sesión con tu nueva contraseña.');
      setUser(null);
    } catch (err) {
      setError(err.response?.data?.details?.[0] || 'Error al cambiar contraseña');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    sessionNotice,
    initializationError,
    retryAuth,
    login,
    register,
    logout,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
