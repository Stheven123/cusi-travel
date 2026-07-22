import client from './client';
export const tareasApi = {
  getAll:    (params)          => client.get('/tareas', { params }),
  getMias:   (params)          => client.get('/tareas/mias', { params }),
  getById:   (id)              => client.get(`/tareas/${id}`),
  create:    (data)            => client.post('/tareas', data),
  update:    (id, data)        => client.put(`/tareas/${id}`, data),
  completar: (id, notas)       => client.patch(`/tareas/${id}/completar`, { notas_cierre: notas }),
  remove:    (id)              => client.delete(`/tareas/${id}`),
};
