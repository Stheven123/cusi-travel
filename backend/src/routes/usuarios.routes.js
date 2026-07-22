const { Router }              = require('express');
const { requireRoles, ROLES } = require('../middleware/rbac.middleware');
const ctrl = require('../controllers/usuarios.controller');

const router = Router();

router.get('/',                          requireRoles(...ROLES.MANAGEMENT),  ctrl.getAll);
router.get('/:id',                       requireRoles(...ROLES.MANAGEMENT),  ctrl.getById);
router.post('/',                         requireRoles(...ROLES.ADMIN_ONLY),   ctrl.create);
router.put('/:id',                       requireRoles(...ROLES.ADMIN_ONLY),   ctrl.update);
router.patch('/:id/cambiar-password',    requireRoles(...ROLES.ADMIN_ONLY),   ctrl.cambiarPassword);
router.patch('/:id/toggle-activo',       requireRoles(...ROLES.ADMIN_ONLY),   ctrl.toggleActivo);

module.exports = router;
