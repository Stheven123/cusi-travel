import apiClient from './client';

export const briefingsApi = {
  getAll:       (params = {}) => apiClient.get('/briefings', { params }),
  getByReserva: (reservaId)   => apiClient.get(`/briefings/by-reserva/${reservaId}`),
  create:       (data)        => apiClient.post('/briefings', data),
  update:       (id, data)    => apiClient.put(`/briefings/${id}`, data),
  remove:       (id)          => apiClient.delete(`/briefings/${id}`),
};
