import client from './client';
export const pasajerosApi = {
  getByReserva:      (reservaId) => client.get(`/pasajeros/reserva/${reservaId}`),
  getById:           (id)        => client.get(`/pasajeros/${id}`),
  alertasVencimiento:()          => client.get('/pasajeros/alertas-vencimiento'),
  create:            (data)      => client.post('/pasajeros', data),
  update:            (id, data)  => client.put(`/pasajeros/${id}`, data),
  remove:            (id)        => client.delete(`/pasajeros/${id}`),
};
