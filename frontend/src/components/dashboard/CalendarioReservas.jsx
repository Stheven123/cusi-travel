import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CalendarDays } from 'lucide-react';
import { DIAS_SEMANA, MESES } from '../../utils/constants';
import { getWeekStart, addDays, isSameDay, reservaOverlapsDay, isToday, getMonthDays, fmtFechaCorta } from '../../utils/formatters';
import { EstadoOpBadge } from '../ui/Badge';

const ESTADO_STYLE = {
  COTIZACION:            { bg: 'rgba(136,146,170,0.14)', color: '#8892aa', dot: '#8892aa' },
  RESERVADO:             { bg: 'rgba(67,97,238,0.13)',   color: '#4361ee', dot: '#4361ee' },
  SERVICIO_COMPLETO:     { bg: 'rgba(16,185,129,0.13)',  color: '#059669', dot: '#10b981' },
  PENDIENTE:             { bg: 'rgba(245,158,11,0.13)',  color: '#b45309', dot: '#f59e0b' },
  ANULADO_SIN_PENALIDAD: { bg: 'rgba(249,115,22,0.13)', color: '#c2410c', dot: '#f97316' },
  ANULADO_CON_PENALIDAD: { bg: 'rgba(239,68,68,0.13)',  color: '#dc2626', dot: '#ef4444' },
};
const DEFAULT_STYLE = { bg: 'rgba(136,146,170,0.14)', color: '#8892aa', dot: '#8892aa' };

const DIAS_CORTO = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function ReservaBlock({ r, onClick }) {
  const s = ESTADO_STYLE[r.estado_operacion] || DEFAULT_STYLE;
  return (
    <button
      onClick={() => onClick(r)}
      className="w-full text-left text-xs px-2 py-1 rounded-lg mb-0.5 truncate font-semibold hover:opacity-75 active:opacity-50 transition-opacity cursor-pointer flex items-center gap-1.5"
      style={{ background: s.bg, color: s.color }}
      title={`${r.codigo_reserva} — ${r.servicio_nombre || r.nombre_servicio_snap} — ${r.n_pasajeros} pax`}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {r.codigo_reserva}
    </button>
  );
}

export default function CalendarioReservas({ reservas = [], onReservaClick }) {
  const [vista, setVista]     = useState('mensual');
  const [current, setCurrent] = useState(new Date());

  const weekStart = getWeekStart(current);
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const prevSemana = () => setCurrent(addDays(current, -7));
  const nextSemana = () => setCurrent(addDays(current, +7));

  const year  = current.getFullYear();
  const month = current.getMonth();
  const monthDays = getMonthDays(year, month);
  const prevMes = () => setCurrent(new Date(year, month - 1, 1));
  const nextMes = () => setCurrent(new Date(year, month + 1, 1));

  const hoy = () => setCurrent(new Date());

  const currentDays   = vista === 'semanal' ? weekDays : monthDays;
  const handlePrev    = vista === 'semanal' ? prevSemana : prevMes;
  const handleNext    = vista === 'semanal' ? nextSemana : nextMes;
  const tituloVista   = vista === 'semanal'
    ? `${fmtFechaCorta(weekStart)} — ${fmtFechaCorta(weekDays[6])}`
    : `${MESES[month]} ${year}`;

  // Días con reservas para la vista móvil
  const diasConReservas = currentDays.filter(day => {
    const enMes = vista === 'mensual' ? day.getMonth() === month : true;
    return enMes && reservas.some(r => reservaOverlapsDay(r, day));
  });

  return (
    <div className="card overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Calendar size={17} style={{ color: 'var(--brand)' }} className="flex-shrink-0" />
          <span className="font-semibold text-sm md:text-base truncate" style={{ color: 'var(--text)' }}>{tituloVista}</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={hoy} className="btn-ghost text-xs px-2 py-1.5 min-h-[36px]">Hoy</button>
          {/* Vista toggle — solo desktop */}
          <div className="hidden md:flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {['semanal', 'mensual'].map(v => (
              <button key={v} onClick={() => setVista(v)}
                className="px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                style={vista === v
                  ? { background: 'var(--brand)', color: 'white' }
                  : { color: 'var(--text-2)' }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-0.5">
            <button onClick={handlePrev} aria-label="Anterior"
              className="p-2 rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              style={{ color: 'var(--text-2)' }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={handleNext} aria-label="Siguiente"
              className="p-2 rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              style={{ color: 'var(--text-2)' }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE: vista de lista ── */}
      <div className="md:hidden">
        {diasConReservas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--text-2)' }}>
            <CalendarDays size={36} className="mb-3" style={{ color: 'var(--text-3)' }} />
            <p className="text-sm">Sin reservas en este periodo</p>
          </div>
        ) : (
          <div>
            {diasConReservas.map((day, i) => {
              const dayReservas = reservas.filter(r => reservaOverlapsDay(r, day));
              const today = isToday(day);
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="w-12 flex-shrink-0 text-center pt-0.5">
                    <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{DIAS_CORTO[day.getDay()]}</p>
                    <p className="text-xl font-bold leading-tight" style={{ color: today ? 'var(--brand)' : 'var(--text)' }}>
                      {day.getDate()}
                    </p>
                    {today && <div className="w-1.5 h-1.5 rounded-full mx-auto mt-0.5" style={{ background: 'var(--brand)' }} />}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1 pt-1">
                    {dayReservas.map(r => (
                      <ReservaBlock key={r.id} r={r} onClick={onReservaClick} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DESKTOP: calendario ── */}
      <div className="hidden md:block">
        {/* Vista semanal */}
        {vista === 'semanal' && (
          <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
            {weekDays.map((day, i) => {
              const dayReservas = reservas.filter(r => reservaOverlapsDay(r, day));
              const today = isToday(day);
              return (
                <div key={i} className="min-h-[160px]"
                  style={{ borderRight: i < 6 ? '1px solid var(--border)' : 'none' }}>
                  <div className="text-center py-3"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: today ? 'var(--brand-bg)' : 'transparent',
                    }}>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{DIAS_SEMANA[i]}</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: today ? 'var(--brand)' : 'var(--text)' }}>
                      {day.getDate()}
                    </p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    {dayReservas.map(r => (
                      <ReservaBlock key={r.id} r={r} onClick={onReservaClick} />
                    ))}
                    {dayReservas.length === 0 && (
                      <p className="text-xs text-center pt-4" style={{ color: 'var(--text-3)' }}>—</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Vista mensual */}
        {vista === 'mensual' && (
          <div>
            <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
              {DIAS_SEMANA.map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold uppercase"
                  style={{ color: 'var(--text-3)' }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day, i) => {
                const dayReservas = reservas.filter(r => reservaOverlapsDay(r, day));
                const today = isToday(day);
                const isCurrentMonth = day.getMonth() === month;
                return (
                  <div key={i} className="min-h-[90px] p-1.5"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none',
                      background: !isCurrentMonth ? 'var(--card-2)' : 'transparent',
                      opacity: !isCurrentMonth ? 0.6 : 1,
                    }}>
                    <p className="text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full"
                      style={{
                        background: today ? 'var(--brand)' : 'transparent',
                        color: today ? 'white' : isCurrentMonth ? 'var(--text)' : 'var(--text-3)',
                      }}>
                      {day.getDate()}
                    </p>
                    {dayReservas.slice(0, 3).map(r => (
                      <ReservaBlock key={r.id} r={r} onClick={onReservaClick} />
                    ))}
                    {dayReservas.length > 3 && (
                      <p className="text-xs pl-1" style={{ color: 'var(--text-2)' }}>+{dayReservas.length - 3} más</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
