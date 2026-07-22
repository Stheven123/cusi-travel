'use strict';

const request = require('supertest');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const app     = require('../../src/app');
const { pool } = require('../../src/config/database');

// Usuario de prueba creado para esta suite; se elimina al final
const TEST_USER = {
  codigo:    'USR-999',
  nombre:    'Test',
  apellido:  'Jest',
  email:     'test.jest@cusitravel-test.internal',
  password:  'TestPass123!',
  rol:       'OPERACIONES',
};

let testUserId;

beforeAll(async () => {
  const hash = await bcrypt.hash(TEST_USER.password, 12);
  const { rows } = await pool.query(
    `INSERT INTO cusi.usuarios (codigo, nombre, apellido, email, password_hash, rol, activo)
     VALUES ($1,$2,$3,$4,$5,$6,TRUE)
     ON CONFLICT (email) DO UPDATE SET password_hash = $5, activo = TRUE
     RETURNING id`,
    [TEST_USER.codigo, TEST_USER.nombre, TEST_USER.apellido,
     TEST_USER.email, hash, TEST_USER.rol]
  );
  testUserId = rows[0].id;
});

afterAll(async () => {
  // Limpiar logs de auditoría del usuario de prueba
  await pool.query('DELETE FROM cusi.logs_auditoria WHERE usuario_id = $1', [testUserId]);
  await pool.query('DELETE FROM cusi.usuarios WHERE id = $1', [testUserId]);
  await pool.end();
});

// ── POST /api/auth/login ───────────────────────────────────────
describe('POST /api/auth/login', () => {
  test('devuelve token JWT y datos de usuario con credenciales correctas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    expect(res.body.data.user).not.toHaveProperty('password_hash');

    // El token debe ser un JWT válido y decodificable
    const decoded = jwt.decode(res.body.data.token);
    expect(decoded.rol).toBe(TEST_USER.rol);
  });

  test('devuelve 401 con contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'ContraseñaIncorrecta!' });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  test('devuelve 401 con email que no existe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@example.com', password: 'cualquier' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  test('devuelve 400 con body inválido (email malformado)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-es-un-email', password: '12345678' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('devuelve 400 sin password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email });

    expect(res.status).toBe(400);
  });

  test('no filtra el password_hash en la respuesta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    const body = JSON.stringify(res.body);
    expect(body).not.toContain('password_hash');
    expect(body).not.toContain('$2b$');
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────
describe('GET /api/auth/me', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    token = res.body.data.token;
  });

  test('devuelve datos del usuario autenticado', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(TEST_USER.email);
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

  test('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('devuelve 401 con token manipulado', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}tampered`);
    expect(res.status).toBe(401);
  });
});

// ── POST /api/auth/logout ─────────────────────────────────────
describe('POST /api/auth/logout', () => {
  test('cierra sesión correctamente con token válido', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    const tok = loginRes.body.data.token;

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tok}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('devuelve 401 al hacer logout sin token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});
