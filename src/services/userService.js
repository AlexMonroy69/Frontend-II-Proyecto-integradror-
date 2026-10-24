import apiClient from './api';

export const getUsers = async (params = {}) => {
  const response = await apiClient.get('/users', { params });
  return response.data;
};

export const getUser = async (id) => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await apiClient.post('/users', userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await apiClient.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  await apiClient.delete(`/users/${id}`);
};

export const changeUserPassword = async (id, newPassword) => {
  await apiClient.put(`/users/${id}/password`, { newPassword });
};
