const { Router }              = require('express');
const { requireRoles, ROLES } = require('../middleware/rbac.middleware');
const ctrl = require('../controllers/presupuesto.controller');

const router = Router();

router.get('/by-reserva/:reservaId', ctrl.getByReserva);
router.post('/',      requireRoles(...ROLES.OPERATORS), ctrl.create);
router.put('/:id',    requireRoles(...ROLES.OPERATORS), ctrl.update);
router.delete('/:id', requireRoles(...ROLES.OPERATORS), ctrl.remove);

module.exports = router;
