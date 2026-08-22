import client from './client';
export const notasApi = {
  getByReserva: (reservaId)   => client.get(`/notas/by-reserva/${reservaId}`),
  create:       (data)        => client.post('/notas', data),
  update:       (id, data)    => client.put(`/notas/${id}`, data),
  remove:       (id)          => client.delete(`/notas/${id}`),
};
