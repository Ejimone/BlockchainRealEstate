import api from './api';

export const getUsers = async () => (await api.get('/api/users/')).data;
 
export const deleteUser = async (id) => await api.delete(`/api/users/${id}/`); 