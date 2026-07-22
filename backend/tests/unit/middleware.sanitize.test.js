'use strict';

const { sanitizeMiddleware } = require('../../src/middleware/sanitize.middleware');

function run(body) {
  const req  = { body };
  const res  = {};
  const next = jest.fn();
  sanitizeMiddleware(req, res, next);
  return { req, next };
}

describe('sanitizeMiddleware — protección XSS', () => {
  test('llama next() siempre', () => {
    const { next } = run({ campo: 'valor normal' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]).toHaveLength(0);
  });

  test('elimina etiquetas <script> de strings', () => {
    const { req } = run({ nombre: '<script>alert(1)</script>Nombre' });
    expect(req.body.nombre).not.toContain('<script>');
    expect(req.body.nombre).toContain('Nombre');
  });

  test('elimina atributos de evento onclick, onload, etc.', () => {
    const { req } = run({ desc: '<img src=x onerror=alert(1)>' });
    expect(req.body.desc).not.toMatch(/onerror/i);
  });

  test('no altera strings seguros', () => {
    const { req } = run({ titulo: 'Inca Trail 4 Días', precio: 250.5 });
    expect(req.body.titulo).toBe('Inca Trail 4 Días');
    expect(req.body.precio).toBe(250.5);
  });

  test('sanitiza recursivamente en objetos anidados', () => {
    const { req } = run({ pasajero: { nombre: '<b>Juan</b>', nota: '<script>x</script>' } });
    expect(req.body.pasajero.nota).not.toContain('<script>');
  });

  test('maneja arrays correctamente', () => {
    const { req } = run({ tags: ['<script>hack</script>', 'normal'] });
    expect(req.body.tags[0]).not.toContain('<script>');
    expect(req.body.tags[1]).toBe('normal');
  });

  test('no falla con body vacío o null', () => {
    expect(() => run(null)).not.toThrow();
    expect(() => run({})).not.toThrow();
  });
});
