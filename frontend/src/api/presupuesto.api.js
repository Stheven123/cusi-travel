import client from './client';
export const presupuestoApi = {
  getByReserva: (reservaId)   => client.get(`/presupuesto/by-reserva/${reservaId}`),
  create:       (data)        => client.post('/presupuesto', data),
  update:       (id, data)    => client.put(`/presupuesto/${id}`, data),
  remove:       (id)          => client.delete(`/presupuesto/${id}`),
};
