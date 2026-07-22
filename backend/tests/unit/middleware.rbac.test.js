'use strict';

const { requireRoles, ROLES } = require('../../src/middleware/rbac.middleware');

function makeCtx(userRole) {
  const req = userRole ? { user: { id: 1, rol: userRole } } : {};
  return { req, res: {}, next: jest.fn() };
}

describe('requireRoles', () => {
  test('pasa con el rol correcto', () => {
    const { req, res, next } = makeCtx('ADMIN');
    requireRoles('ADMIN')(req, res, next);
    expect(next).toHaveBeenCalledWith(/* sin error */);
    expect(next.mock.calls[0]).toHaveLength(0);
  });

  test('pasa cuando el rol está dentro de un grupo', () => {
    const { req, res, next } = makeCtx('OPERACIONES');
    requireRoles(...ROLES.OPERATORS)(req, res, next);
    expect(next.mock.calls[0]).toHaveLength(0);
  });

  test('bloquea (403 FORBIDDEN) cuando el rol no tiene permiso', () => {
    const { req, res, next } = makeCtx('GUIA');
    requireRoles(...ROLES.MANAGEMENT)(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  test('bloquea (403) a SOLO_LECTURA en rutas de escritura', () => {
    const { req, res, next } = makeCtx('SOLO_LECTURA');
    requireRoles(...ROLES.OPERATORS)(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  test('bloquea (401 UNAUTHENTICATED) si req.user no está definido', () => {
    const { req, res, next } = makeCtx(null);
    requireRoles('ADMIN')(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHENTICATED');
  });

  test('sólo ADMIN pasa ADMIN_ONLY', () => {
    ['OPERACIONES', 'VENTAS', 'FINANZAS', 'GUIA', 'SOLO_LECTURA'].forEach(rol => {
      const { req, res, next } = makeCtx(rol);
      requireRoles(...ROLES.ADMIN_ONLY)(req, res, next);
      expect(next.mock.calls[0][0].statusCode).toBe(403);
      next.mockReset();
    });
    const { req, res, next } = makeCtx('ADMIN');
    requireRoles(...ROLES.ADMIN_ONLY)(req, res, next);
    expect(next.mock.calls[0]).toHaveLength(0);
  });
});
