const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const { sanitizeMiddleware } = require('./middleware/sanitize.middleware');
const { errorMiddleware }    = require('./middleware/error.middleware');
const routes                 = require('./routes');
const { env }                = require('./config/env');

const app = express();

// ── Trust proxy (Render/Netlify/Railway) — necesario para que
//    express-rate-limit y req.ip funcionen correctamente detrás
//    de un proxy inverso (de lo contrario todos comparten una IP).
app.set('trust proxy', 1);

// ── Seguridad HTTP ────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────
app.use(cors({
  origin:         env.CORS_ORIGIN,
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ──────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────
if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── Rate limiting global ──────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { ok: false, error: 'Demasiadas solicitudes', code: 'RATE_LIMITED' },
}));

// ── Rate limiting estricto para autenticación ─────────────
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { ok: false, error: 'Demasiados intentos de login', code: 'AUTH_RATE_LIMITED' },
}));

// ── Sanitización XSS de req.body ─────────────────────────
app.use(sanitizeMiddleware);

// ── Health check (sin auth) ───────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ ok: true, service: 'Cusi Travel API', version: '1.0.0' })
);

// ── Rutas de negocio ─────────────────────────────────────
app.use('/api', routes);

// ── 404 ───────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ ok: false, error: 'Ruta no encontrada', code: 'NOT_FOUND' })
);

// ── Manejador global de errores ───────────────────────────
app.use(errorMiddleware);

module.exports = app;
