import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAgenciaData } from '../pages/AgenciaPage';
import { fmtFecha, fmtMoneda } from './formatters';

// ─── Orden de servicio — v1 (borrador) ─────────────────────────
// Formato preliminar: lista lo esencial para operar el tour.
// El formato final se definirá según lo indique el usuario.

const PW = 210; const ML = 12; const MR = 12; const CW = PW - ML - MR;
const BRAND = [0, 140, 108];
const TXTDK = [28, 28, 30];
const TXTGR = [100, 100, 108];
const GRAY  = [245, 245, 245];

const equipoTexto = (p) => {
  const items = [];
  if (p.quechua_extra_kg) items.push(`Duffel extra ${p.quechua_extra_kg}kg`);
  if (p.trekking_poles)   items.push('Bastones');
  if (p.sleeping_bag)     items.push('Sleeping');
  if (p.carpa_privada)    items.push('Carpa');
  if (p.duffel_bag)       items.push('Duffel bag');
  return items.join(', ') || '—';
};

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
  if (p.alergias)        items.push(`Alergias: ${p.alergias}`);
  return items.join(', ') || '—';
};

export const generarOrdenServicioPDF = (reserva) => {
  const agencia = getAgenciaData();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 15;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...BRAND);
  doc.text('ORDEN DE SERVICIO', ML, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...TXTGR);
  doc.text('Borrador — formato preliminar', PW - MR, y, { align: 'right' });
  y += 6;
  doc.setDrawColor(...BRAND); doc.setLineWidth(0.6);
  doc.line(ML, y, PW - MR, y);
  y += 8;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...TXTDK);
  doc.text(reserva.codigo_reserva || '—', ML, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(reserva.servicio_nombre || reserva.nombre_servicio_snap || '—', ML, y + 6);
  y += 14;

  const infoRows = [
    ['Fechas', `${fmtFecha(reserva.fecha_inicio)} → ${fmtFecha(reserva.fecha_fin)}`],
    ['Pasajeros', String(reserva.n_pasajeros ?? '—')],
    ['Idioma', reserva.idioma_servicio || '—'],
    ['Hora / lugar de encuentro', [reserva.hora_encuentro, reserva.lugar_encuentro].filter(Boolean).join(' — ') || '—'],
    ['Guía asignado', reserva.guia_nombre || '—'],
    ['Agencia', reserva.agencia_nombre || '—'],
    ['Operador', reserva.operador_nombre || '—'],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', textColor: TXTGR, cellWidth: 55 }, 1: { textColor: TXTDK } },
    body: infoRows,
  });
  y = doc.lastAutoTable.finalY + 6;

  if (reserva.observaciones) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...TXTGR);
    doc.text('Notas', ML, y); y += 4;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...TXTDK);
    const lines = doc.splitTextToSize(reserva.observaciones, CW);
    doc.text(lines, ML, y);
    y += lines.length * 4.5 + 4;
  }

  const pasajeros = reserva.pasajeros || [];
  if (pasajeros.length) {
    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR },
      head: [['#', 'Pasajero', 'Pasaporte', 'Nac.', 'Dieta / Salud', 'Equipo']],
      body: pasajeros.map((p, i) => [
        i + 1,
        `${p.apellido || ''}, ${p.nombre || ''}`.trim(),
        p.pasaporte || '—',
        p.nacionalidad || '—',
        dietaTexto(p),
        equipoTexto(p),
      ]),
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: GRAY, textColor: TXTGR, fontStyle: 'bold' },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  const detalles = reserva.detalles || [];
  if (detalles.length) {
    if (y > 250) { doc.addPage(); y = 15; }
    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR },
      head: [['Proveedor', 'Tipo', 'Fecha', 'Estado', 'Costo']],
      body: detalles.map(d => [
        d.proveedor_nombre || '—',
        d.tipo_servicio || '—',
        fmtFecha(d.fecha_inicio),
        d.estado || '—',
        fmtMoneda(d.costo_total_usd, d.moneda),
      ]),
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: GRAY, textColor: TXTGR, fontStyle: 'bold' },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...TXTGR);
  doc.text(`Generado por ${agencia.nombre || 'Cusi Travel'} — documento preliminar, formato final pendiente de definir.`, ML, 290);

  doc.save(`Orden-Servicio-${reserva.codigo_reserva || reserva.id}.pdf`);
};
