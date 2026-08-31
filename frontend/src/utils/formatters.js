const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Columnas DATE (sin hora) llegan como "YYYY-MM-DD" o "YYYY-MM-DDT00:00:00.000Z".
// Parsear el día/mes/año directo del string evita que new Date(iso) + toLocaleDateString
// interprete esa medianoche UTC en la zona horaria local y muestre el día anterior.
const parseDateOnly = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? { y: +m[1], mo: +m[2], d: +m[3] } : null;
};

export const fmtFecha = (iso) => {
  if (!iso) return '—';
  const p = parseDateOnly(iso);
  if (p) return `${String(p.d).padStart(2, '0')}/${String(p.mo).padStart(2, '0')}/${p.y}`;
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const fmtFechaHora = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const fmtFechaCorta = (iso) => {
  if (!iso) return '—';
  const p = parseDateOnly(iso);
  if (p) return `${String(p.d).padStart(2, '0')} ${MESES_CORTOS[p.mo - 1]}`;
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

export const fmtMoneda = (n, moneda = 'USD') => {
  if (n === undefined || n === null || n === '') return '—';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: moneda, minimumFractionDigits: 2,
  }).format(Number(n));
};

export const fmtMonedaCorta = (n) => {
  if (n === undefined || n === null || n === '') return '—';
  const v = Number(n);
  if (Math.abs(v) >= 10000) return `$${Math.round(v / 1000)}K`;
  if (Math.abs(v) >= 1000)  return `$${(v / 1000).toFixed(1)}K`;
  return `$${Math.round(v)}`;
};

export const fmtNumero = (n) => {
  if (!n && n !== 0) return '—';
  return new Intl.NumberFormat('es-PE').format(Number(n));
};

// Calcula el inicio de semana (lunes)
export const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth() &&
  a.getDate()     === b.getDate();

// Construye la fecha en horario LOCAL a partir del YYYY-MM-DD (evita el
// corrimiento de día que da `new Date(iso)` con columnas DATE en UTC).
export const localDateFromDateOnly = (iso) => {
  const p = parseDateOnly(iso);
  return p ? new Date(p.y, p.mo - 1, p.d) : new Date(iso);
};

export const reservaOverlapsDay = (r, day) => {
  const s = localDateFromDateOnly(r.fecha_inicio); s.setHours(0, 0, 0, 0);
  const e = localDateFromDateOnly(r.fecha_fin);    e.setHours(23, 59, 59, 999);
  const d = new Date(day);                          d.setHours(12, 0, 0, 0);
  return d >= s && d <= e;
};

export const isToday = (date) => isSameDay(date, new Date());

export const getMonthDays = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const startDay = getWeekStart(firstDay);
  const days = [];
  for (let i = 0; i < 42; i++) days.push(addDays(startDay, i));
  return days;
};

export const truncate = (str, n = 30) =>
  str && str.length > n ? str.slice(0, n) + '…' : (str || '—');
