'use strict';

const jwt = require('jsonwebtoken');

// Cargar el middleware después de que setup.js ya definió JWT_SECRET
const { authMiddleware } = require('../../src/middleware/auth.middleware');

const SECRET = process.env.JWT_SECRET;

function makeReqRes(authHeader) {
  const req = { headers: { authorization: authHeader } };
  const res = {};
  return { req, res };
}

describe('authMiddleware', () => {
  test('llama next(AppError 401) si no hay cabecera Authorization', () => {
    const { req, res } = makeReqRes(undefined);
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('NO_TOKEN');
  });

  test('llama next(AppError 401) si el header no empieza con "Bearer "', () => {
    const { req, res } = makeReqRes('Basic dXNlcjpwYXNz');
    const next = jest.fn();
    authMiddleware(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('NO_TOKEN');
  });

  test('llama next(AppError 401 TOKEN_INVALID) con un token malformado', () => {
    const { req, res } = makeReqRes('Bearer esto.no.es.un.jwt');
    const next = jest.fn();
    authMiddleware(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('TOKEN_INVALID');
  });

  test('llama next(AppError 401 TOKEN_EXPIRED) con un token expirado', () => {
    const token = jwt.sign({ id: 1, rol: 'ADMIN' }, SECRET, { expiresIn: -1 });
    const { req, res } = makeReqRes(`Bearer ${token}`);
    const next = jest.fn();
    authMiddleware(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('TOKEN_EXPIRED');
  });

  test('adjunta req.user y llama next() sin error con token válido', () => {
    const payload = { id: 42, rol: 'OPERACIONES', nombre: 'Test User' };
    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });
    const { req, res } = makeReqRes(`Bearer ${token}`);
    const next = jest.fn();
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(/* sin argumentos */);
    expect(req.user).toMatchObject({ id: 42, rol: 'OPERACIONES' });
  });

  test('rechaza un token firmado con un secret diferente', () => {
    const token = jwt.sign({ id: 1, rol: 'ADMIN' }, 'otro_secret_completamente_diferente', { expiresIn: '1h' });
    const { req, res } = makeReqRes(`Bearer ${token}`);
    const next = jest.fn();
    authMiddleware(req, res, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('TOKEN_INVALID');
  });
});
