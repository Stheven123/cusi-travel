'use strict';

const { AppError, errorMiddleware } = require('../../src/middleware/error.middleware');

function makeRes() {
  const res = {
    _status: null, _body: null,
    status(s) { this._status = s; return this; },
    json(b)   { this._body  = b; return this; },
  };
  return res;
}

describe('AppError', () => {
  test('crea un error con statusCode y code correctos', () => {
    const e = new AppError('No encontrado', 404, 'NOT_FOUND');
    expect(e.message).toBe('No encontrado');
    expect(e.statusCode).toBe(404);
    expect(e.code).toBe('NOT_FOUND');
    expect(e.isOperational).toBe(true);
  });

  test('usa valores por defecto (500, INTERNAL_ERROR)', () => {
    const e = new AppError('Fallo');
    expect(e.statusCode).toBe(500);
    expect(e.code).toBe('INTERNAL_ERROR');
  });
});

describe('errorMiddleware', () => {
  const req = { method: 'GET', url: '/' };
  const next = jest.fn();

  test('mapea error de PG 23505 a 409 DUPLICATE_KEY', () => {
    const res = makeRes();
    errorMiddleware({ code: '23505' }, req, res, next);
    expect(res._status).toBe(409);
    expect(res._body.code).toBe('DUPLICATE_KEY');
    expect(res._body.ok).toBe(false);
  });

  test('mapea error de PG 23503 (FK) a 422', () => {
    const res = makeRes();
    errorMiddleware({ code: '23503' }, req, res, next);
    expect(res._status).toBe(422);
    expect(res._body.code).toBe('FK_VIOLATION');
  });

  test('mapea ZodError a 400 VALIDATION_ERROR con detalles', () => {
    const res = makeRes();
    const zodErr = {
      name: 'ZodError',
      errors: [{ path: ['email'], message: 'Email inválido' }],
    };
    errorMiddleware(zodErr, req, res, next);
    expect(res._status).toBe(400);
    expect(res._body.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res._body.details)).toBe(true);
  });

  test('responde con statusCode del AppError', () => {
    const res = makeRes();
    const err = new AppError('No autorizado', 401, 'NO_TOKEN');
    errorMiddleware(err, req, res, next);
    expect(res._status).toBe(401);
    expect(res._body.code).toBe('NO_TOKEN');
  });

  test('responde 500 para errores desconocidos', () => {
    const res = makeRes();
    errorMiddleware(new Error('algo raro'), req, res, next);
    expect(res._status).toBe(500);
  });
});
