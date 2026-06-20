import api from './api';

export const authAPI = {
  status: async () => {
    const response = await api.get('/auth/status/');
    return response.data;
  },
  login: async (username, password) => {
    const response = await api.post('/login/', { username, password });
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/logout/');
    return response.data;
  }
};

export default authAPI;
