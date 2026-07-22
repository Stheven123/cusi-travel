// Cargar variables de entorno para tests
require('dotenv').config();

// Asegurar que el entorno de test esté definido
process.env.NODE_ENV = 'test';

// JWT_SECRET de fallback para unit tests que no usan el .env real
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_secret_at_least_32_characters_long_for_jest_unit_tests';
}
