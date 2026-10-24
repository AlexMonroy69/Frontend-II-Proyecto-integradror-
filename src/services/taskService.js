import apiClient from './api';

export const getTasks = async () => {
  const response = await apiClient.get('/tasks');
  return response.data;
};

export const getTask = async (id) => {
  const response = await apiClient.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await apiClient.post('/tasks', taskData);
  return response.data;
};

export const updateTask = async (id, taskData) => {
  const response = await apiClient.put(`/tasks/${id}`, taskData);
  return response.data;
};

export const deleteTask = async (id) => {
  await apiClient.delete(`/tasks/${id}`);
};
