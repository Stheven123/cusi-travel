import client from './client';
export const agenciasApi = {
  getAll:  (params)   => client.get('/agencias', { params }),
  getById: (id)       => client.get(`/agencias/${id}`),
  create:  (data)     => client.post('/agencias', data),
  update:  (id, data) => client.put(`/agencias/${id}`, data),
  remove:  (id)       => client.delete(`/agencias/${id}`),
};
