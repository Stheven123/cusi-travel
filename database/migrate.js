const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_URL = process.argv[2];
if (!DB_URL) { console.error('Uso: node migrate.js <DATABASE_URL>'); process.exit(1); }

async function run() {
  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Conectado a Neon');

  const files = ['01_ddl_schema.sql', '02_seed_demo.sql'];
  for (const file of files) {
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
    console.log(`⏳ Ejecutando ${file}...`);
    await client.query(sql);
    console.log(`✅ ${file} completado`);
  }

  await client.end();
  console.log('🎉 Migración completa');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
