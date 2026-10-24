import apiClient from './api';
import axios from 'axios';
import {
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearAllTokens,
} from '../utils/tokenManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
let refreshPromise = null;

export const login = async (usernameOrEmail, password) => {
  const response = await apiClient.post('/auth/login', {
    usernameOrEmail,
    password,
  });

  const { token, refreshToken } = response.data;

  setAccessToken(token);
  setRefreshToken(refreshToken);

  return response.data;
};

export const register = async (username, email, password) => {
  const response = await apiClient.post('/auth/register', {
    username,
    email,
    password,
  });

  const { token, refreshToken } = response.data;

  setAccessToken(token);
  setRefreshToken(refreshToken);

  return response.data;
};

export const refreshTokens = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  refreshPromise = axios
    .post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken })
    .then((response) => {
      const { token, refreshToken: newRefreshToken } = response.data;
      setAccessToken(token);
      setRefreshToken(newRefreshToken);
      return response.data;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

export const logout = async () => {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiClient.post('/auth/logout', { refreshToken });
    }
    return { revoked: true };
  } catch (error) {
    return { revoked: false, error };
  } finally {
    clearAllTokens();
  }
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  await apiClient.put('/account/password', {
    currentPassword,
    newPassword,
  });
  clearAllTokens();
};
