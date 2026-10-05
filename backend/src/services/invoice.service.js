'use strict';

const ExcelJS = require('exceljs');
const { query } = require('../config/database');
const { AppError } = require('../middleware/error.middleware');

const AGENCY_DEFAULT = {
  name           : 'Cusi Travel',
  slogan         : 'Proud to be Quechua',
  address        : 'Calle Union #140',
  city           : 'Cusco, Peru',
  phone1         : '+51 985808035', phone1_contact: 'Amy',
  phone2         : '+51 984872580', phone2_contact: 'Jose',
  phone3         : '',              phone3_note:    '',
  email          : 'info@cusitravel.com',
  logo_b64       : '',
};

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Las fechas se piden a la BD ya como texto 'YYYY-MM-DD' (to_char) — así no
// dependen de la zona horaria del servidor al formatearlas.
const parseISO = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? { y: +m[1], mo: +m[2], d: +m[3] } : null;
};

const fmtDateEN = (iso) => {
  const p = parseISO(iso);
  return p ? `${MONTHS_EN[p.mo - 1]} ${p.d}, ${p.y}` : '';
};

// "October 10 – 13, 2026" / "October 30 – November 2, 2026" / "Dec 30, 2026 – Jan 2, 2027"
const fmtRangeEN = (inicio, fin) => {
  const a = parseISO(inicio), b = parseISO(fin);
  if (!a) return '';
  if (!b || (a.y === b.y && a.mo === b.mo && a.d === b.d)) return fmtDateEN(inicio);
  if (a.y === b.y && a.mo === b.mo) return `${MONTHS_EN[a.mo - 1]} ${a.d} – ${b.d}, ${a.y}`;
  if (a.y === b.y) return `${MONTHS_EN[a.mo - 1]} ${a.d} – ${MONTHS_EN[b.mo - 1]} ${b.d}, ${a.y}`;
  return `${fmtDateEN(inicio)} – ${fmtDateEN(fin)}`;
};

async function getReservaData(reservaId) {
  const { rows } = await query(`
    SELECT
      r.id, r.codigo_reserva,
      to_char(r.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
      to_char(r.fecha_fin,    'YYYY-MM-DD') AS fecha_fin,
      r.n_pasajeros, r.total_usd, r.adelanto_usd, r.descuento_usd,
      r.agencia_nombre, r.nombre_servicio_snap, r.precio_usd_por_pax,
      st.nombre AS servicio_nombre
    FROM cusi.reservas r
    LEFT JOIN cusi.servicios_turisticos st ON st.id = r.servicio_id
    WHERE r.id = $1
  `, [reservaId]);
  return rows[0] || null;
}

// Servicios adicionales de la reserva (ej. renta de bastones) — se listan como
// líneas propias del invoice en vez de quedar solo sumados al total.
async function getExtras(reservaId) {
  const { rows } = await query(`
    SELECT nombre, cantidad, precio_unitario_usd
    FROM cusi.reserva_servicios_adicionales
    WHERE reserva_id = $1
    ORDER BY id
  `, [reservaId]);
  return rows;
}

async function getPagos(reservaId) {
  const { rows } = await query(`
    SELECT to_char(fecha, 'YYYY-MM-DD') AS fecha, monto, nota
    FROM cusi.reserva_pagos
    WHERE reserva_id = $1
    ORDER BY fecha, id
  `, [reservaId]);
  return rows;
}

const usd = n => Number(n || 0);
const round2 = n => Math.round(n * 100) / 100;

// ── Datos del invoice (los usa tanto el Excel como la vista previa) ──
async function buildInvoiceData(reservaId, overrides = {}) {
  const row = await getReservaData(reservaId);
  if (!row) {
    // Antes usaba err.status (no err.statusCode), que error.middleware.js no
    // lee — este 404 llegaba al cliente como un 500 genérico.
    throw new AppError(`Reserva ${reservaId} no encontrada`, 404, 'NOT_FOUND');
  }

  const agency = { ...AGENCY_DEFAULT, ...overrides.agency };
  const to     = overrides.to || {};

  const rango       = fmtRangeEN(row.fecha_inicio, row.fecha_fin);
  const paqueteDesc = row.nombre_servicio_snap || row.servicio_nombre || 'Servicio turístico';

  let lineItems = overrides.lineItems;
  if (!lineItems || lineItems.length === 0) {
    const extras = await getExtras(reservaId);
    lineItems = [
      // La fila del paquete lleva el rango de fechas de la reserva.
      { qty: row.n_pasajeros || 1, description: rango ? `${paqueteDesc} (${rango})` : paqueteDesc, unit_price: usd(row.precio_usd_por_pax) },
      ...extras.map(e => ({ qty: e.cantidad, description: e.nombre, unit_price: usd(e.precio_unitario_usd) })),
    ];
  }
  const items = lineItems.map(it => {
    const qty = Number(it.qty || 1);
    const unit_price = Number(it.unit_price || 0);
    return { qty, description: it.description || '', unit_price, total: round2(qty * unit_price) };
  });

  // Pagos con fecha (reserva_pagos). Reservas antiguas sin pagos registrados
  // pero con adelanto: una sola línea sin fecha, como antes.
  const pagosDB = await getPagos(reservaId);
  const pagos = pagosDB.length
    ? pagosDB.map(p => ({ fecha: p.fecha, fecha_texto: fmtDateEN(p.fecha), monto: usd(p.monto), nota: p.nota || '' }))
    : (usd(row.adelanto_usd) > 0 ? [{ fecha: null, fecha_texto: '', monto: usd(row.adelanto_usd), nota: '' }] : []);

  const subtotal    = round2(items.reduce((s, it) => s + it.total, 0));
  const descuento   = usd(row.descuento_usd);
  const total       = round2(subtotal - descuento);
  const totalPagado = round2(pagos.reduce((s, p) => s + p.monto, 0));
  const balance     = round2(total - totalPagado);

  const fechaISO = overrides.invoice_date || row.fecha_inicio;

  return {
    agency,
    to: {
      empresa:   to.empresa   || row.agencia_nombre || '',
      ruc:       to.ruc       || '',
      direccion: to.direccion || '',
      contacto:  to.contacto  || '',
    },
    codigo:         row.codigo_reserva || `INV-${row.id}`,
    invoice_number: overrides.invoice_number || row.codigo_reserva || `INV-${row.id}`,
    fecha:          fechaISO,
    fecha_texto:    fmtDateEN(fechaISO),
    rango,
    items, subtotal, descuento, total, pagos, totalPagado, balance,
  };
}

const WHITE = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
const GRAY  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };

function thinBorder() {
  const s = { style: 'thin', color: { argb: 'FFCCCCCC' } };
  return { top: s, left: s, bottom: s, right: s };
}

function sc(ws, ref, value, opts = {}) {
  const cell = ws.getCell(ref);
  if (value !== undefined) cell.value = value;
  if (opts.font)   cell.font      = opts.font;
  if (opts.fill)   cell.fill      = opts.fill;
  if (opts.align)  cell.alignment = opts.align;
  if (opts.numFmt) cell.numFmt    = opts.numFmt;
  if (opts.border) cell.border    = opts.border;
  return cell;
}

function preWhite(ws, rows, cols) {
  for (let r = 1; r <= rows; r++)
    for (let c = 1; c <= cols; c++)
      ws.getRow(r).getCell(c).fill = WHITE;
}

async function generarInvoiceExcel(reservaId, overrides = {}) {
  const data = await buildInvoiceData(reservaId, overrides);
  const { agency, to } = data;

  const wb = new ExcelJS.Workbook();
  wb.creator = agency.name; wb.created = wb.modified = new Date();

  const ws = wb.addWorksheet('Invoice', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
  });

  ws.views = [{ showGridLines: false }];

  ws.columns = [
    { key: 'A', width: 12 },
    { key: 'B', width: 30 },
    { key: 'C', width: 10 },
    { key: 'D', width: 12 },
    { key: 'E', width: 20 },
    { key: 'F', width: 14 },
    { key: 'G', width: 16 },
  ];

  preWhite(ws, 30 + data.items.length + data.pagos.length, 7);

  const BF   = { name: 'Calibri', size: 11 };
  const BB   = { name: 'Calibri', size: 11, bold: true };
  const SM   = { name: 'Calibri', size: 9, color: { argb: 'FF888888' } };
  const CURR = '"$"#,##0.00';

  /* ── Logo ── */
  if (agency.logo_b64) {
    try {
      let b64 = agency.logo_b64, ext = 'png';
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

  /* ── ROW 1 — Title ── */
  ws.mergeCells('D1:G1');
  sc(ws, 'D1', 'Invoice', {
    font  : { name: 'Calibri', size: 28, bold: true, color: { argb: 'FF1F3864' } },
    align : { horizontal: 'right', vertical: 'middle' },
  });
  ws.getRow(1).height = 44;

  /* ── ROW 2 — Agency name + Date ── */
  ws.mergeCells('A2:C2');
  sc(ws, 'A2', agency.name,  { font: { name: 'Calibri', size: 14, bold: true } });
  sc(ws, 'F2', 'Date:',      { font: BB, align: { horizontal: 'right' } });
  sc(ws, 'G2', data.fecha_texto, { font: BF });

  /* ── ROW 3 — Slogan + Invoice # ── */
  ws.mergeCells('A3:C3');
  sc(ws, 'A3', agency.slogan, { font: { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF888888' } } });
  sc(ws, 'F3', 'Invoice #:', { font: BB, align: { horizontal: 'right' } });
  sc(ws, 'G3', data.invoice_number, { font: BB });

  /* ── ROW 4 — Pax ── */
  const paxName = to.contacto || to.empresa || '';
  if (paxName) {
    sc(ws, 'F4', 'Pax:',  { font: BB, align: { horizontal: 'right' } });
    sc(ws, 'G4', paxName, { font: BF });
  }
  ws.getRow(4).height = 16;

  /* ── ROW 5 separator ── */
  ws.getRow(5).height = 10;

  /* ── ROW 6 — FROM / TO headers ── */
  sc(ws, 'A6', 'FROM:', { font: BB });
  ws.mergeCells('B6:C6');
  sc(ws, 'B6', agency.name, { font: BB });
  sc(ws, 'D6', 'TO:', { font: BB });
  ws.mergeCells('E6:G6');
  sc(ws, 'E6', to.empresa || '', { font: BB });

  /* ── ROWS 7-12 — FROM / TO details ── */
  ws.mergeCells('B7:C7');
  sc(ws, 'B7', agency.address, { font: BF });
  ws.mergeCells('E7:G7');
  if (to.ruc) sc(ws, 'E7', `RUC: ${to.ruc}`, { font: BF });

  ws.mergeCells('B8:C8');
  sc(ws, 'B8', agency.city, { font: BF });
  ws.mergeCells('E8:G8');
  if (to.direccion) sc(ws, 'E8', to.direccion, { font: BF });

  ws.mergeCells('B9:C9');
  sc(ws, 'B9', agency.phone1 + (agency.phone1_contact ? ` (${agency.phone1_contact})` : ''), { font: BF });

  ws.mergeCells('B10:C10');
  sc(ws, 'B10', agency.phone2 + (agency.phone2_contact ? ` (${agency.phone2_contact})` : ''), { font: BF });

  if (agency.phone3) {
    ws.mergeCells('B11:C11');
    sc(ws, 'B11', agency.phone3 + (agency.phone3_note ? ` — ${agency.phone3_note}` : ''), { font: BF });
  }

  ws.mergeCells('B12:C12');
  sc(ws, 'B12', agency.email, { font: { ...BF, color: { argb: 'FF1155CC' } } });

  /* ── ROW 13 separator ── */
  ws.getRow(13).height = 12;

  /* ── ROW 14 — Table header ── */
  const TH = 14;
  ws.mergeCells(`B${TH}:E${TH}`);
  [['A','Qty','center'],['B','Description','left'],['F','Unit Price','right'],['G','Total','right']]
    .forEach(([col, label, h]) =>
      sc(ws, `${col}${TH}`, label, { font: BB, fill: GRAY, align: { horizontal: h, vertical: 'middle' }, border: thinBorder() }));
  ['C','D','E'].forEach(col => {
    const c = ws.getCell(`${col}${TH}`); c.fill = GRAY; c.border = thinBorder();
  });
  ws.getRow(TH).height = 20;

  /* ── Line items ── */
  let cur = TH + 1;
  for (const item of data.items) {
    ws.mergeCells(`B${cur}:E${cur}`);
    sc(ws, `A${cur}`, item.qty,         { font: BF, align: { horizontal: 'center', vertical: 'middle' }, border: thinBorder() });
    sc(ws, `B${cur}`, item.description, { font: BF, align: { vertical: 'middle', wrapText: true }, border: thinBorder() });
    ['C','D','E'].forEach(c => { ws.getCell(`${c}${cur}`).border = thinBorder(); });
    sc(ws, `F${cur}`, item.unit_price, { font: BF, numFmt: CURR, align: { horizontal: 'right', vertical: 'middle' }, border: thinBorder() });
    sc(ws, `G${cur}`, item.total,      { font: BF, numFmt: CURR, align: { horizontal: 'right', vertical: 'middle' }, border: thinBorder() });
    ws.getRow(cur).height = item.description.length > 60 ? 32 : 18; cur++;
  }

  /* ── Discount ── */
  if (data.descuento > 0) {
    ws.mergeCells(`B${cur}:E${cur}`);
    sc(ws, `A${cur}`, '',         { border: thinBorder() });
    sc(ws, `B${cur}`, 'Discount', { font: BF, border: thinBorder() });
    ['C','D','E'].forEach(c => { ws.getCell(`${c}${cur}`).border = thinBorder(); });
    sc(ws, `F${cur}`, '',               { border: thinBorder() });
    sc(ws, `G${cur}`, -data.descuento,  { font: BF, numFmt: CURR, align: { horizontal: 'right' }, border: thinBorder() });
    ws.getRow(cur).height = 16; cur++;
  }

  ws.getRow(cur).height = 8; cur++;

  /* ── Total ── */
  ws.mergeCells(`A${cur}:F${cur}`);
  sc(ws, `A${cur}`, 'Total',    { font: BB, align: { horizontal: 'right' } });
  sc(ws, `G${cur}`, data.total, { font: BB, numFmt: CURR, align: { horizontal: 'right' } });
  ws.getRow(cur).height = 18; cur++;

  /* ── Payments received (uno por fecha de pago) ── */
  for (const p of data.pagos) {
    ws.mergeCells(`A${cur}:F${cur}`);
    const label = p.fecha_texto ? `Payment received ${p.fecha_texto}` : 'Payment received';
    sc(ws, `A${cur}`, label,     { font: BF, align: { horizontal: 'right' } });
    sc(ws, `G${cur}`, -p.monto,  { font: BF, numFmt: CURR, align: { horizontal: 'right' } });
    ws.getRow(cur).height = 16; cur++;
  }

  /* ── Balance Due ── */
  const BAL = { ...BB, color: { argb: 'FF1F3864' } };
  ws.mergeCells(`A${cur}:F${cur}`);
  sc(ws, `A${cur}`, 'Balance Due', { font: BAL, align: { horizontal: 'right' } });
  sc(ws, `G${cur}`, data.balance,  { font: BAL, numFmt: CURR, align: { horizontal: 'right' } });
  ws.getRow(cur).height = 18; cur++;

  ws.getRow(cur).height = 14; cur++;

  /* ── Thank you ── */
  ws.mergeCells(`A${cur}:G${cur}`);
  sc(ws, `A${cur}`, `Thank you for choosing ${agency.name}!`, {
    font  : { name: 'Calibri', size: 13, bold: true, italic: true, color: { argb: 'FF1F3864' } },
    align : { horizontal: 'center' },
  });
  ws.getRow(cur).height = 24; cur++;

  /* ── Footer ── */
  ws.mergeCells(`A${cur}:G${cur}`);
  sc(ws, `A${cur}`, [agency.address, agency.city, agency.phone1, agency.email].filter(Boolean).join(' • '), {
    font  : SM,
    align : { horizontal: 'center' },
  });
  ws.getRow(cur).height = 14;

  return { workbook: wb, codigo: data.codigo };
}

// Vista previa: los mismos datos que van al Excel, sin el logo en base64.
async function previewInvoice(reservaId, overrides = {}) {
  const data = await buildInvoiceData(reservaId, overrides);
  const { logo_b64, ...agency } = data.agency;
  return { ...data, agency };
}

module.exports = { generarInvoiceExcel, previewInvoice };
