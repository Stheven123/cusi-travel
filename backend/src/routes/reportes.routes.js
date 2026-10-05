const { Router }              = require('express');
const { requireRoles, ROLES } = require('../middleware/rbac.middleware');
const ctrl = require('../controllers/reportes.controller');

const router = Router();

// KPIs del dashboard
router.get('/kpis',                          ctrl.getKPIs);
// Reporte para proveedores con filtros avanzados + selección de campos
router.post('/proveedores',                  requireRoles(...ROLES.MANAGEMENT), ctrl.reporteProveedores);
// El mismo reporte, descargado como Excel editable
router.post('/proveedores/excel',            requireRoles(...ROLES.MANAGEMENT), ctrl.reporteProveedoresExcel);
// Resumen mensual de reservas
router.get('/resumen-mensual',               requireRoles(...ROLES.MANAGEMENT), ctrl.resumenMensual);
// Reservas próximas (widget dashboard)
router.get('/proximas',                      ctrl.proximas);
// Generar Invoice en Excel para una reserva
router.post('/invoice/:reservaId',           ctrl.generarInvoice);
// Vista previa del invoice (JSON con los mismos datos del Excel)
router.post('/invoice/:reservaId/preview',   ctrl.previewInvoice);
// Cierre de file mensual (POST para enviar datos de agencia en body)
router.post('/cierre',                       requireRoles(...ROLES.MANAGEMENT), ctrl.generarCierre);
// Cierre de file de una reserva puntual
router.post('/cierre/reserva/:reservaId',    requireRoles(...ROLES.MANAGEMENT), ctrl.generarCierreReserva);
// Vista previa del cierre de file de una reserva
router.get('/cierre/reserva/:reservaId/preview', requireRoles(...ROLES.MANAGEMENT), ctrl.previewCierreReserva);

module.exports = router;
