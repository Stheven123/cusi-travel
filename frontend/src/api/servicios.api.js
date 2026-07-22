import client from './client';
export const serviciosApi = {
  getAll:           (params)            => client.get('/servicios', { params }),
  getById:          (id)                => client.get(`/servicios/${id}`),
  create:           (data)              => client.post('/servicios', data),
  update:           (id, data)          => client.put(`/servicios/${id}`, data),
  clonar:           (id, data)          => client.post(`/servicios/${id}/clonar`, data),
  remove:           (id)                => client.delete(`/servicios/${id}`),
  addItinerario:    (id, data)          => client.post(`/servicios/${id}/itinerarios`, data),
  updateItinerario: (id, diaId, data)   => client.put(`/servicios/${id}/itinerarios/${diaId}`, data),
  deleteItinerario: (id, diaId)         => client.delete(`/servicios/${id}/itinerarios/${diaId}`),
};
