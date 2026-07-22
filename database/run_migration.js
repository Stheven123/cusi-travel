const path = require('path');
const { Client } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
const fs = require('fs');

async function run() {
  const file = process.argv[2];
  if (!file) { console.error('Uso: node run_migration.js <archivo.sql>'); process.exit(1); }

  const DB_URL = process.env.DATABASE_URL;
  if (!DB_URL) { console.error('DATABASE_URL no está definido en el entorno'); process.exit(1); }

  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Conectado a la base de datos');

  const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
  await client.query(sql);
  console.log(`${file} aplicada correctamente`);

  await client.end();
}

run().catch(err => { console.error('Error aplicando migración:', err.message); process.exit(1); });
