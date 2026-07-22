import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Calendar, CalendarDays, ArrowRight, Clock, MapPin } from 'lucide-react';
import { reservasApi } from '../api/reservas.api';
import { briefingsApi } from '../api/briefings.api';
import { EstadoOpBadge, EstadoPagoBadge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import {
  getWeekStart, addDays, reservaOverlapsDay, isToday,
  getMonthDays, fmtFechaCorta, fmtFecha, fmtMoneda,
} from '../utils/formatters';
import { DIAS_SEMANA, MESES } from '../utils/constants';

const DIAS_CORTO = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

const ESTADO_STYLE = {
  COTIZACION:            { bg: 'rgba(136,146,170,0.14)', color: '#8892aa', dot: '#8892aa' },
  RESERVADO:             { bg: 'rgba(67,97,238,0.13)',   color: '#4361ee', dot: '#4361ee' },
  SERVICIO_COMPLETO:     { bg: 'rgba(16,185,129,0.13)',  color: '#059669', dot: '#10b981' },
  PENDIENTE:             { bg: 'rgba(245,158,11,0.13)',  color: '#b45309', dot: '#f59e0b' },
  ANULADO_SIN_PENALIDAD: { bg: 'rgba(249,115,22,0.13)', color: '#c2410c', dot: '#f97316' },
  ANULADO_CON_PENALIDAD: { bg: 'rgba(239,68,68,0.13)',  color: '#dc2626', dot: '#ef4444' },
};
const DEFAULT_STYLE = { bg: 'rgba(136,146,170,0.14)', color: '#8892aa', dot: '#8892aa' };

/* ── Inline mini-modal ─────────────────────────────────────────── */
function ReservaModal({ reserva, pos, onClose }) {
  const navigate = useNavigate();
  const ref = useRef(null);
  const saldo = reserva.saldo_usd != null ? Number(reserva.saldo_usd) : null;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Center on mobile; position near click on desktop
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const style = (!pos || isMobile)
    ? { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 9999 }
    : {
        position: 'fixed',
        top:  Math.max(8, Math.min(pos.y + 8, window.innerHeight - 350)),
        left: Math.max(8, Math.min(pos.x,     window.innerWidth  - 312)),
        zIndex: 9999,
      };

  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div ref={ref} className="w-72 rounded-2xl overflow-hidden" style={{
        ...style,
        background: 'var(--card)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--card-2)' }}>
          <p className="font-mono font-black text-sm" style={{ color: 'var(--brand)' }}>
            {reserva.codigo_reserva}
          </p>
          <button onClick={onClose} className="p-1 rounded-lg cursor-pointer" style={{ color: 'var(--text-3)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <p className="font-semibold text-sm leading-snug" style={{ color: 'var(--text)' }}>
            {reserva.servicio_nombre || reserva.nombre_servicio_snap || '—'}
          </p>

          <div className="text-xs space-y-1" style={{ color: 'var(--text-2)' }}>
            <p>📅 {fmtFecha(reserva.fecha_inicio)} → {fmtFecha(reserva.fecha_fin)}</p>
            <p>👥 {reserva.n_pasajeros} pax</p>
            {reserva.agencia_nombre && <p>🏢 {reserva.agencia_nombre}</p>}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <EstadoOpBadge estado={reserva.estado_operacion} />
            <EstadoPagoBadge estado={reserva.estado_pago} />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="text-center">
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Total</p>
              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{fmtMoneda(reserva.total_usd)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Saldo</p>
              <p className="font-bold text-sm" style={{ color: saldo > 0 ? '#dc2626' : '#059669' }}>
                {saldo != null ? fmtMoneda(saldo) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            onClick={() => { onClose(); navigate(`/reservas/${reserva.id}`); }}
            className="w-full btn-primary justify-center text-xs">
            Ver detalle <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Reservation block ─────────────────────────────────────────── */
function ReservaBlock({ r, onClick }) {
  const s = ESTADO_STYLE[r.estado_operacion] || DEFAULT_STYLE;
  return (
    <button
      onClick={onClick}
      className="w-full text-left text-xs px-2 py-1 rounded-lg mb-0.5 truncate font-semibold hover:opacity-80 active:opacity-50 transition-opacity cursor-pointer flex items-center gap-1.5"
      style={{ background: s.bg, color: s.color }}
      title={`📋 ${r.codigo_reserva} — ${r.servicio_nombre || r.nombre_servicio_snap} — ${r.n_pasajeros} pax`}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      <span className="truncate">{r.codigo_reserva}</span>
    </button>
  );
}

/* ── Briefing block ──────────────────────────────────────────────── */
function BriefingBlock({ b, onClick }) {
  const hora = b.hora ? b.hora.slice(0, 5) : null;
  return (
    <button
      onClick={onClick}
      className="w-full text-left text-xs px-2 py-1 rounded-lg mb-0.5 font-semibold flex items-center gap-1.5 overflow-hidden cursor-pointer hover:opacity-80 active:opacity-50 transition-opacity"
      style={{
        background: 'linear-gradient(90deg, rgba(234,179,8,0.18) 0%, rgba(234,179,8,0.08) 100%)',
        color: '#92400e',
        border: '1px dashed rgba(234,179,8,0.6)',
      }}
      title={`🗓 Briefing${b.codigo_reserva ? ' — ' + b.codigo_reserva : ''}${b.persona_encargada ? ' — ' + b.persona_encargada : ''}${b.lugar ? ' @ ' + b.lugar : ''}${hora ? ' · ' + hora : ''}`}
    >
      <span className="flex-shrink-0 text-yellow-600">📋</span>
      <span className="truncate">
        {hora && <span className="font-mono mr-1">{hora}</span>}
        {b.codigo_reserva && <span className="font-mono mr-1">{b.codigo_reserva}</span>}
        {b.persona_encargada || 'Briefing'}
      </span>
    </button>
  );
}

/* ── Briefing mini-modal ────────────────────────────────────────── */
function BriefingModal({ briefing, pos, onClose }) {
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const style = (!pos || isMobile)
    ? { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 9999 }
    : {
        position: 'fixed',
        top:  Math.max(8, Math.min(pos.y + 8, window.innerHeight - 300)),
        left: Math.max(8, Math.min(pos.x,     window.innerWidth  - 312)),
        zIndex: 9999,
      };

  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div ref={ref} className="w-72 rounded-2xl overflow-hidden" style={{
        ...style,
        background: 'var(--card)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)',
      }}>
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--card-2)' }}>
          <p className="font-black text-sm flex items-center gap-1.5" style={{ color: '#92400e' }}>
            📋 Briefing
          </p>
          <button onClick={onClose} className="p-1 rounded-lg cursor-pointer" style={{ color: 'var(--text-3)' }}>
            <X size={14} />
          </button>
        </div>
        <div className="p-4 space-y-2 text-sm" style={{ color: 'var(--text-2)' }}>
          {briefing.codigo_reserva && (
            <p className="font-mono font-bold" style={{ color: 'var(--brand)' }}>{briefing.codigo_reserva}</p>
          )}
          <p className="flex items-center gap-1.5"><Calendar size={13} /> {fmtFecha(briefing.fecha)}</p>
          {briefing.hora && <p className="flex items-center gap-1.5"><Clock size={13} /> {briefing.hora.slice(0, 5)}</p>}
          {briefing.lugar && <p className="flex items-center gap-1.5"><MapPin size={13} /> {briefing.lugar}</p>}
          {briefing.persona_encargada && <p>👤 {briefing.persona_encargada}</p>}
          {briefing.notas && <p className="text-xs" style={{ color: 'var(--text-3)' }}>{briefing.notas}</p>}
        </div>
        {briefing.reserva_id && (
          <div className="px-4 pb-4">
            <button
              onClick={() => { onClose(); navigate(`/reservas/${briefing.reserva_id}`); }}
              className="w-full btn-primary justify-center text-xs">
              Ver reserva <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Leyenda ─────────────────────────────────────────────────────── */
function Leyenda() {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-xs"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--card-2)' }}>
      <span className="font-semibold" style={{ color: 'var(--text-3)' }}>Leyenda:</span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'rgba(67,97,238,0.2)', border: '1px solid #4361ee' }} />
        <span style={{ color: 'var(--text-2)' }}>Reserva</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'rgba(234,179,8,0.18)', border: '1px dashed rgba(234,179,8,0.6)' }} />
        <span style={{ color: 'var(--text-2)' }}>📋 Briefing</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#10b981' }} />
        <span style={{ color: 'var(--text-2)' }}>Completo</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#4361ee' }} />
        <span style={{ color: 'var(--text-2)' }}>Reservado</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#f59e0b' }} />
        <span style={{ color: 'var(--text-2)' }}>Pendiente</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#ef4444' }} />
        <span style={{ color: 'var(--text-2)' }}>Anulado</span>
      </span>
    </div>
  );
}

const toLocalDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const briefingOnDay = (b, day) => {
  if (!b.fecha) return false;
  return b.fecha.slice(0, 10) === toLocalDateStr(day);
};

/* ── Page ─────────────────────────────────────────────────────── */
export default function CalendarioPage() {
  const [reservas, setReservas]   = useState([]);
  const [briefings, setBriefings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [vista, setVista]         = useState('mensual');
  const [current, setCurrent]     = useState(new Date());
  const [selected, setSelected]   = useState(null); // { reserva, pos }
  const [selectedBriefing, setSelectedBriefing] = useState(null); // { briefing, pos }

  const year  = current.getFullYear();
  const month = current.getMonth();

  const weekStart = getWeekStart(current);
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthDays = getMonthDays(year, month);

  const currentDays = vista === 'semanal' ? weekDays : monthDays;

  const prevSemana = () => setCurrent(addDays(current, -7));
  const nextSemana = () => setCurrent(addDays(current, +7));
  const prevMes    = () => setCurrent(new Date(year, month - 1, 1));
  const nextMes    = () => setCurrent(new Date(year, month + 1, 1));

  const handlePrev = vista === 'semanal' ? prevSemana : prevMes;
  const handleNext = vista === 'semanal' ? nextSemana : nextMes;
  const hoy        = () => setCurrent(new Date());

  const tituloVista = vista === 'semanal'
    ? `${fmtFechaCorta(weekStart)} — ${fmtFechaCorta(weekDays[6])}`
    : `${MESES[month]} ${year}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const days  = vista === 'semanal' ? weekDays : monthDays;
      const desde = toLocalDateStr(days[0]);
      const hasta = toLocalDateStr(days[days.length - 1]);
      const resReservas = await reservasApi.getCalendario({ desde, hasta });
      setReservas(resReservas.data || []);
      // Briefings son opcionales: si la migración no se ejecutó aún no rompe el calendario
      try {
        const resBriefings = await briefingsApi.getAll({ desde, hasta });
        setBriefings(resBriefings.data || []);
      } catch { setBriefings([]); }
    } catch { setError('Error al cargar el calendario'); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, vista]);

  useEffect(() => { load(); }, [load]);

  const handleBlockClick = (r, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Position modal below block, check screen edges
    const x = Math.min(rect.left, window.innerWidth - 300);
    const y = Math.min(rect.bottom + 8, window.innerHeight - 320);
    setSelected({ reserva: r, pos: { x, y } });
  };

  const handleBriefingClick = (b, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 300);
    const y = Math.min(rect.bottom + 8, window.innerHeight - 300);
    setSelectedBriefing({ briefing: b, pos: { x, y } });
  };

  // Mobile: days with reservations or briefings
  const diasConReservas = currentDays.filter(day => {
    const enMes = vista === 'mensual' ? day.getMonth() === month : true;
    return enMes && (
      reservas.some(r => reservaOverlapsDay(r, day)) ||
      briefings.some(b => briefingOnDay(b, day))
    );
  });

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* ── Calendar card ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Calendar size={17} style={{ color: 'var(--brand)' }} className="flex-shrink-0" />
            <span className="font-semibold text-sm md:text-base truncate" style={{ color: 'var(--text)' }}>
              {tituloVista}
            </span>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={hoy} className="btn-ghost text-xs px-2 py-1.5 min-h-[36px]">Hoy</button>
            {/* Vista toggle — desktop only */}
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

        {loading ? (
          <div className="py-12"><PageLoader /></div>
        ) : (
          <>
            {/* ── MOBILE: list view ── */}
            <div className="md:hidden">
              {diasConReservas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--text-2)' }}>
                  <CalendarDays size={36} className="mb-3" style={{ color: 'var(--text-3)' }} />
                  <p className="text-sm">Sin reservas en este periodo</p>
                </div>
              ) : diasConReservas.map((day, i) => {
                const dayReservas  = reservas.filter(r => reservaOverlapsDay(r, day));
                const dayBriefings = briefings.filter(b => briefingOnDay(b, day));
                const today = isToday(day);
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-3"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="w-12 flex-shrink-0 text-center pt-0.5">
                      <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>
                        {DIAS_CORTO[day.getDay()]}
                      </p>
                      <p className="text-xl font-bold leading-tight"
                        style={{ color: today ? 'var(--brand)' : 'var(--text)' }}>
                        {day.getDate()}
                      </p>
                      {today && <div className="w-1.5 h-1.5 rounded-full mx-auto mt-0.5" style={{ background: 'var(--brand)' }} />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1 pt-1">
                      {dayBriefings.map(b => (
                        <BriefingBlock key={`b-${b.id}`} b={b} onClick={(e) => handleBriefingClick(b, e)} />
                      ))}
                      {dayReservas.map(r => (
                        <ReservaBlock key={r.id} r={r}
                          onClick={(e) => handleBlockClick(r, e)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── DESKTOP: calendar grid ── */}
            <div className="hidden md:block">
              {/* Semanal */}
              {vista === 'semanal' && (
                <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
                  {weekDays.map((day, i) => {
                    const dayReservas  = reservas.filter(r => reservaOverlapsDay(r, day));
                    const dayBriefings = briefings.filter(b => briefingOnDay(b, day));
                    const today = isToday(day);
                    return (
                      <div key={i} className="min-h-[220px]"
                        style={{ borderRight: i < 6 ? '1px solid var(--border)' : 'none' }}>
                        <div className="text-center py-3"
                          style={{
                            borderBottom: '1px solid var(--border)',
                            background: today ? 'var(--brand-bg)' : 'transparent',
                          }}>
                          <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{DIAS_SEMANA[i]}</p>
                          <p className="text-lg font-bold mt-0.5"
                            style={{ color: today ? 'var(--brand)' : 'var(--text)' }}>
                            {day.getDate()}
                          </p>
                        </div>
                        <div className="p-1.5 space-y-0.5">
                          {dayBriefings.map(b => (
                            <BriefingBlock key={`b-${b.id}`} b={b} onClick={(e) => handleBriefingClick(b, e)} />
                          ))}
                          {dayReservas.map(r => (
                            <ReservaBlock key={r.id} r={r} onClick={(e) => handleBlockClick(r, e)} />
                          ))}
                          {dayReservas.length === 0 && dayBriefings.length === 0 && (
                            <p className="text-xs text-center pt-4" style={{ color: 'var(--text-3)' }}>—</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mensual */}
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
                      const dayReservas  = reservas.filter(r => reservaOverlapsDay(r, day));
                      const dayBriefings = briefings.filter(b => briefingOnDay(b, day));
                      const today = isToday(day);
                      const isCurrentMonth = day.getMonth() === month;
                      // Presupuesto de 4 slots visibles: briefings primero (máx. 2),
                      // el resto para reservas — así el "+N más" cuenta lo oculto real.
                      const shownBriefings = Math.min(2, dayBriefings.length);
                      const shownReservas  = Math.min(4 - shownBriefings, dayReservas.length);
                      const hidden = (dayBriefings.length - shownBriefings) + (dayReservas.length - shownReservas);
                      return (
                        <div key={i} className="min-h-[130px] p-1.5"
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
                          {dayBriefings.slice(0, shownBriefings).map(b => (
                            <BriefingBlock key={`b-${b.id}`} b={b} onClick={(e) => handleBriefingClick(b, e)} />
                          ))}
                          {dayReservas.slice(0, shownReservas).map(r => (
                            <ReservaBlock key={r.id} r={r} onClick={(e) => handleBlockClick(r, e)} />
                          ))}
                          {hidden > 0 && (
                            <p className="text-xs pl-1" style={{ color: 'var(--text-2)' }}>
                              +{hidden} más
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        <Leyenda />
      </div>

      {/* ── Inline mini-modal ── */}
      {selected && (
        <ReservaModal
          reserva={selected.reserva}
          pos={selected.pos}
          onClose={() => setSelected(null)}
        />
      )}
      {selectedBriefing && (
        <BriefingModal
          briefing={selectedBriefing.briefing}
          pos={selectedBriefing.pos}
          onClose={() => setSelectedBriefing(null)}
        />
      )}
    </div>
  );
}
