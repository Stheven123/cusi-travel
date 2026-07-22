const { Pool } = require('pg');
const { env }  = require('./env');

/* Soporte para DATABASE_URL (Neon, Render, Railway)
   o variables individuales para desarrollo local       */
// En producción con DATABASE_URL (Neon/Render) el TLS es obligatorio.
// DB_SSL_REJECT_UNAUTHORIZED=true activa validación de certificado (recomendado si el proveedor lo soporta).
const sslMode = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
  ? true
  : { rejectUnauthorized: false };

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: sslMode,
      max:                    10,
      idleTimeoutMillis:      30_000,
      connectionTimeoutMillis: 5_000,
    }
  : {
      host:                   env.DB_HOST,
      port:                   env.DB_PORT,
      database:               env.DB_NAME,
      user:                   env.DB_USER,
      password:               env.DB_PASSWORD,
      max:                    10,
      idleTimeoutMillis:      30_000,
      connectionTimeoutMillis: 3_000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('❌ Error inesperado en pool pg:', err.message);
});

const query            = (text, params) => pool.query(text, params);
const withTransaction  = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, withTransaction };
