require('dotenv').config();
const app = require('./src/app');
const { pool } = require('./src/config/database');
const { env } = require('./src/config/env');

const start = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL conectado');

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Cusi Travel API en puerto ${env.PORT}  [${env.NODE_ENV}]`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} recibido — cerrando servidor...`);
      server.close(async () => {
        await pool.end();
        console.log('✅ Conexiones cerradas correctamente');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
  } catch (err) {
    console.error('❌ Error al iniciar:', err.message);
    process.exit(1);
  }
};

start();
