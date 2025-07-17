import api from './api';

export const register = async (data) => {
  const response = await api.post('/api/register/', data);
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post('/api/login/', credentials);
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('username', credentials.username);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/api/users/me/');
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  
}; 