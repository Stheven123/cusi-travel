const { Router }    = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');

const authRoutes        = require('./auth.routes');
const reservasRoutes    = require('./reservas.routes');
const pasajerosRoutes   = require('./pasajeros.routes');
const serviciosRoutes   = require('./servicios.routes');
const proveedoresRoutes = require('./proveedores.routes');
const tareasRoutes      = require('./tareas.routes');
const usuariosRoutes    = require('./usuarios.routes');
const reportesRoutes    = require('./reportes.routes');
const briefingsRoutes   = require('./briefings.routes');
const agenciasRoutes    = require('./agencias.routes');

const router = Router();

// Rutas públicas
router.use('/auth', authRoutes);

// Rutas protegidas (JWT obligatorio)
router.use(authMiddleware);
router.use('/reservas',    reservasRoutes);
router.use('/pasajeros',   pasajerosRoutes);
router.use('/servicios',   serviciosRoutes);
router.use('/proveedores', proveedoresRoutes);
router.use('/tareas',      tareasRoutes);
router.use('/usuarios',    usuariosRoutes);
router.use('/reportes',    reportesRoutes);
router.use('/briefings',   briefingsRoutes);
router.use('/agencias',   agenciasRoutes);

module.exports = router;
