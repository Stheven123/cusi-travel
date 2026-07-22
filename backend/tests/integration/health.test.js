'use strict';

const request = require('supertest');
const app     = require('../../src/app');

describe('GET /health', () => {
  test('responde 200 con ok:true y nombre del servicio', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe('Cusi Travel API');
  });
});

describe('Ruta inexistente', () => {
  test('responde 404 con code NOT_FOUND', async () => {
    const res = await request(app).get('/ruta-que-no-existe');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

describe('Rutas protegidas sin token', () => {
  const protectedRoutes = [
    ['GET',    '/api/reservas'],
    ['GET',    '/api/servicios'],
    ['GET',    '/api/proveedores'],
    ['GET',    '/api/tareas'],
    ['GET',    '/api/usuarios'],
    ['GET',    '/api/reportes/kpis'],
  ];

  test.each(protectedRoutes)(
    '%s %s devuelve 401 sin Authorization header',
    async (method, path) => {
      const res = await request(app)[method.toLowerCase()](path);
      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
    }
  );
});
