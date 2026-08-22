import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAgenciaData } from '../pages/AgenciaPage';
import { fmtMoneda } from './formatters';

// ─── Orden de Salida — replica el formato Excel que Cusi Travel ya usa ──
// (ver carpeta Pdfs/ con los modelos reales que sirvieron de referencia).

const PW = 210; const ML = 10; const MR = 10; const CW = PW - ML - MR;

const GREEN_LABEL  = [141, 180, 90];   // celdas de etiqueta (columna izquierda)
const GREEN_HEADER = [112, 173, 71];   // barras de sección (Notas, Presupuesto...)
const GRAY_HEAD    = [217, 217, 217];  // encabezado de tablas
const BORDER       = [191, 191, 191];
const TXTDK        = [30, 30, 30];
const WHITE        = [255, 255, 255];

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

const parseDateOnly = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? { y: +m[1], mo: +m[2], d: +m[3] } : null;
};

const fmtFechaLarga = (iso) => {
  const p = parseDateOnly(iso);
  if (!p) return '—';
  return `${p.d} de ${MESES[p.mo - 1]}, ${p.y}`;
};

const fmtRangoFechas = (inicio, fin) => {
  const pi = parseDateOnly(inicio), pf = parseDateOnly(fin);
  if (!pi) return '—';
  if (!pf || (pi.y === pf.y && pi.mo === pf.mo && pi.d === pf.d)) return fmtFechaLarga(inicio);
  if (pi.y === pf.y && pi.mo === pf.mo) return `${pi.d}-${pf.d} de ${MESES[pi.mo - 1]}, ${pi.y}`;
  return `${fmtFechaLarga(inicio)} - ${fmtFechaLarga(fin)}`;
};

const addDaysISO = (iso, days) => {
  const p = parseDateOnly(iso);
  if (!p) return null;
  const d = new Date(p.y, p.mo - 1, p.d);
  d.setDate(d.getDate() + days);
  return `${d.getDate()} de ${MESES[d.getMonth()]}`;
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

const GENERO_LABEL = { M: 'M', F: 'F', NO_ESPECIFICADO: '—' };

const dietaTexto = (p) => {
  const items = [];
  if (p.es_vegetariano)  items.push('Vegetariano');
  if (p.es_vegano)       items.push('Vegano');
  if (p.es_pescetariano) items.push('Pescetariano');
  if (p.es_flexitariano) items.push('Flexitariano');
  if (p.es_celiaco)      items.push('Celíaco');
  if (p.sin_lactosa)     items.push('Sin lactosa');
  if (p.es_halal)        items.push('Halal');
  if (p.es_diabetico)    items.push('Diabético');
  if (p.alergias)        items.push(`Alergia: ${p.alergias}`);
  return items.join(', ') || 'NO';
};

const equipoTexto = (p) => {
  const items = [];
  if (p.quechua_extra_kg) items.push(`Duffel extra ${p.quechua_extra_kg}kg`);
  if (p.trekking_poles)   items.push('Bastones');
  if (p.sleeping_bag)     items.push('Sleeping');
  if (p.carpa_privada)    items.push('Carpa');
  if (p.duffel_bag)       items.push('Duffel bag');
  return items.join(', ') || '—';
};

const TIPO_LABEL = {
  HOTEL: 'Hotel', TRANSPORTE: 'Transporte', RESTAURANTE: 'Restaurante', GUIA: 'Guía',
  AEROLINEA: 'Aerolínea', TREN: 'Tren', OPERADOR_LOCAL: 'Operador local', SEGURO: 'Seguro',
  ACTIVIDAD: 'Actividad', COCINERO: 'Cocinero', PORTER: 'Quechuas', OTRO: 'Otro', INGRESOS: 'Ingreso',
};

// ─── Construye las filas etiqueta/valor del bloque superior ────────────
const buildHeaderRows = (reserva, briefings, itinerarios) => {
  const rows = [];
  const detalles = reserva.detalles || [];
  const pax = reserva.pasajeros || [];
  const byTipo = (t) => detalles.filter(d => d.tipo_servicio === t);

  if (reserva.agencia_nombre) {
    rows.push(['AGENCIA Y CODIGO', reserva.agencia_nombre + (reserva.agencia_codigo ? ` - ${reserva.agencia_codigo}` : '')]);
  }
  rows.push(['TOUR', reserva.servicio_nombre || reserva.nombre_servicio_snap || '—']);
  rows.push(['DATE', fmtRangoFechas(reserva.fecha_inicio, reserva.fecha_fin)]);

  if (briefings?.length) {
    const inicioISO = (reserva.fecha_inicio || '').slice(0, 10);
    const b = briefings.filter(x => x.fecha <= inicioISO).sort((a, c) => c.fecha.localeCompare(a.fecha))[0] || briefings[0];
    const partes = [fmtFechaLarga(b.fecha)];
    if (b.hora) partes.push(`a las ${b.hora.slice(0, 5)} hrs`);
    if (b.lugar) partes.push(`en ${b.lugar}`);
    rows.push(['Briefing', partes.join(' ') + (b.persona_encargada ? `   —   ${b.persona_encargada}` : '')]);
  }

  const hoteles = byTipo('HOTEL');
  hoteles.forEach((d, i) => {
    rows.push([hoteles.length > 1 ? `Hotel ${i + 1}` : 'Hotel', `${d.proveedor_nombre || ''}${d.descripcion ? ' — ' + d.descripcion : ''}`]);
  });

  byTipo('RESTAURANTE').forEach((d) => {
    rows.push([d.proveedor_nombre || 'Restaurante', d.descripcion || '—']);
  });

  if (reserva.hora_encuentro || reserva.lugar_encuentro) {
    rows.push(['Hora de Salida', [reserva.hora_encuentro?.slice(0, 5), reserva.lugar_encuentro].filter(Boolean).join(' — ')]);
  }

  const guias = byTipo('GUIA');
  guias.forEach((d, i) => {
    rows.push([guias.length > 1 ? `Guía ${i + 1}` : 'Guía', `${d.proveedor_nombre || ''}${d.descripcion ? ' — ' + d.descripcion : ''}`]);
  });

  byTipo('COCINERO').forEach((d) => {
    rows.push(['Cocinero', `${d.proveedor_nombre || ''}${d.descripcion ? ' — ' + d.descripcion : ''}`]);
  });

  const porters = byTipo('PORTER');
  if (porters.length) {
    const total = porters.reduce((s, d) => s + Number(d.cantidad || 0), 0);
    rows.push(['Quechuas', `${total} porter${total !== 1 ? 's' : ''}` + (porters[0].descripcion ? ` — ${porters[0].descripcion}` : '')]);
  }

  const kgCounts = {};
  pax.forEach(p => { if (p.quechua_extra_kg) kgCounts[p.quechua_extra_kg] = (kgCounts[p.quechua_extra_kg] || 0) + 1; });
  const kgTxt = Object.entries(kgCounts).map(([kg, n]) => `${n} de ${kg}kg`).join(', ');
  if (kgTxt) rows.push(['Quechua Extra', `Si, ${kgTxt}`]);

  if (itinerarios?.length) {
    const camps = [...new Set(itinerarios.map(it => it.alojamiento).filter(Boolean))];
    if (camps.length) rows.push(['Campamentos', camps.join(', ')]);
  }

  const sleeping = pax.filter(p => p.sleeping_bag).length;
  if (sleeping) rows.push(['Bolsa de Dormir', `Si, ${sleeping} bolsa${sleeping !== 1 ? 's' : ''}`]);

  const carpas = pax.filter(p => p.carpa_privada).length;
  if (carpas) rows.push(['Carpas', `${carpas}`]);

  const bastones = pax.filter(p => p.trekking_poles).length;
  if (bastones) rows.push(['Bastones', `${bastones} par${bastones !== 1 ? 'es' : ''}`]);

  const duffel = pax.filter(p => p.duffel_bag).length;
  if (duffel) rows.push(['Duffel bag', `${duffel}`]);

  const transportes = byTipo('TRANSPORTE');
  transportes.forEach((d, i) => {
    rows.push([transportes.length > 1 ? `Transporte ${i + 1}` : 'Transporte', `${d.proveedor_nombre || ''}${d.descripcion ? ' — ' + d.descripcion : ''}`]);
  });

  return rows;
};

// ─── Sección de notas: RUC, pagos a staff, observaciones + notas de la reserva ──
const buildNotas = (reserva, agencia, notas = []) => {
  const lineas = (reserva.observaciones || '').split('\n').map(s => s.trim()).filter(Boolean);
  notas.forEach(n => { if (n.texto?.trim()) lineas.push(n.texto.trim()); });
  const detalles = reserva.detalles || [];

  detalles.filter(d => d.notas?.trim()).forEach(d => {
    lineas.push(`${TIPO_LABEL[d.tipo_servicio] || d.tipo_servicio}${d.proveedor_nombre ? ` (${d.proveedor_nombre})` : ''}: ${d.notas.trim()}`);
  });

  const staffPagos = detalles.filter(d => ['GUIA', 'COCINERO', 'PORTER'].includes(d.tipo_servicio) && Number(d.costo_total_usd) > 0);
  if (staffPagos.length) {
    const texto = staffPagos
      .map(d => `${fmtMoneda(d.costo_total_usd, d.moneda)} ${(TIPO_LABEL[d.tipo_servicio] || '').toLowerCase()}${d.proveedor_nombre ? ` (${d.proveedor_nombre})` : ''}`)
      .join(' + ');
    lineas.push(`Pago: ${texto}`);
  }

  if (agencia.ruc) {
    lineas.push(`Pedir FACTURA para las compras con RUC: ${agencia.ruc}${agencia.razon_social ? ` ${agencia.razon_social}` : ''}.`);
  }

  return lineas;
};

// ─── Presupuesto: líneas manuales de la reserva + costos operativos
// (excluye pagos de staff, ya listados en Notas) ────────────────────────
const buildPresupuesto = (reserva, presupuestoItems = []) => {
  const manuales = presupuestoItems.map(it => ({
    descripcion: it.descripcion,
    monto: Number(it.monto),
    moneda: it.moneda || 'USD',
  }));
  const operativos = (reserva.detalles || [])
    .filter(d => !['GUIA', 'COCINERO', 'PORTER'].includes(d.tipo_servicio) && Number(d.costo_total_usd) > 0)
    .map(d => ({
      descripcion: d.descripcion || TIPO_LABEL[d.tipo_servicio] || d.tipo_servicio,
      monto: Number(d.costo_total_usd),
      moneda: d.moneda || 'USD',
    }));
  return [...manuales, ...operativos];
};

// ─── Helpers de dibujo ──────────────────────────────────────────────────
const sectionHeader = (doc, title, y) => {
  doc.setFillColor(...GREEN_HEADER);
  doc.rect(ML, y, CW, 7, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...WHITE);
  doc.text(title, ML + 3, y + 5);
  return y + 7;
};

const ensureSpace = (doc, y, needed) => {
  if (y + needed > 282) { doc.addPage(); return 15; }
  return y;
};

export const generarOrdenServicioPDF = async ({ reserva, briefings = [], itinerarios = [], notas: notasReserva = [], presupuestoItems = [] }) => {
  const agencia = getAgenciaData();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 12;

  // ── Título + logo ──
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...TXTDK);
  doc.text('ORDEN DE SALIDA', PW / 2, y + 5, { align: 'center' });

  const logoB64 = agencia.logo_b64 || await urlToBase64('/logo-cusi.png');
  if (logoB64) {
    try { doc.addImage(logoB64, 'PNG', PW - MR - 32, y - 3, 32, 18, '', 'FAST'); } catch (_) {}
  }
  y += 12;

  // ── Bloque de datos clave (etiqueta / valor) ──
  const headerRows = buildHeaderRows(reserva, briefings, itinerarios);
  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2, lineColor: BORDER, lineWidth: 0.2, textColor: TXTDK, valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold', fillColor: GREEN_LABEL, textColor: WHITE },
      1: { cellWidth: CW - 38 },
    },
    body: headerRows,
  });
  y = doc.lastAutoTable.finalY + 5;

  // ── Datos de los pasajeros ──
  const pax = reserva.pasajeros || [];
  const conNotas = pax.some(p => p.observaciones?.trim());
  y = ensureSpace(doc, y, 20);
  y = sectionHeader(doc, 'DATOS DE LOS PASAJEROS', y);

  const head = ['#', 'Nombres', 'País', 'N° Pasaporte', 'Género', 'Edad', 'Dieta / Salud', 'Equipo'];
  if (conNotas) head.push('Notas');

  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 1.8, lineColor: BORDER, lineWidth: 0.2, textColor: TXTDK },
    headStyles: { fillColor: GRAY_HEAD, textColor: TXTDK, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 7, halign: 'center' } },
    head: [head],
    body: pax.map((p, i) => {
      const row = [
        i + 1,
        `${p.apellido || ''}, ${p.nombre || ''}`.trim(),
        p.nacionalidad || '—',
        p.pasaporte || '—',
        GENERO_LABEL[p.genero] || '—',
        p.edad_calculada ?? '—',
        dietaTexto(p),
        equipoTexto(p),
      ];
      if (conNotas) row.push(p.observaciones || '');
      return row;
    }),
  });
  y = doc.lastAutoTable.finalY + 5;

  // ── Itinerario detallado (si el paquete tiene día a día) ──
  if (itinerarios?.length) {
    y = ensureSpace(doc, y, 20);
    y = sectionHeader(doc, 'ITINERARIO DETALLADO', y);
    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR },
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 1.8, lineColor: BORDER, lineWidth: 0.2, textColor: TXTDK },
      headStyles: { fillColor: GRAY_HEAD, textColor: TXTDK, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 1: { cellWidth: 22 } },
      head: [['Día', 'Fecha', 'Actividad', 'Alojamiento', 'Nota']],
      body: itinerarios
        .slice().sort((a, b) => a.dia_numero - b.dia_numero)
        .map(it => [
          it.dia_numero,
          addDaysISO(reserva.fecha_inicio, it.dia_numero - 1) || '—',
          it.titulo || '—',
          it.alojamiento || '—',
          it.notas_operativas || '',
        ]),
    });
    y = doc.lastAutoTable.finalY + 5;
  }

  // ── Notas ──
  const notasLineas = buildNotas(reserva, agencia, notasReserva);
  if (notasLineas.length) {
    y = ensureSpace(doc, y, 16);
    y = sectionHeader(doc, 'NOTAS', y);
    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR },
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, lineColor: BORDER, lineWidth: 0.2, textColor: TXTDK },
      body: notasLineas.map(n => [n]),
    });
    y = doc.lastAutoTable.finalY + 5;
  }

  // ── Presupuesto (líneas manuales de la reserva + costos operativos, por moneda) ──
  const presupuesto = buildPresupuesto(reserva, presupuestoItems);
  if (presupuesto.length) {
    y = ensureSpace(doc, y, 16);
    y = sectionHeader(doc, 'PRESUPUESTO', y);

    const totales = {};
    presupuesto.forEach(it => { totales[it.moneda] = (totales[it.moneda] || 0) + it.monto; });

    const body = presupuesto.map(it => [it.descripcion, fmtMoneda(it.monto, it.moneda)]);
    Object.entries(totales).forEach(([moneda, total], i) => {
      body.push([{ content: Object.keys(totales).length > 1 ? `TOTAL ${moneda}` : 'TOTAL', styles: { fontStyle: 'bold', halign: 'right' } },
        { content: fmtMoneda(total, moneda), styles: { fontStyle: 'bold' } }]);
    });

    if (body.length) {
      autoTable(doc, {
        startY: y,
        margin: { left: ML, right: MR },
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2, lineColor: BORDER, lineWidth: 0.2, textColor: TXTDK },
        columnStyles: { 1: { cellWidth: 30, halign: 'right' } },
        body,
      });
      y = doc.lastAutoTable.finalY + 5;
    }
  }

  doc.save(`Orden-Salida-${reserva.codigo_reserva || reserva.id}.pdf`);
};
