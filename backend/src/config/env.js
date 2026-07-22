const { z } = require('zod');

const schema = z.object({
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
  PORT:         z.coerce.number().default(3001),

  /* Base de datos — acepta DATABASE_URL (Neon/Render) o vars individuales */
  DATABASE_URL: z.string().url().optional(),
  DB_HOST:      z.string().optional().default('localhost'),
  DB_PORT:      z.coerce.number().optional().default(5432),
  DB_NAME:      z.string().optional().default('cusi_travel'),
  DB_USER:      z.string().optional().default('cusi_admin'),
  DB_PASSWORD:  z.string().optional().default(''),

  JWT_SECRET:   z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES:  z.string().default('24h'),
  CORS_ORIGIN:  z.string().default('http://localhost:5173'),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Variables de entorno inválidas:');
  result.error.errors.forEach(e =>
    console.error(`   ${e.path.join('.')}: ${e.message}`)
  );
  process.exit(1);
}

/* Validar que haya al menos una forma de conectar a la DB */
if (!result.data.DATABASE_URL && !result.data.DB_HOST) {
  console.error('❌ Se requiere DATABASE_URL o las vars DB_HOST/DB_NAME/DB_USER/DB_PASSWORD');
  process.exit(1);
}

module.exports = { env: result.data };
