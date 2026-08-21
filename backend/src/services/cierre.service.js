'use strict';

const ExcelJS = require('exceljs');
const { query } = require('../config/database');

const MESES_ES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const OPERACIONES_SELECT = `
    SELECT
      d.id,
      d.fecha_inicio            AS fecha_servicio,
      d.tipo_servicio,
      d.descripcion             AS detalle_gasto,
      d.cantidad,
      d.costo_unitario_usd      AS monto_unitario,
      d.costo_total_usd         AS monto,
      d.creado_en               AS fecha_emision,
      d.estado,
      d.confirmacion_ref,
      p.nombre                  AS proveedor_nombre,
      p.ruc                     AS ruc,
      r.codigo_reserva,
      r.agencia_nombre,
      COALESCE(r.nombre_servicio_snap, st.nombre) AS servicio_nombre,
      COALESCE(uo.nombre || ' ' || uo.apellido, '') AS operador
    FROM cusi.detalles_operacion_proveedor d
    LEFT JOIN cusi.proveedores           p  ON p.id  = d.proveedor_id
    LEFT JOIN cusi.reservas              r  ON r.id  = d.reserva_id
    LEFT JOIN cusi.servicios_turisticos  st ON st.id = r.servicio_id
    LEFT JOIN cusi.usuarios              uo ON uo.id = r.usuario_operador_id
`;

async function getOperaciones(anio, mes) {
  const { rows } = await query(`
    ${OPERACIONES_SELECT}
    WHERE EXTRACT(YEAR  FROM d.fecha_inicio) = $1
      AND EXTRACT(MONTH FROM d.fecha_inicio) = $2
    ORDER BY d.fecha_inicio, r.codigo_reserva, d.tipo_servicio
  `, [anio, mes]);
  return rows;
}

async function getOperacionesPorReserva(reservaId) {
  const { rows } = await query(`
    ${OPERACIONES_SELECT}
    WHERE d.reserva_id = $1
    ORDER BY d.fecha_inicio, d.tipo_servicio
  `, [reservaId]);
  return rows;
}

const WHITE = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
const NAVY  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C2350' } };
const GRAY  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
const ALTGR = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } };
const GREEN = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };

function thin(color = 'FFCCCCCC') {
  const s = { style: 'thin', color: { argb: color } };
  return { top: s, left: s, bottom: s, right: s };
}

function fmtDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function preWhite(ws, maxRow, maxCol) {
  for (let r = 1; r <= maxRow; r++)
    for (let c = 1; c <= maxCol; c++)
      ws.getRow(r).getCell(c).fill = WHITE;
}

async function construirCierreExcel(ops, { periodoLabel, agencia = {} }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = agencia.name || 'Cusi Travel';
  wb.created = wb.modified = new Date();

  const ws = wb.addWorksheet('Cierre de File', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  ws.views = [{ showGridLines: false }];

  /* ── Anchos de columna ── */
  ws.columns = [
    { key: 'num',         width: 5  },   // A  N°
    { key: 'codigo',      width: 15 },   // B  Código Reserva
    { key: 'fecha_serv',  width: 14 },   // C  Fecha Servicio
    { key: 'tipo',        width: 13 },   // D  Tipo
    { key: 'detalle',     width: 35 },   // E  Detalle Gasto
    { key: 'proveedor',   width: 25 },   // F  Proveedor
    { key: 'ruc',         width: 14 },   // G  RUC
    { key: 'cant',        width: 7  },   // H  Cant.
    { key: 'monto_unit',  width: 13 },   // I  Monto Unit.
    { key: 'monto',       width: 14 },   // J  Monto Total
    { key: 'fecha_emis',  width: 14 },   // K  Fecha Emisión
    { key: 'fecha_pago',  width: 14 },   // L  Fecha Pago
    { key: 'operador',    width: 22 },   // M  Operador
    { key: 'estado',      width: 15 },   // N  Estado
  ];

  const TOTAL_COLS = 14;
  const maxRows    = 10 + ops.length + 10;
  preWhite(ws, maxRows, TOTAL_COLS);

  const BF   = { name: 'Calibri', size: 11 };
  const BB   = { name: 'Calibri', size: 11, bold: true };
  const SM   = { name: 'Calibri', size: 9, color: { argb: 'FF888888' } };
  const CURR = '"$"#,##0.00';

  /* ── FILA 1 — Logo + Título ── */
  if (agencia.logo_b64) {
    try {
      let b64 = agencia.logo_b64, ext = 'png';
      if (b64.startsWith('data:')) {
        const m = b64.match(/data:image\/([\w]+);base64,(.+)/s);
        if (m) {
          const mime = m[1].toLowerCase();
          ext = mime === 'jpeg' || mime === 'jpg' ? 'jpeg' : mime === 'gif' ? 'gif' : 'png';
          b64 = m[2].trim();
        }
      }
      const imgId = wb.addImage({ base64: b64, extension: ext });
      ws.addImage(imgId, { tl: { col: 0, row: 0 }, br: { col: 2, row: 4 } });
    } catch (_) {}
  }

  ws.mergeCells('C1:N1');
  const titleCell = ws.getCell('C1');
  titleCell.value     = 'CIERRE DE FILE';
  titleCell.font      = { name: 'Calibri', size: 20, bold: true, color: { argb: 'FF0C2350' } };
  titleCell.alignment = { horizontal: 'right', vertical: 'middle' };
  ws.getRow(1).height = 44;

  /* ── FILA 2 — Nombre agencia + período ── */
  ws.mergeCells('A2:D2');
  ws.getCell('A2').value     = agencia.name || 'Cusi Travel';
  ws.getCell('A2').font      = { name: 'Calibri', size: 13, bold: true };

  ws.mergeCells('E2:N2');
  ws.getCell('E2').value     = periodoLabel;
  ws.getCell('E2').font      = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0C2350' } };
  ws.getCell('E2').alignment = { horizontal: 'right' };
  ws.getRow(2).height = 20;

  /* ── FILA 3 — Subtítulo + fecha generación ── */
  ws.mergeCells('A3:D3');
  ws.getCell('A3').value     = agencia.slogan || 'Proud to be Quechua';
  ws.getCell('A3').font      = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF888888' } };

  ws.mergeCells('E3:N3');
  ws.getCell('E3').value     = `Generado: ${new Date().toLocaleDateString('es-PE', { day:'2-digit', month:'long', year:'numeric' })}`;
  ws.getCell('E3').font      = SM;
  ws.getCell('E3').alignment = { horizontal: 'right' };
  ws.getRow(3).height = 16;

  /* ── FILA 4 — separador ── */
  ws.mergeCells('A4:N4');
  ws.getCell('A4').fill   = NAVY;
  ws.getRow(4).height     = 4;

  /* ── FILA 5 — separador vacío ── */
  ws.getRow(5).height = 6;

  /* ── FILA 6 — Resumen rápido ── */
  const totalMonto = ops.reduce((s, r) => s + Number(r.monto || 0), 0);
  const totalOps   = ops.length;
  const reservasU  = [...new Set(ops.map(r => r.codigo_reserva).filter(Boolean))].length;

  const resumen = [
    ['Total operaciones', totalOps],
    ['Reservas involucradas', reservasU],
    ['Gasto total', `$${totalMonto.toFixed(2)}`],
  ];

  resumen.forEach(([label, val], i) => {
    const col = String.fromCharCode(65 + i * 2);     // A, C, E
    const col2 = String.fromCharCode(65 + i * 2 + 1); // B, D, F
    ws.mergeCells(`${col}6:${col2}6`);
    ws.getCell(`${col}6`).value     = label;
    ws.getCell(`${col}6`).font      = SM;
    ws.getCell(`${col}6`).alignment = { horizontal: 'center' };
  });
  resumen.forEach(([, val], i) => {
    const col = String.fromCharCode(65 + i * 2);
    const col2 = String.fromCharCode(65 + i * 2 + 1);
    ws.mergeCells(`${col}7:${col2}7`);
    ws.getCell(`${col}7`).value     = val;
    ws.getCell(`${col}7`).font      = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF0C2350' } };
    ws.getCell(`${col}7`).alignment = { horizontal: 'center' };
  });
  ws.getRow(6).height = 14;
  ws.getRow(7).height = 22;

  /* ── FILA 8 — separador ── */
  ws.getRow(8).height = 8;

  /* ── FILA 9 — Cabecera tabla ── */
  const HDR = 9;
  const headers = [
    'N°', 'Código Reserva', 'Fecha Servicio', 'Tipo',
    'Detalle Gasto', 'Proveedor / Operador', 'RUC',
    'Cant.', 'Monto Unit.', 'Monto Total',
    'Fecha Emisión', 'Fecha Pago', 'Operador', 'Estado',
  ];
  headers.forEach((label, i) => {
    const col  = String.fromCharCode(65 + i);
    const cell = ws.getCell(`${col}${HDR}`);
    cell.value     = label;
    cell.font      = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill      = NAVY;
    cell.border    = thin('FF0C2350');
    cell.alignment = { horizontal: i <= 1 || i >= 11 ? 'center' : (i >= 7 ? 'right' : 'left'), vertical: 'middle', wrapText: false };
  });
  ws.getRow(HDR).height = 22;

  /* ── FILAS 10+ — Datos ── */
  let cur = HDR + 1;
  for (let idx = 0; idx < ops.length; idx++) {
    const op    = ops[idx];
    const even  = idx % 2 === 0;
    const fill  = even ? WHITE : ALTGR;
    const bord  = thin();

    const vals = [
      idx + 1,
      op.codigo_reserva || '',
      fmtDate(op.fecha_servicio),
      op.tipo_servicio   || '',
      op.detalle_gasto   || '',
      op.proveedor_nombre || '',
      op.ruc             || '',
      Number(op.cantidad || 1),
      Number(op.monto_unitario || 0),
      Number(op.monto || 0),
      fmtDate(op.fecha_emision),
      '',                          // Fecha Pago — el usuario completa
      op.operador        || '',
      op.estado          || '',
    ];

    vals.forEach((val, i) => {
      const col  = String.fromCharCode(65 + i);
      const cell = ws.getCell(`${col}${cur}`);
      cell.value  = val;
      cell.fill   = fill;
      cell.border = bord;
      cell.font   = { name: 'Calibri', size: 10 };

      if (i === 7)  { cell.alignment = { horizontal: 'center' }; }
      if (i === 8)  { cell.numFmt = CURR; cell.alignment = { horizontal: 'right' }; }
      if (i === 9)  { cell.numFmt = CURR; cell.alignment = { horizontal: 'right' }; }
      if (i === 10) { cell.alignment = { horizontal: 'center' }; }
      if (i === 11) {
        // Fecha Pago: celda editable destacada en amarillo claro
        cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFDE7' } };
        cell.border = { ...bord, bottom: { style: 'thin', color: { argb: 'FFBBBB00' } } };
      }
      if (i === 0 || i === 1 || i === 13) { cell.alignment = { horizontal: 'center' }; }
    });
    ws.getRow(cur).height = 16;
    cur++;
  }

  /* ── Fila TOTAL ── */
  ws.getRow(cur).height = 6; cur++;

  const totalRow = cur;
  ws.mergeCells(`A${totalRow}:H${totalRow}`);
  ws.getCell(`A${totalRow}`).value     = 'TOTAL GASTOS DEL MES';
  ws.getCell(`A${totalRow}`).font      = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getCell(`A${totalRow}`).fill      = NAVY;
  ws.getCell(`A${totalRow}`).alignment = { horizontal: 'right' };

  ws.getCell(`I${totalRow}`).fill      = NAVY;
  ws.getCell(`J${totalRow}`).value     = totalMonto;
  ws.getCell(`J${totalRow}`).font      = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getCell(`J${totalRow}`).fill      = NAVY;
  ws.getCell(`J${totalRow}`).numFmt    = CURR;
  ws.getCell(`J${totalRow}`).alignment = { horizontal: 'right' };
  ['K','L','M','N'].forEach(c => { ws.getCell(`${c}${totalRow}`).fill = NAVY; });
  ws.getRow(totalRow).height = 24;
  cur++;

  /* ── Nota al pie ── */
  ws.getRow(cur).height = 10; cur++;
  ws.mergeCells(`A${cur}:N${cur}`);
  ws.getCell(`A${cur}`).value     = 'Columna "Fecha Pago" (amarilla) pendiente de completar manualmente.  •  Generado con Cusi Travel ERP';
  ws.getCell(`A${cur}`).font      = { name: 'Calibri', size: 8, italic: true, color: { argb: 'FFAAAAAA' } };
  ws.getCell(`A${cur}`).alignment = { horizontal: 'center' };
  ws.getRow(cur).height = 14;

  return wb;
}

async function generarCierreExcel(anio, mes, agencia = {}) {
  const ops = await getOperaciones(anio, mes);
  const nombreMes = MESES_ES[mes];
  const workbook  = await construirCierreExcel(ops, { periodoLabel: `Período: ${nombreMes} ${anio}`, agencia });
  return { workbook, filename: `Cierre-${nombreMes}-${anio}.xlsx` };
}

// Cierre de file de UNA reserva puntual (todas sus operaciones, sin
// importar el mes en que se prestaron los servicios).
async function generarCierreExcelPorReserva(reservaId, agencia = {}) {
  const ops = await getOperacionesPorReserva(reservaId);
  const codigo = ops[0]?.codigo_reserva || `Reserva-${reservaId}`;
  const workbook = await construirCierreExcel(ops, { periodoLabel: `Reserva: ${codigo}`, agencia });
  return { workbook, filename: `Cierre-${codigo}.xlsx` };
}

module.exports = { generarCierreExcel, generarCierreExcelPorReserva };
