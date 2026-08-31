'use strict';

const ExcelJS = require('exceljs');
const { query } = require('../config/database');

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

const BANK_DEFAULT = {
  banco          : 'Interbank',
  cuenta_titular : 'Empresa Cusi Travel International',
  ruc            : '',
  cuenta_numero  : '',
  cuenta_cci     : '',
  moneda         : 'USD',
};

async function getReservaData(reservaId) {
  const { rows } = await query(`
    SELECT
      r.id, r.codigo_reserva, r.fecha_inicio, r.fecha_fin,
      r.n_pasajeros, r.total_usd, r.adelanto_usd, r.descuento_usd,
      r.agencia_nombre, r.nombre_servicio_snap, r.precio_usd_por_pax,
      r.observaciones,
      (r.total_usd - r.adelanto_usd - COALESCE(r.descuento_usd, 0)) AS saldo_usd,
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

const usd = n => Number(n || 0);

const WHITE = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
const GRAY  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
const NAVY  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };

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
  const row = await getReservaData(reservaId);
  if (!row) {
    const err = new Error(`Reserva ${reservaId} no encontrada`);
    err.status = 404; throw err;
  }

  const agency = { ...AGENCY_DEFAULT, ...overrides.agency };
  const bank   = { ...BANK_DEFAULT,   ...overrides.bank };
  const to     = overrides.to || {};

  const defaultDesc = row.nombre_servicio_snap || row.servicio_nombre || 'Servicio turístico';
  let lineItems = overrides.lineItems;
  if (!lineItems || lineItems.length === 0) {
    const extras = await getExtras(reservaId);
    lineItems = [
      { qty: row.n_pasajeros || 1, description: defaultDesc, unit_price: usd(row.precio_usd_por_pax) },
      ...extras.map(e => ({ qty: e.cantidad, description: e.nombre, unit_price: usd(e.precio_unitario_usd) })),
    ];
  }

  const invoiceDate = new Date(row.fecha_inicio || Date.now());
  const fechaStr    = invoiceDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const paymentDate = row.adelanto_usd > 0 ? fechaStr : null;

  const codigo    = row.codigo_reserva || `INV-${row.id}`;
  const totalUsd  = usd(row.total_usd);
  const adelanto  = usd(row.adelanto_usd);
  const descuento = usd(row.descuento_usd);
  const saldo     = usd(row.saldo_usd);

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

  preWhite(ws, 65, 7);

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
  sc(ws, 'G2', fechaStr,     { font: BF });

  /* ── ROW 3 — Slogan + Invoice # ── */
  ws.mergeCells('A3:C3');
  sc(ws, 'A3', agency.slogan, { font: { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF888888' } } });
  sc(ws, 'F3', 'Invoice #:', { font: BB, align: { horizontal: 'right' } });
  sc(ws, 'G3', codigo,       { font: BB });

  /* ── ROW 4 — Pax ── */
  const paxName = to.contacto || to.empresa || row.agencia_nombre || '';
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
  sc(ws, 'E6', to.empresa || row.agencia_nombre || '', { font: BB });

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
  for (const item of lineItems) {
    const qty = Number(item.qty || 1);
    const upx = Number(item.unit_price || 0);
    const ttl = qty * upx;
    ws.mergeCells(`B${cur}:E${cur}`);
    sc(ws, `A${cur}`, qty,               { font: BF, align: { horizontal: 'center' }, border: thinBorder() });
    sc(ws, `B${cur}`, item.description || '', { font: BF, border: thinBorder() });
    ['C','D','E'].forEach(c => { ws.getCell(`${c}${cur}`).border = thinBorder(); });
    sc(ws, `F${cur}`, upx, { font: BF, numFmt: CURR, align: { horizontal: 'right' }, border: thinBorder() });
    sc(ws, `G${cur}`, ttl, { font: BF, numFmt: CURR, align: { horizontal: 'right' }, border: thinBorder() });
    ws.getRow(cur).height = 18; cur++;
  }

  /* ── Discount ── */
  if (descuento > 0) {
    ws.mergeCells(`B${cur}:E${cur}`);
    sc(ws, `A${cur}`, '',         { border: thinBorder() });
    sc(ws, `B${cur}`, 'Discount', { font: BF, border: thinBorder() });
    ['C','D','E'].forEach(c => { ws.getCell(`${c}${cur}`).border = thinBorder(); });
    sc(ws, `F${cur}`, '',          { border: thinBorder() });
    sc(ws, `G${cur}`, -descuento,  { font: BF, numFmt: CURR, align: { horizontal: 'right' }, border: thinBorder() });
    ws.getRow(cur).height = 16; cur++;
  }

  ws.getRow(cur).height = 8; cur++;

  /* ── Payment Received ── */
  if (adelanto > 0 && paymentDate) {
    ws.mergeCells(`A${cur}:E${cur}`);
    sc(ws, `A${cur}`, `Payment Received ${paymentDate}`, { font: BF });
    sc(ws, `F${cur}`, adelanto, { font: BF, numFmt: CURR, align: { horizontal: 'right' } });
    sc(ws, `G${cur}`, adelanto, { font: BF, numFmt: CURR, align: { horizontal: 'right' } });
    ws.getRow(cur).height = 16; cur++;
  }

  /* ── Total ── */
  ws.mergeCells(`A${cur}:F${cur}`);
  sc(ws, `A${cur}`, 'Total',  { font: BB, align: { horizontal: 'right' } });
  sc(ws, `G${cur}`, totalUsd, { font: BB, numFmt: CURR, align: { horizontal: 'right' } });
  ws.getRow(cur).height = 18; cur++;

  /* ── Balance Due ── */
  const BAL = { ...BB, color: { argb: 'FF1F3864' } };
  ws.mergeCells(`A${cur}:F${cur}`);
  sc(ws, `A${cur}`, 'Balance Due', { font: BAL, align: { horizontal: 'right' } });
  sc(ws, `G${cur}`, saldo,         { font: BAL, numFmt: CURR, align: { horizontal: 'right' } });
  ws.getRow(cur).height = 18; cur++;

  ws.getRow(cur).height = 14; cur++;

  /* ── Payment Information header ── */
  ws.mergeCells(`A${cur}:G${cur}`);
  sc(ws, `A${cur}`, 'Payment Information', {
    font  : { ...BB, color: { argb: 'FFFFFFFF' } },
    fill  : NAVY,
    align : { horizontal: 'center', vertical: 'middle' },
  });
  ws.getRow(cur).height = 20; cur++;

  /* ── Bank rows ── */
  [
    ['Bank',           bank.banco],
    ['Account Holder', bank.cuenta_titular],
    ['RUC',            bank.ruc],
    ['Account No.',    bank.cuenta_numero],
    ['CCI',            bank.cuenta_cci],
    ['Currency',       bank.moneda],
  ].filter(([, v]) => v).forEach(([label, value]) => {
    ws.mergeCells(`C${cur}:G${cur}`);
    sc(ws, `A${cur}`, label, { font: BB });
    sc(ws, `B${cur}`, ':',   { font: BF });
    sc(ws, `C${cur}`, value, { font: BF });
    ws.getRow(cur).height = 16; cur++;
  });

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

  return { workbook: wb, codigo };
}

module.exports = { generarInvoiceExcel };
