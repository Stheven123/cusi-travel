import client from './client';
export const proveedoresApi = {
  getAll:           (params)        => client.get('/proveedores', { params }),
  getById:          (id)            => client.get(`/proveedores/${id}`),
  create:           (data)          => client.post('/proveedores', data),
  update:           (id, data)      => client.put(`/proveedores/${id}`, data),
  remove:           (id)            => client.delete(`/proveedores/${id}`),
  getAllDetalles:        (params)    => client.get('/proveedores/detalles', { params }),
  getDetallesByReserva: (reservaId) => client.get(`/proveedores/detalles/reserva/${reservaId}`),
  createDetalle:    (data)          => client.post('/proveedores/detalles', data),
  updateDetalle:    (id, data)      => client.put(`/proveedores/detalles/${id}`, data),
  deleteDetalle:    (id)            => client.delete(`/proveedores/detalles/${id}`),
  getTareasOperacion:    (detalleId)       => client.get(`/proveedores/detalles/${detalleId}/tareas`),
  createTareaOperacion:  (detalleId, data) => client.post(`/proveedores/detalles/${detalleId}/tareas`, data),
  updateTareaOperacion:  (tareaId, data)   => client.put(`/proveedores/detalles/tareas/${tareaId}`, data),
  deleteTareaOperacion:  (tareaId)         => client.delete(`/proveedores/detalles/tareas/${tareaId}`),
};
