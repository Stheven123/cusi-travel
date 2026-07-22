import client from './client';
export const reservasApi = {
  getAll:       (params)      => client.get('/reservas', { params }),
  getCalendario:(params)      => client.get('/reservas/calendario', { params }),
  getById:      (id)          => client.get(`/reservas/${id}`),
  create:       (data)        => client.post('/reservas', data),
  update:       (id, data)    => client.put(`/reservas/${id}`, data),
  cambiarEstado:(id, estado)  => client.patch(`/reservas/${id}/estado`, { estado_operacion: estado }),
  remove:       (id)          => client.delete(`/reservas/${id}`),
};
