const { Router }              = require('express');
const { requireRoles, ROLES } = require('../middleware/rbac.middleware');
const ctrl = require('../controllers/proveedores.controller');

const router = Router();

// Detalles — ANTES de /:id para que Express no los confunda
router.get('/detalles',                    ctrl.getAllDetalles);
router.get('/detalles/reserva/:reservaId', ctrl.getDetallesByReserva);
router.post('/detalles',                   requireRoles(...ROLES.OPERATORS), ctrl.createDetalle);
router.put('/detalles/:detalleId',         requireRoles(...ROLES.OPERATORS), ctrl.updateDetalle);
router.delete('/detalles/:detalleId',      requireRoles(...ROLES.ADMIN_ONLY), ctrl.deleteDetalle);

// Checklist de tareas por operación
router.get('/detalles/:detalleId/tareas',      ctrl.getTareasOperacion);
router.post('/detalles/:detalleId/tareas',     requireRoles(...ROLES.OPERATORS), ctrl.createTareaOperacion);
router.put('/detalles/tareas/:tareaId',        requireRoles(...ROLES.OPERATORS), ctrl.updateTareaOperacion);
router.delete('/detalles/tareas/:tareaId',     requireRoles(...ROLES.OPERATORS), ctrl.deleteTareaOperacion);

router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/',   requireRoles(...ROLES.MANAGEMENT), ctrl.create);
router.put('/:id', requireRoles(...ROLES.MANAGEMENT), ctrl.update);
router.delete('/:id', requireRoles(...ROLES.ADMIN_ONLY), ctrl.remove);

module.exports = router;
