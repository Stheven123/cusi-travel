const { Router }              = require('express');
const { requireRoles, ROLES } = require('../middleware/rbac.middleware');
const ctrl = require('../controllers/tareas.controller');

const router = Router();

router.get('/',                ctrl.getAll);         // filtros por query params
router.get('/mias',            ctrl.getMias);        // tareas del usuario autenticado
router.get('/:id',             ctrl.getById);
router.post('/',               requireRoles(...ROLES.OPERATORS), ctrl.create);
router.put('/:id',             requireRoles(...ROLES.OPERATORS), ctrl.update);
router.patch('/:id/completar', requireRoles(...ROLES.ALL),       ctrl.completar);
router.delete('/:id',          requireRoles(...ROLES.ADMIN_ONLY), ctrl.remove);

module.exports = router;
