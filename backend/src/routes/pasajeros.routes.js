const { Router }              = require('express');
const { requireRoles, ROLES } = require('../middleware/rbac.middleware');
const ctrl = require('../controllers/pasajeros.controller');

const router = Router();

router.get('/alertas-vencimiento', ctrl.alertasVencimiento);   // todos
router.get('/reserva/:reservaId',  ctrl.getByReserva);         // todos
router.get('/:id',                 ctrl.getById);              // todos
router.post('/',                   requireRoles(...ROLES.OPERATORS), ctrl.create);
router.put('/:id',                 requireRoles(...ROLES.OPERATORS), ctrl.update);
router.delete('/:id',              requireRoles(...ROLES.ADMIN_ONLY), ctrl.remove);

module.exports = router;
