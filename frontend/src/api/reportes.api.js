import client from './client';
export const reportesApi = {
  getKPIs:           ()              => client.get('/reportes/kpis'),
  reporteProveedores:(filtros)       => client.post('/reportes/proveedores', filtros),
  reporteProveedoresExcel:(filtros)  => client.post('/reportes/proveedores/excel', filtros, { responseType: 'blob' }),
  resumenMensual:    (anio, mes)     => client.get('/reportes/resumen-mensual', { params: { anio, mes } }),
  proximas:          (dias = 7)      => client.get('/reportes/proximas', { params: { dias } }),
  generarInvoice:    (reservaId, payload) => client.post(`/reportes/invoice/${reservaId}`, payload, { responseType: 'blob' }),
  previewInvoice:    (reservaId, payload = {}) => client.post(`/reportes/invoice/${reservaId}/preview`, payload),
  generarCierreReserva: (reservaId, payload = {}) => client.post(`/reportes/cierre/reserva/${reservaId}`, payload, { responseType: 'blob' }),
  previewCierreReserva: (reservaId) => client.get(`/reportes/cierre/reserva/${reservaId}/preview`),
};
