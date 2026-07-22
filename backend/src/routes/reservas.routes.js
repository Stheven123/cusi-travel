const { Router }        = require('express');
const { requireRoles, ROLES } = require('../middleware/rbac.middleware');
const ctrl = require('../controllers/reservas.controller');

const router = Router();

router.get('/',             ctrl.getAll);          // todos los roles
router.get('/calendario',   ctrl.getCalendario);   // todos los roles
router.get('/:id',          ctrl.getById);         // todos los roles
router.post('/',            requireRoles(...ROLES.OPERATORS), ctrl.create);
router.put('/:id',          requireRoles(...ROLES.OPERATORS), ctrl.update);
router.patch('/:id/estado', requireRoles(...ROLES.OPERATORS), ctrl.cambiarEstado);
router.delete('/:id',       requireRoles(...ROLES.ADMIN_ONLY), ctrl.remove);

module.exports = router;
