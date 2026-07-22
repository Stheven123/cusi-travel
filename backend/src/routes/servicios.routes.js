const { Router }              = require('express');
const { requireRoles, ROLES } = require('../middleware/rbac.middleware');
const ctrl = require('../controllers/servicios.controller');

const router = Router();

router.get('/',                   ctrl.getAll);
router.get('/:id',                ctrl.getById);
router.post('/',                  requireRoles(...ROLES.MANAGEMENT), ctrl.create);
router.put('/:id',                requireRoles(...ROLES.MANAGEMENT), ctrl.update);
router.post('/:id/clonar',        requireRoles(...ROLES.MANAGEMENT), ctrl.clonar);
router.delete('/:id',             requireRoles(...ROLES.ADMIN_ONLY), ctrl.remove);

// Sub-recurso: itinerarios
router.post('/:id/itinerarios',          requireRoles(...ROLES.MANAGEMENT), ctrl.addItinerario);
router.put('/:id/itinerarios/:diaId',    requireRoles(...ROLES.MANAGEMENT), ctrl.updateItinerario);
router.delete('/:id/itinerarios/:diaId', requireRoles(...ROLES.ADMIN_ONLY), ctrl.deleteItinerario);

module.exports = router;
