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
};
