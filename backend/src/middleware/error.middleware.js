class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code       = code;
    this.isOperational = true;
  }
}

const PG_CODES = {
  '23505': [409, 'Ya existe un registro con ese identificador único',   'DUPLICATE_KEY'],
  '23503': [422, 'Referencia inválida: el registro relacionado no existe', 'FK_VIOLATION'],
  '23514': [422, 'Datos inválidos: restricción de negocio no cumplida', 'CHECK_VIOLATION'],
  '23502': [422, 'Campo obligatorio no proporcionado',                   'NOT_NULL_VIOLATION'],
};

const errorMiddleware = (err, _req, res, _next) => {
  // Errores de PostgreSQL conocidos
  if (err.code && PG_CODES[err.code]) {
    const [status, message, code] = PG_CODES[err.code];
    return res.status(status).json({ ok: false, error: message, code });
  }

  // Errores de validación Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      ok: false,
      error: 'Datos de entrada inválidos',
      code: 'VALIDATION_ERROR',
      details: err.errors.map(e => ({ campo: e.path.join('.'), mensaje: e.message })),
    });
  }

  const status  = err.statusCode || 500;
  const isDev   = process.env.NODE_ENV === 'development';

  if (status >= 500) console.error('[SERVER ERROR]', err.message, err.stack);

  res.status(status).json({
    ok:    false,
    error: err.message || 'Error interno del servidor',
    code:  err.code    || 'INTERNAL_ERROR',
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = { AppError, errorMiddleware };
