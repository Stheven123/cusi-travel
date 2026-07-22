import { ESTADOS_OPERACION, ESTADOS_PAGO, PRIORIDADES_TAREA, ESTADOS_TAREA } from '../../utils/constants';

const STYLE_MAP = {
  gray:   { bg: 'rgba(107,100,128,0.10)', color: 'var(--text-2)' },
  blue:   { bg: 'rgba(79,70,229,0.10)',   color: 'var(--brand)' },
  green:  { bg: 'rgba(5,150,105,0.11)',   color: 'var(--success)' },
  yellow: { bg: 'rgba(217,119,6,0.10)',   color: 'var(--accent)' },
  orange: { bg: 'rgba(234,88,12,0.10)',   color: '#ea580c' },
  red:    { bg: 'rgba(220,38,38,0.10)',   color: 'var(--danger)' },
  purple: { bg: 'rgba(109,40,217,0.10)',  color: '#7c3aed' },
  amber:  { bg: 'rgba(217,119,6,0.10)',   color: 'var(--accent)' },
  teal:   { bg: 'rgba(13,148,136,0.10)',  color: '#0d9488' },
};

export const Badge = ({ color = 'gray', children, dot }) => {
  const s = STYLE_MAP[color] || STYLE_MAP.gray;
  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold rounded-full px-2.5 py-0.5 text-xs"
      style={{ background: s.bg, color: s.color }}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: s.color }} />
      )}
      {children}
    </span>
  );
};

export const EstadoOpBadge    = ({ estado }) => {
  const e = ESTADOS_OPERACION.find(x => x.value === estado);
  return <Badge color={e?.color || 'gray'} dot>{e?.label || estado}</Badge>;
};

export const EstadoPagoBadge  = ({ estado }) => {
  const e = ESTADOS_PAGO.find(x => x.value === estado);
  return <Badge color={e?.color || 'gray'} dot>{e?.label || estado}</Badge>;
};

export const PrioridadBadge   = ({ prioridad }) => {
  const p = PRIORIDADES_TAREA.find(x => x.value === prioridad);
  return <Badge color={p?.color || 'gray'}>{p?.label || prioridad}</Badge>;
};

export const EstadoTareaBadge = ({ estado }) => {
  const e = ESTADOS_TAREA.find(x => x.value === estado);
  return <Badge color={e?.color || 'gray'} dot>{e?.label || estado}</Badge>;
};
