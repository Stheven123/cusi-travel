import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, RefreshCw, CalendarDays, Wallet, TrendingUp,
} from 'lucide-react';
import { reservasApi } from '../api/reservas.api';
import { EstadoOpBadge, EstadoPagoBadge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import ReservaForm from '../components/reservas/ReservaForm';
import { fmtFecha, fmtMoneda, fmtMonedaCorta } from '../utils/formatters';
import { ESTADOS_OPERACION, ESTADOS_PAGO } from '../utils/constants';

const STATUS_CLR = {
  COTIZACION:            '#8892aa',
  RESERVADO:             '#4361ee',
  SERVICIO_COMPLETO:     '#10b981',
  PENDIENTE:             '#f59e0b',
  ANULADO_SIN_PENALIDAD: '#f97316',
  ANULADO_CON_PENALIDAD: '#ef4444',
};

// ── Fila unificada para cualquier pantalla ────────────────────
function ReservaRow({ r, onClick }) {
  const color = STATUS_CLR[r.estado_operacion] || '#8892aa';
  const saldo = Number(r.saldo_usd);

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-stretch transition-all group"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {/* Stripe de color */}
      <div className="w-1 flex-shrink-0" style={{ background: color, minHeight: 64 }} />

      <div
        className="flex-1 px-4 py-3 min-w-0 group-hover:bg-[var(--brand-bg)]"
        style={{ transition: 'background 0.15s' }}
      >
        {/* Fila 1: código */}
        <span className="font-mono font-bold text-xs" style={{ color: 'var(--brand)' }}>
          {r.codigo_reserva}
        </span>

        {/* Fila 2: nombre del tour */}
        <p className="text-sm font-semibold leading-snug mt-0.5" style={{ color: 'var(--text)' }}>
          {r.servicio_nombre || r.nombre_servicio_snap || '—'}
        </p>

        {/* Fila 3: meta-info */}
        <div className="flex items-center gap-2 mt-1 text-xs flex-wrap" style={{ color: 'var(--text-2)' }}>
          <span>{fmtFecha(r.fecha_inicio)}</span>
          <span>·</span>
          <span>{r.n_pasajeros} pax</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">{r.agencia_nombre || '—'}</span>
        </div>

        {/* Fila 4: saldo + pagado */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {saldo !== 0 && (
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md"
                style={{
                  background: saldo > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                  color:      saldo > 0 ? '#ef4444'              : '#10b981',
                }}
              >
                Saldo
              </span>
              <span className="text-sm font-black tabular-nums"
                style={{ color: saldo > 0 ? '#ef4444' : '#10b981' }}>
                {fmtMoneda(Math.abs(saldo))}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(67,97,238,0.10)', color: '#4361ee' }}
            >
              Pagado
            </span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
              {fmtMoneda(Number(r.total_usd) - saldo)}
            </span>
          </div>
        </div>

        {/* Fila 5: badges */}
        <div className="flex items-center gap-2 mt-2">
          <EstadoOpBadge estado={r.estado_operacion} />
          <EstadoPagoBadge estado={r.estado_pago} />
        </div>
      </div>
    </button>
  );
}

export default function ReservasPage() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(false);
  const [filtros, setFiltros]   = useState({
    busqueda: '', estado_operacion: '', estado_pago: '',
    fecha_desde: '', fecha_hasta: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtros.busqueda)         params.busqueda         = filtros.busqueda;
      if (filtros.estado_operacion) params.estado_operacion = filtros.estado_operacion;
      if (filtros.estado_pago)      params.estado_pago      = filtros.estado_pago;
      if (filtros.fecha_desde)      params.fecha_desde      = filtros.fecha_desde;
      if (filtros.fecha_hasta)      params.fecha_hasta      = filtros.fecha_hasta;
      const res = await reservasApi.getAll(params);
      setReservas(res.data || []);
    } catch { setError('Error al cargar reservas'); }
    finally { setLoading(false); }
  }, [filtros]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    await reservasApi.create(data);
    setModal(false);
    load();
  };

  const limpiarFiltros = () => setFiltros({
    busqueda: '', estado_operacion: '', estado_pago: '',
    fecha_desde: '', fecha_hasta: '',
  });

  const totalSaldo = reservas.reduce((a, r) => a + Number(r.saldo_usd || 0), 0);
  const totalMonto = reservas.reduce((a, r) => a + Number(r.total_usd || 0), 0);
  const activas    = reservas.filter(r =>
    r.estado_operacion === 'RESERVADO' || r.estado_operacion === 'COTIZACION'
  ).length;

  const compacto = (n) => {
    const v = Number(n);
    if (!v && v !== 0) return '—';
    if (Math.abs(v) >= 10000) return `$${Math.round(v / 1000)}K`;
    if (Math.abs(v) >= 1000)  return `$${(v / 1000).toFixed(1)}K`;
    return `$${Math.round(v)}`;
  };

  const hayFiltros = filtros.busqueda || filtros.estado_operacion || filtros.estado_pago
    || filtros.fecha_desde || filtros.fecha_hasta;

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* ── KPI strip ── */}

      {/* Móvil: una sola card dividida en 3 secciones */}
      <div className="sm:hidden rounded-2xl overflow-hidden" style={{ boxShadow: '0 6px 20px rgba(67,97,238,0.18)' }}>
        <div className="flex">
          {/* Activas */}
          <div className="flex-1 min-w-0 flex flex-col items-center justify-center py-4 px-2"
            style={{ background: 'linear-gradient(135deg,#4361ee,#2937b0)' }}>
            <p className="text-[10px] font-semibold text-white/60 mb-1">Activas</p>
            <p className="font-black text-2xl text-white leading-none">{activas}</p>
          </div>
          {/* Total */}
          <div className="flex-1 min-w-0 flex flex-col items-center justify-center py-3 px-2"
            style={{ background: 'var(--card)', borderLeft: '1px solid var(--border)' }}>
            <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Total</p>
            <p className="font-black text-xs leading-tight text-center tabular-nums break-words" style={{ color: 'var(--text)' }}>
              {fmtMoneda(totalMonto)}
            </p>
          </div>
          {/* Saldo */}
          <div className="flex-1 min-w-0 flex flex-col items-center justify-center py-3 px-2"
            style={{ background: 'var(--card)', borderLeft: '1px solid var(--border)' }}>
            <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Saldo</p>
            <p className="font-black text-xs leading-tight text-center tabular-nums break-words"
              style={{ color: totalSaldo > 0 ? '#f56565' : 'var(--text)' }}>
              {fmtMoneda(totalSaldo)}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop (sm+): 3 tarjetas separadas */}
      <div className="hidden sm:grid grid-cols-3 gap-3">
        <div className="rounded-2xl px-4 md:px-6 py-4 md:py-5 flex items-center gap-3 md:gap-4"
          style={{ background: 'linear-gradient(135deg,#4361ee,#2937b0)', boxShadow: '0 6px 20px rgba(67,97,238,0.28)' }}>
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.18)' }}>
            <CalendarDays size={17} className="text-white" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-white/60 leading-tight">Activas</p>
            <p className="font-black text-xl md:text-3xl text-white">{activas}</p>
          </div>
        </div>

        <div className="rounded-2xl px-4 md:px-6 py-4 md:py-5 flex items-center gap-3 md:gap-4"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)' }}>
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand-bg)' }}>
            <TrendingUp size={17} style={{ color: 'var(--brand)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm leading-tight" style={{ color: 'var(--text-3)' }}>Total</p>
            <p className="font-black text-lg md:text-xl xl:text-2xl leading-tight break-words" style={{ color: 'var(--text)' }}>
              {fmtMoneda(totalMonto)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl px-4 md:px-6 py-4 md:py-5 flex items-center gap-3 md:gap-4"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)' }}>
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: totalSaldo > 0 ? 'rgba(245,101,101,0.10)' : 'var(--brand-bg)' }}>
            <Wallet size={17} style={{ color: totalSaldo > 0 ? '#f56565' : 'var(--brand)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm leading-tight" style={{ color: 'var(--text-3)' }}>Saldo</p>
            <p className="font-black text-lg md:text-xl xl:text-2xl leading-tight break-words"
              style={{ color: totalSaldo > 0 ? '#f56565' : 'var(--text)' }}>
              {fmtMoneda(totalSaldo)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)' }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <label className="label">Búsqueda</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
              <input
                className="input-field pl-9"
                placeholder="Código, agencia, servicio..."
                value={filtros.busqueda}
                onChange={e => setFiltros(p => ({ ...p, busqueda: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">Estado op.</label>
            <select className="input-field" value={filtros.estado_operacion}
              onChange={e => setFiltros(p => ({ ...p, estado_operacion: e.target.value }))}>
              <option value="">Todos</option>
              {ESTADOS_OPERACION.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Estado pago</label>
            <select className="input-field" value={filtros.estado_pago}
              onChange={e => setFiltros(p => ({ ...p, estado_pago: e.target.value }))}>
              <option value="">Todos</option>
              {ESTADOS_PAGO.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Desde</label>
            <input type="date" className="input-field" value={filtros.fecha_desde}
              onChange={e => setFiltros(p => ({ ...p, fecha_desde: e.target.value }))} />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input type="date" className="input-field" value={filtros.fecha_hasta}
              onChange={e => setFiltros(p => ({ ...p, fecha_hasta: e.target.value }))} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3"
          style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <button onClick={load} className="btn-secondary gap-1.5 text-sm">
              <RefreshCw size={14} /> Actualizar
            </button>
            {hayFiltros && (
              <button onClick={limpiarFiltros} className="btn-ghost text-sm">
                Limpiar filtros
              </button>
            )}
          </div>
          <button onClick={() => setModal(true)} className="btn-primary gap-1.5 text-sm">
            <Plus size={15} /> Nueva reserva
          </button>
        </div>
      </div>

      {/* ── Lista unificada ── */}
      {loading ? <PageLoader /> : reservas.length === 0 ? (
        <div className="rounded-2xl text-center py-16" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
          <CalendarDays size={36} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
            Sin reservas que coincidan con los filtros
          </p>
          {hayFiltros && (
            <button onClick={limpiarFiltros} className="mt-3 text-xs hover:underline" style={{ color: 'var(--brand)' }}>
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)' }}>
          {/* Header de columnas — solo visible en sm+ */}
          <div className="hidden sm:flex items-center px-4 py-2.5"
            style={{ background: 'var(--card-2)', borderBottom: '1px solid var(--border)' }}>
            <div className="w-1 flex-shrink-0 mr-4" />
            <div className="flex-1 grid grid-cols-[1fr_auto] gap-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>
                Reserva / Servicio
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-2)' }}>
                Total · Saldo
              </span>
            </div>
          </div>

          {/* Filas */}
          <div>
            {reservas.map(r => (
              <ReservaRow
                key={r.id}
                r={r}
                onClick={() => navigate(`/reservas/${r.id}`)}
              />
            ))}
          </div>

        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva reserva" size="xl">
        <ReservaForm onSave={handleSave} onCancel={() => setModal(false)} />
      </Modal>
    </div>
  );
}
