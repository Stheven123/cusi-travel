import api from './client';

export const usuariosApi = {
  getAll:          ()            => api.get('/usuarios'),
  getById:         (id)          => api.get(`/usuarios/${id}`),
  create:          (data)        => api.post('/usuarios', data),
  update:          (id, data)    => api.put(`/usuarios/${id}`, data),
  cambiarPassword: (id, data)    => api.patch(`/usuarios/${id}/cambiar-password`, data),
  toggleActivo:    (id)          => api.patch(`/usuarios/${id}/toggle-activo`),
};
