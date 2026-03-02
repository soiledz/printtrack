// frontend/src/utils/api.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Автоматически добавляем JWT из localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pt_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// При 401 — сбросить токен и перезагрузить
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pt_token')
      // убираем автоперезагрузку
    }
    return Promise.reject(err)
  }
)
