import axios from 'axios';

export const api = axios.create({
  // Tenta ler a variável do Render, se não existir (como na sua máquina), usa o localhost
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@tmao:token");
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});