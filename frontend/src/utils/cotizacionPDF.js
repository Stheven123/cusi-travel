import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAgenciaData } from '../pages/AgenciaPage';

// ─── Medidas A4 ───────────────────────────────────────────────
const PW = 210; const PH = 297;
const ML = 12;  const MR = 12;
const CW = PW - ML - MR;

// ─── Paleta Cusi Travel ───────────────────────────────────────
const BRAND  = [0, 140, 108];   // verde corporativo Cusi Travel
const DARK   = [30, 42, 58];    // encabezados oscuros
const GRAY   = [245, 245, 245]; // fondos suaves
const BORD   = [210, 210, 210]; // bordes finos
const TXTDK  = [28, 28, 30];    // texto principal
const TXTGR  = [100, 100, 108]; // texto secundario
const WHITE  = [255, 255, 255];
const RED    = [180, 30, 30];
const REDLGT = [254, 235, 235];

const fmtUSD = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(+n || 0);

const TX = {
  es: {
    title: 'COTIZACION',
    date_label: 'Fecha:', city_label: 'Ciudad:',
    advisor_section: 'Datos del Operador',
    client_section: 'Datos del Cliente',
    trip_section: 'Resumen de Viaje',
    option: 'OPCION',
    dest_label: 'Destino:', start_label: 'Inicio del viaje:',
    end_label: 'Fin del viaje:', lang_label: 'Idioma:',
    pax_label: 'Pasajeros:',
    product_col: 'Producto', desc_col: 'Descripcion', total_col: 'Total',
    discount_label: 'Descuento comercial',
    total_label: 'Total',
    nights_label: 'Numero de noches:', persons_label: 'Numero de Personas:',
    disclaimer: 'Los precios indicados son de referencia y estan sujetos a disponibilidad. El precio final se confirma al momento de efectuar el pago y la reserva.',
    cargo_label: 'Cargo:', email_label: '', phone_label: '',
    ruc_label: 'RUC:', city2_label: 'Ciudad:',
    page: 'Pag.', of: 'de',
  },
  en: {
    title: 'QUOTATION',
    date_label: 'Date:', city_label: 'City:',
    advisor_section: 'Operator Information',
    client_section: 'Client Information',
    trip_section: 'Trip Summary',
    option: 'OPTION',
    dest_label: 'Destination:', start_label: 'Start date:',
    end_label: 'End date:', lang_label: 'Language:',
    pax_label: 'Passengers:',
    product_col: 'Product', desc_col: 'Description', total_col: 'Total',
    discount_label: 'Commercial discount',
    total_label: 'Total',
    nights_label: 'Number of nights:', persons_label: 'Number of Persons:',
    disclaimer: 'Prices listed are for reference and subject to availability and rate changes without prior notice. Final prices are confirmed upon payment.',
    cargo_label: 'Position:', email_label: '', phone_label: '',
    ruc_label: 'ID:', city2_label: 'City:',
    page: 'Page', of: 'of',
  },
};

const TIPO_LABEL = {
  es: { TREK:'Trekking', DAY_TOUR:'Tour de 1 dia', CITY_TOUR:'City Tour', TRANSFER:'Transfer', MULTI_DAY:'Multi-dia', VUELO:'Vuelo', PAQUETE_COMPLETO:'Paquete completo' },
  en: { TREK:'Trekking', DAY_TOUR:'Day Tour',     CITY_TOUR:'City Tour', TRANSFER:'Transfer', MULTI_DAY:'Multi-Day', VUELO:'Flight',  PAQUETE_COMPLETO:'Full Package' },
};

const fmtFecha = (iso, lang = 'es') => {
  if (!iso) return null;
  const locale = lang === 'en' ? 'en-US' : 'es-PE';
  return new Date(iso + 'T12:00:00').toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtFechaFin = (isoInicio, dias) => {
  if (!isoInicio || !dias) return null;
  const d = new Date(isoInicio + 'T12:00:00');
  d.setDate(d.getDate() + Number(dias) - 1);
  return d.toISOString().slice(0, 10);
};

const genCotNum = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `COT-${ymd}-${String(Math.floor(Math.random()*900)+100)}`;
};

const urlToBase64 = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

const mkDoc = () => new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

// ─── Helpers ─────────────────────────────────────────────────
const h = (doc) => ({
  font: (s = 'normal', sz = 10) => { doc.setFont('helvetica', s); doc.setFontSize(sz); },
  col:  (...rgb) => doc.setTextColor(...rgb),
  fill: (...rgb) => doc.setFillColor(...rgb),
  draw: (...rgb) => doc.setDrawColor(...rgb),
  lw:   (w) => doc.setLineWidth(w),
  rect: (x, y, w, v, s) => doc.rect(x, y, w, v, s),
  text: (t, x, y, o = {}) => doc.text(String(t), x, y, o),
});

// Línea fina horizontal
const hline = (doc, x1, y, x2, color = BORD, width = 0.25) => {
  doc.setDrawColor(...color);
  doc.setLineWidth(width);
  doc.line(x1, y, x2, y);
};

// Celda con fondo + texto
const cell = (doc, x, y, w, ht, bg, txt, txtColor, fontStyle, fontSize) => {
  const { font, col, fill, rect, text } = h(doc);
  fill(...bg);
  rect(x, y, w, ht, 'F');
  if (txt !== undefined) {
    font(fontStyle || 'normal', fontSize || 8.5);
    col(...txtColor);
    text(txt, x + 3, y + ht / 2 + 2.8, {});
  }
};

// ─── 1. HEADER ───────────────────────────────────────────────
const drawHeader = async (doc, agencia, cotNum, tx) => {
  const { font, col, fill, draw, lw, rect, text } = h(doc);

  // Borde exterior del header
  lw(0.4); draw(...BORD);
  rect(ML, 8, CW, 42, 'S');

  // ── Logo (izquierda) ──
  const LOGO_X = ML + 3;
  const LOGO_Y = 10;
  const LOGO_W = 48;
  const LOGO_H = 34;
  const logoB64 = agencia.logo_b64 || await urlToBase64('/logo-cusi.png');
  if (logoB64) {
    try { doc.addImage(logoB64, 'PNG', LOGO_X, LOGO_Y, LOGO_W, LOGO_H, '', 'FAST'); } catch (_) {}
  } else {
    font('bold', 14); col(...BRAND);
    text(agencia.nombre || 'Cusi Travel', LOGO_X + 2, LOGO_Y + 20);
  }

  // ── Divisor vertical ──
  lw(0.4); draw(...BORD);
  doc.line(ML + 58, 8, ML + 58, 50);

  // ── Título COTIZACIÓN (centro-derecha) ──
  const TX_X = ML + 62;
  font('bold', 26); col(...BRAND);
  text(tx.title, TX_X, 30);

  // Línea bajo título
  const titleW = doc.getTextWidth(tx.title);
  lw(0.6); draw(...BRAND);
  doc.line(TX_X, 32, TX_X + titleW, 32);

  // ── Número + código (derecha) ──
  const RX = PW - MR;
  // Caja de referencia
  fill(...GRAY);
  rect(PW - MR - 58, 9, 58, 18, 'F');
  lw(0.3); draw(...BORD);
  rect(PW - MR - 58, 9, 58, 18, 'S');

  font('bold', 7); col(...TXTGR);
  text('No.', PW - MR - 55, 15);
  font('bold', 11); col(...TXTDK);
  text(cotNum, PW - MR - 50, 15);

  // Eslogan bajo número
  if (agencia.slogan) {
    font('italic', 7); col(...TXTGR);
    text(agencia.slogan, TX_X, 40);
  }

  return 52; // y después del header
};

// ─── 2. BARRA FECHA / CIUDAD ─────────────────────────────────
const drawFechaBar = (doc, agencia, tx, lang) => {
  const { font, col, fill, draw, lw, rect, text } = h(doc);
  const Y = 53;
  fill(...GRAY);
  rect(ML, Y, CW, 8, 'F');
  lw(0.3); draw(...BORD);
  rect(ML, Y, CW, 8, 'S');

  const locale = lang === 'en' ? 'en-US' : 'es-PE';
  const hoy = new Date().toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });

  font('normal', 7.5); col(...TXTGR);
  text(`${tx.date_label}`, ML + 4, Y + 5.5);
  font('bold', 7.5); col(...TXTDK);
  text(hoy, ML + 18, Y + 5.5);

  font('normal', 7.5); col(...TXTGR);
  text(`${tx.city_label}`, ML + 95, Y + 5.5);
  font('bold', 7.5); col(...TXTDK);
  text(`${agencia.ciudad || 'Cusco'}, ${agencia.pais || 'Peru'}`, ML + 108, Y + 5.5);

  return Y + 9;
};

// ─── 3. DATOS OPERADOR / CLIENTE ─────────────────────────────
const drawDatosPersonas = (doc, cotizacion, agencia, tx) => {
  const { font, col, fill, draw, lw, rect, text } = h(doc);
  const Y = 64;
  const COL_W = (CW - 4) / 2;
  const RX = ML + COL_W + 4;
  const ROW_H = 8;
  const ROWS = 5;
  const BLOCK_H = 9 + ROWS * ROW_H + 2;

  // Borde bloque izquierdo
  lw(0.3); draw(...BORD);
  rect(ML, Y, COL_W, BLOCK_H, 'S');
  // Encabezado
  fill(...BRAND);
  rect(ML, Y, COL_W, 9, 'F');
  font('bold', 7.5); col(...WHITE);
  text(tx.advisor_section.toUpperCase(), ML + 4, Y + 6.5);

  // Borde bloque derecho
  rect(RX, Y, COL_W, BLOCK_H, 'S');
  fill(...BRAND);
  rect(RX, Y, COL_W, 9, 'F');
  font('bold', 7.5); col(...WHITE);
  text(tx.client_section.toUpperCase(), RX + 4, Y + 6.5);

  // Filas operador
  const opsRows = [
    agencia.responsable || agencia.nombre || 'Cusi Travel',
    agencia.cargo        ? agencia.cargo : '',
    agencia.telefono     ? agencia.telefono : '',
    agencia.whatsapp     ? agencia.whatsapp : '',
    agencia.email        ? agencia.email : '',
  ].filter((_, i) => i === 0 || _);

  opsRows.slice(0, ROWS).forEach((val, i) => {
    const yRow = Y + 9 + i * ROW_H;
    if (i % 2 !== 0) { fill(250, 250, 250); rect(ML, yRow, COL_W, ROW_H, 'F'); }
    font(i === 0 ? 'bold' : 'normal', 8);
    col(i === 0 ? TXTDK : TXTGR);
    const lines = doc.splitTextToSize(val, COL_W - 8);
    text(lines[0] || val, ML + 4, yRow + 5.5);
  });

  // Filas cliente
  const cliRows = [
    cotizacion.cliente_nombre || '—',
    cotizacion.agencia         ? `Agencia: ${cotizacion.agencia}` : '',
    cotizacion.cliente_telefono ? cotizacion.cliente_telefono : '',
    cotizacion.cliente_email   ? cotizacion.cliente_email : '',
    cotizacion.cliente_ciudad  ? cotizacion.cliente_ciudad : '',
  ].filter((_, i) => i === 0 || _);

  cliRows.slice(0, ROWS).forEach((val, i) => {
    const yRow = Y + 9 + i * ROW_H;
    if (i % 2 !== 0) { fill(250, 250, 250); rect(RX, yRow, COL_W, ROW_H, 'F'); }
    font(i === 0 ? 'bold' : 'normal', 8);
    col(i === 0 ? TXTDK : TXTGR);
    const lines = doc.splitTextToSize(val, COL_W - 8);
    text(lines[0] || val, RX + 4, yRow + 5.5);
  });

  return Y + BLOCK_H + 5;
};

// ─── 4. RESUMEN DE VIAJE ─────────────────────────────────────
const drawResumenViaje = (doc, servicio, cotizacion, tx, lang, curY) => {
  const { font, col, fill, draw, lw, rect, text } = h(doc);

  const ROW_H = 9;

  // Header de sección
  fill(...BRAND);
  rect(ML, curY, CW, 10, 'F');
  font('bold', 8.5); col(...WHITE);
  text(tx.trip_section.toUpperCase(), ML + 4, curY + 7);

  lw(0.3); draw(...BORD);
  rect(ML, curY + 10, CW, ROW_H * 3 + 2, 'S');

  const fechaInicio = fmtFecha(cotizacion.fecha_inicio, lang);
  const isoFin = fmtFechaFin(cotizacion.fecha_inicio, servicio.duracion_dias);
  const fechaFin = isoFin ? fmtFecha(isoFin, lang) : null;

  const dataRows = [
    [tx.dest_label,  servicio.nombre || '—'],
    [`${tx.start_label}  ${fechaInicio || '—'}    ${tx.end_label}  ${fechaFin || '—'}`, ''],
    [`${tx.lang_label}  ${cotizacion.idioma || 'Espanol'}    ${tx.pax_label}  ${cotizacion.n_pasajeros} pax`, ''],
  ];

  dataRows.forEach((row, i) => {
    const yRow = curY + 10 + i * ROW_H;
    if (i % 2 !== 0) { fill(...GRAY); rect(ML, yRow, CW, ROW_H, 'F'); }
    font('bold', 7.5); col(...BRAND);
    text(row[0].split('  ')[0], ML + 4, yRow + 6);
    const labelW = doc.getTextWidth(row[0].split('  ')[0]);
    font('normal', 8); col(...TXTDK);
    if (row[1]) {
      text(row[1], ML + 4 + labelW + 2, yRow + 6);
    } else {
      // La fila tiene todo en row[0] con separadores
      const parts = row[0].split('  ').slice(1).join(' ');
      text(parts, ML + 4 + labelW + 2, yRow + 6);
    }
  });

  return curY + 10 + ROW_H * 3 + 7;
};

// ─── 5. TABLA OPCION (precio) ─────────────────────────────────
const drawOpcion = (doc, servicio, cotizacion, tx, lang, curY) => {
  const { font, col, fill, draw, lw, rect, text } = h(doc);
  const tipo = (TIPO_LABEL[lang] || TIPO_LABEL.es)[servicio.tipo] || servicio.tipo || 'Servicio';

  const pBase    = +servicio.precio_base_usd;
  const pax      = +cotizacion.n_pasajeros || 1;
  const pct      = +cotizacion.descuento_pct || 0;
  const subtotal = pBase * pax;
  const descto   = subtotal * pct / 100;
  const total    = subtotal - descto;

  // Header de opción (oscuro)
  fill(...DARK);
  rect(ML, curY, CW, 10, 'F');
  font('bold', 8.5); col(...WHITE);
  text(`${tx.option} A`, ML + 4, curY + 7);

  // Tabla
  const bodyRows = [
    [tipo, servicio.nombre, fmtUSD(subtotal)],
    ...(pct > 0
      ? [[`${tx.discount_label} (${pct}%)`, '', `- ${fmtUSD(descto)}`]]
      : []),
  ];

  autoTable(doc, {
    startY: curY + 10,
    margin: { left: ML, right: MR },
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      textColor: TXTDK,
      lineColor: BORD,
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor: GRAY,
      textColor: TXTGR,
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: 0.3,
      lineColor: BORD,
    },
    columnStyles: {
      0: { cellWidth: CW * 0.22 },
      1: { cellWidth: CW * 0.55 },
      2: { cellWidth: CW * 0.23, halign: 'right', fontStyle: 'bold' },
    },
    head: [[tx.product_col, tx.desc_col, tx.total_col]],
    body: bodyRows.map((row, i) => row.map((v, c) => ({
      content: v,
      styles: {
        textColor: (i > 0 && c === 2) ? RED : TXTDK,
        fillColor: (i > 0 && c !== 2) ? REDLGT : (i % 2 === 1 ? GRAY : WHITE),
      },
    }))),
  });

  const afterTable = doc.lastAutoTable.finalY;

  // Fila total
  lw(0.3); draw(...BORD);
  fill(232, 248, 242); // verde muy suave
  rect(ML, afterTable, CW, 11, 'F');
  rect(ML, afterTable, CW, 11, 'S');
  font('bold', 9); col(...TXTGR);
  text(tx.total_label, ML + 4, afterTable + 7.5);
  font('bold', 14); col(...BRAND);
  text(fmtUSD(total), PW - MR - 4, afterTable + 8, { align: 'right' });

  return afterTable + 17;
};

// ─── 6. PIE DE PÁGINA CONTENIDO ──────────────────────────────
const drawPieContenido = (doc, servicio, cotizacion, tx, curY) => {
  const { font, col, fill, draw, lw, rect, text } = h(doc);
  const noches = (servicio.duracion_dias || 1) - 1;

  // Disclaimer
  const dlines = doc.splitTextToSize(tx.disclaimer, CW - 8);
  font('italic', 6.5); col(...TXTGR);
  text(dlines, ML + 4, curY + 4);

  const dH = dlines.length * 4 + 10;

  // Barra noches/personas
  fill(...GRAY);
  lw(0.3); draw(...BORD);
  rect(ML, curY + dH, CW, 9, 'F');
  rect(ML, curY + dH, CW, 9, 'S');
  font('bold', 8); col(...TXTDK);
  text(`${tx.nights_label}  ${noches}`, ML + 6, curY + dH + 6.5);
  text(`${tx.persons_label}  ${cotizacion.n_pasajeros}`, ML + CW / 2 + 10, curY + dH + 6.5);

  return curY + dH + 14;
};

// ─── 7. ITINERARIO ───────────────────────────────────────────
const drawItinerario = (doc, servicio, tx, lang, curY) => {
  const itinerarios = servicio.itinerarios || [];
  if (!itinerarios.length) return curY;

  if (curY > 220) { doc.addPage(); curY = 15; }

  const { font, col, fill, draw, lw, rect, text } = h(doc);

  // Header
  fill(...DARK);
  rect(ML, curY, CW, 10, 'F');
  font('bold', 8.5); col(...WHITE);
  text(tx.itinerary || 'ITINERARY', ML + 4, curY + 7);

  const rows = itinerarios.map(it => {
    const comidas = [
      it.desayuno  && (lang === 'en' ? 'B' : 'D'),
      it.almuerzo  && (lang === 'en' ? 'L' : 'A'),
      it.cena      && (lang === 'en' ? 'D' : 'C'),
      it.box_lunch && 'BL',
    ].filter(Boolean).join('/');
    const meta = [
      it.altitud_max_msnm ? `${it.altitud_max_msnm} msnm` : '',
      it.distancia_km ? `${it.distancia_km} km` : '',
      it.horas_caminata ? `${it.horas_caminata}h` : '',
      comidas,
    ].filter(Boolean).join(' · ');
    return [
      `${tx.day || 'Day'} ${it.dia_numero}`,
      it.titulo || '',
      meta,
      it.alojamiento || '—',
    ];
  });

  autoTable(doc, {
    startY: curY + 10,
    margin: { left: ML, right: MR },
    theme: 'plain',
    styles: {
      fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: TXTDK, lineColor: BORD, lineWidth: 0.25,
    },
    headStyles: { fillColor: GRAY, textColor: TXTGR, fontStyle: 'bold', fontSize: 7.5, lineWidth: 0.3 },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: CW * 0.38 },
      2: { cellWidth: CW * 0.30 },
      3: { cellWidth: CW - 18 - CW * 0.38 - CW * 0.30 },
    },
    head: [['#', tx.activity || 'Activity', tx.detail_col || 'Details', tx.accommodation || 'Accommodation']],
    body: rows.map((r, i) => r.map(v => ({
      content: v,
      styles: { fillColor: i % 2 === 1 ? GRAY : WHITE },
    }))),
  });

  return doc.lastAutoTable.finalY + 6;
};

// ─── 8. INCLUYE / NO INCLUYE ─────────────────────────────────
const drawIncluyeNoIncluye = (doc, servicio, tx, curY) => {
  const { font, col, fill, draw, lw, rect, text } = h(doc);

  const incluye   = (servicio.incluye    || '').split('\n').map(s => s.trim()).filter(Boolean);
  const noIncluye = (servicio.no_incluye || '').split('\n').map(s => s.trim()).filter(Boolean);
  if (!incluye.length && !noIncluye.length) return curY;

  if (curY > 220) { doc.addPage(); curY = 15; }

  const half = (CW - 4) / 2;

  // Header full-width
  fill(...DARK);
  rect(ML, curY, CW, 10, 'F');
  font('bold', 8.5); col(...WHITE);
  text(tx.includes_section || 'INCLUDED / NOT INCLUDED', ML + 4, curY + 7);

  curY += 12;

  // Sub-headers
  fill(220, 245, 235); lw(0.3); draw(...BORD);
  rect(ML, curY, half, 8, 'F'); rect(ML, curY, half, 8, 'S');
  font('bold', 7.5); col(...[0, 110, 70]);
  text(tx.included || 'INCLUDED', ML + half / 2, curY + 5.5, { align: 'center' });

  const rx = ML + half + 4;
  fill(250, 228, 228); rect(rx, curY, half, 8, 'F'); rect(rx, curY, half, 8, 'S');
  font('bold', 7.5); col(...RED);
  text(tx.not_included || 'NOT INCLUDED', rx + half / 2, curY + 5.5, { align: 'center' });

  curY += 10;

  // Calcular altura necesaria
  const calcH = (list, w) => list.reduce((s, it) => s + Math.max(doc.splitTextToSize(it, w - 10).length * 4.8, 6), 0) + 6;
  const bodyH = Math.max(calcH(incluye, half), calcH(noIncluye, half));

  // Cuerpos
  fill(...WHITE); draw(...BORD);
  rect(ML, curY, half, bodyH, 'F'); rect(ML, curY, half, bodyH, 'S');
  rect(rx, curY, half, bodyH, 'F'); rect(rx, curY, half, bodyH, 'S');

  let yL = curY + 4;
  incluye.forEach(it => {
    const ls = doc.splitTextToSize(it, half - 10);
    font('normal', 7.5); col(...[0, 120, 70]);
    text('+', ML + 4, yL + 2.5);
    col(...TXTDK);
    text(ls, ML + 9, yL + 2.5);
    yL += Math.max(ls.length * 4.8, 6);
  });

  let yR = curY + 4;
  noIncluye.forEach(it => {
    const ls = doc.splitTextToSize(it, half - 10);
    font('normal', 7.5); col(...RED);
    text('-', rx + 4, yR + 2.5);
    col(...TXTDK);
    text(ls, rx + 9, yR + 2.5);
    yR += Math.max(ls.length * 4.8, 6);
  });

  return curY + bodyH + 6;
};

// ─── 9. CONDICIONES ──────────────────────────────────────────
const drawCondiciones = (doc, servicio, tx, curY) => {
  const { font, col, fill, draw, lw, rect, text } = h(doc);
  const politica = servicio.politica_cancelacion || '';
  const items = politica.split('\n').map(s => s.trim()).filter(Boolean);
  if (!items.length) return curY;

  const allH = items.reduce((s, it) => s + doc.splitTextToSize(it, CW - 8).length * 4.5 + 1.5, 0) + 18;
  if (curY + allH > PH - 20) { doc.addPage(); curY = 15; }

  // Header
  fill(...GRAY); lw(0.3); draw(...BORD);
  rect(ML, curY, CW, 9, 'F'); rect(ML, curY, CW, 9, 'S');
  font('bold', 8); col(...TXTDK);
  text(tx.conditions || 'GENERAL CONDITIONS', ML + 4, curY + 6.5);

  let ly = curY + 13;
  items.forEach((it, i) => {
    const ls = doc.splitTextToSize(`${i + 1}.  ${it}`, CW - 6);
    font('normal', 7.5); col(...TXTGR);
    text(ls, ML + 3, ly);
    ly += ls.length * 4.5 + 1.5;
  });

  return ly + 4;
};

// ─── 10. FOOTER PÁGINAS ──────────────────────────────────────
const drawFooters = (doc, agencia, tx) => {
  const { font, col, fill, draw, lw, rect, text } = h(doc);
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    // Línea superior
    lw(0.4); draw(...BRAND);
    doc.line(ML, PH - 14, PW - MR, PH - 14);
    // Info de contacto
    fill(...WHITE);
    font('normal', 6.5); col(...TXTGR);
    const contacto = [agencia.email, agencia.telefono, agencia.web].filter(Boolean).join('   |   ');
    text(contacto || 'info@cusitravel.com', PW / 2, PH - 9, { align: 'center' });
    const addr = [agencia.direccion, agencia.ciudad, agencia.pais].filter(Boolean).join(', ');
    if (addr) text(addr, PW / 2, PH - 5, { align: 'center' });
    // Número de página
    font('normal', 6); col(...TXTGR);
    text(`${tx.page} ${i} ${tx.of} ${total}`, PW - MR, PH - 5, { align: 'right' });
  }
};

// ─── EXPORT PRINCIPAL ─────────────────────────────────────────
export const generarCotizacionPDF = async (servicio, cotizacion, lang = 'es') => {
  const agencia = getAgenciaData();
  const cotNum  = genCotNum();
  const doc     = mkDoc();
  const tx      = { ...(lang === 'en' ? TX.en : TX.es), ...TX[lang] };

  let y = await drawHeader(doc, agencia, cotNum, tx);
  y = drawFechaBar(doc, agencia, tx, lang);
  y = drawDatosPersonas(doc, cotizacion, agencia, tx);
  y = drawResumenViaje(doc, servicio, cotizacion, tx, lang, y);
  y = drawOpcion(doc, servicio, cotizacion, tx, lang, y);
  y = drawPieContenido(doc, servicio, cotizacion, tx, y);

  if (y > 215) { doc.addPage(); y = 15; }

  y = drawItinerario(doc, servicio, tx, lang, y);
  y = drawIncluyeNoIncluye(doc, servicio, tx, y);
  drawCondiciones(doc, servicio, tx, y);
  drawFooters(doc, agencia, tx);

  const prefix = lang === 'en' ? 'Quotation' : 'Cotizacion';
  doc.save(`${prefix}-${cotNum}-${(agencia.nombre || 'CusiTravel').replace(/\s+/g, '-')}.pdf`);
  return cotNum;
};
