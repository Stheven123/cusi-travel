const { Router }              = require('express');
const { requireRoles, ROLES } = require('../middleware/rbac.middleware');
const ctrl = require('../controllers/agencias.controller');

const router = Router();

router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/',   requireRoles(...ROLES.OPERATORS), ctrl.create);
router.put('/:id', requireRoles(...ROLES.OPERATORS), ctrl.update);
router.delete('/:id', requireRoles(...ROLES.ADMIN_ONLY), ctrl.remove);

module.exports = router;
