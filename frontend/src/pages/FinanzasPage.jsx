import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingDown, AlertCircle, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reportesApi } from '../api/reportes.api';
import { reservasApi } from '../api/reservas.api';
import { EstadoOpBadge, EstadoPagoBadge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import { fmtMoneda, fmtFecha, localDateFromDateOnly } from '../utils/formatters';

/* ── Finance KPI card ─────────────────────────────────────────── */
function FinKpiCard({ label, value, icon: Icon, color, sub, warn }) {
  const clr = warn ? '#ef4444' : (color || 'var(--brand)');
  return (
    <div className="rounded-2xl p-5 md:p-8 flex flex-col gap-3 md:gap-4 overflow-hidden"
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs md:text-sm font-bold uppercase tracking-wider leading-tight min-w-0" style={{ color: 'var(--text-2)' }}>
          {label}
        </p>
        <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${clr}22` }}>
          <Icon size={15} className="md:hidden" style={{ color: clr }} />
          <Icon size={22} className="hidden md:block" style={{ color: clr }} />
        </div>
      </div>
      <p className="text-xl md:text-2xl xl:text-3xl font-black leading-none tabular-nums break-words" style={{ color: warn ? '#ef4444' : 'var(--text)' }}>
        {value}
      </p>
      {sub && <p className="text-xs md:text-sm leading-tight" style={{ color: 'var(--text-3)' }}>{sub}</p>}
    </div>
  );
}

/* ── Reserva finance row ──────────────────────────────────────── */
function ReservaFinRow({ r, onClick }) {
  const saldo = Number(r.saldo_usd);
  const stripe = saldo > 0 ? '#ef4444' : '#10b981';
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 md:gap-4 py-3 md:py-5 px-4 md:px-6 relative overflow-hidden text-left cursor-pointer hover:opacity-90 transition-opacity"
      style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: stripe }} />
      <div className="pl-3 md:pl-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-mono font-bold text-xs md:text-sm" style={{ color: 'var(--brand)' }}>{r.codigo_reserva}</p>
          <EstadoOpBadge estado={r.estado_operacion} />
          <EstadoPagoBadge estado={r.estado_pago} />
        </div>
        <p className="text-sm md:text-base font-semibold mt-0.5 truncate" style={{ color: 'var(--text)' }}>
          {r.servicio_nombre || r.nombre_servicio_snap || '—'}
        </p>
        <div className="flex flex-wrap gap-x-4 mt-0.5 text-xs md:text-sm" style={{ color: 'var(--text-2)' }}>
          {r.agencia_nombre && <span>{r.agencia_nombre}</span>}
          <span className="flex items-center gap-1"><Calendar size={10} />{fmtFecha(r.fecha_inicio)}</span>
          <span>{r.n_pasajeros} pax</span>
        </div>
      </div>
      <div className="flex-shrink-0 text-right max-w-[40%]">
        <p className="font-black text-sm md:text-xl break-words" style={{ color: saldo > 0 ? '#dc2626' : '#059669' }}>
          {fmtMoneda(saldo)}
        </p>
        <p className="text-xs md:text-sm" style={{ color: 'var(--text-3)' }}>saldo</p>
      </div>
      <ChevronRight size={14} className="md:hidden" style={{ color: 'var(--text-3)' }} />
      <ChevronRight size={18} className="hidden md:block flex-shrink-0" style={{ color: 'var(--text-3)' }} />
    </button>
  );
}

/* ── Section header ────────────────────────────────────────────── */
function SectionHeader({ title, count, color }) {
  return (
    <div className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-5"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--card-2)' }}>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <p className="font-bold text-sm md:text-base" style={{ color: 'var(--text)' }}>{title}</p>
      {count !== undefined && (
        <span className="text-xs md:text-sm px-2 md:px-3 py-0.5 rounded-full font-semibold ml-auto"
          style={{ background: `${color}22`, color }}>
          {count}
        </span>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function FinanzasPage() {
  const navigate = useNavigate();
  const [kpis, setKpis]           = useState(null);
  const [parciales, setParciales] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [k, par, pen] = await Promise.allSettled([
        reportesApi.getKPIs(),
        reservasApi.getAll({ estado_pago: 'PARCIAL' }),
        reservasApi.getAll({ estado_pago: 'PENDIENTE' }),
      ]);
      if (k.status   === 'fulfilled') setKpis(k.value.data);
      if (par.status === 'fulfilled') setParciales(par.value.data || []);
      if (pen.status === 'fulfilled') setPendientes(pen.value.data || []);
    } catch { setError('Error al cargar datos financieros'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Cobros del mes: reservas with adelanto > 0 in current month
  const thisMonth = new Date().getMonth();
  const thisYear  = new Date().getFullYear();
  const cobrosDelMes = [...parciales, ...pendientes].filter(r => {
    if (!Number(r.adelanto_usd)) return false;
    const d = localDateFromDateOnly(r.fecha_inicio);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  // All with saldo > 0
  const porCobrar = [...pendientes, ...parciales]
    .filter(r => Number(r.saldo_usd) > 0)
    .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));

  const totalPorCobrar = porCobrar.reduce((s, r) => s + Number(r.saldo_usd), 0);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5 md:space-y-7">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        <FinKpiCard
          label="Cobrado este mes"
          value={fmtMoneda(kpis?.adelanto_mes)}
          icon={DollarSign}
          color="#10b981"
          sub={`${kpis?.reservas_mes ?? 0} reservas facturadas`}
        />
        <FinKpiCard
          label="Saldo por cobrar"
          value={fmtMoneda(totalPorCobrar)}
          icon={TrendingDown}
          warn={totalPorCobrar > 0}
          sub={`${porCobrar.length} reservas con saldo pendiente`}
        />
        <FinKpiCard
          label="Sin cobrar"
          value={pendientes.length}
          icon={AlertCircle}
          color="#f59e0b"
          sub="Reservas con pago pendiente"
          warn={pendientes.length > 0}
        />
      </div>

      {/* ── Por cobrar ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <SectionHeader title="Por cobrar" count={porCobrar.length} color="#ef4444" />
        {porCobrar.length === 0 ? (
          <div className="py-10 text-center">
            <DollarSign size={32} className="mx-auto mb-2" style={{ color: 'var(--text-3)' }} />
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>Sin saldos pendientes</p>
          </div>
        ) : (
          <div>
            {porCobrar.map(r => (
              <ReservaFinRow key={r.id} r={r} onClick={() => navigate(`/reservas/${r.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Cobros del mes ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <SectionHeader title="Cobros del mes" count={cobrosDelMes.length} color="#10b981" />
        {cobrosDelMes.length === 0 ? (
          <div className="py-10 text-center">
            <DollarSign size={32} className="mx-auto mb-2" style={{ color: 'var(--text-3)' }} />
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>Sin cobros registrados este mes</p>
          </div>
        ) : (
          <div>
            {cobrosDelMes.map(r => {
              const adelanto = Number(r.adelanto_usd);
              return (
                <button key={r.id} onClick={() => navigate(`/reservas/${r.id}`)}
                  className="w-full flex items-center gap-3 py-3 px-4 relative overflow-hidden text-left cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: '#10b981' }} />
                  <div className="pl-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-xs" style={{ color: 'var(--brand)' }}>{r.codigo_reserva}</p>
                      <EstadoPagoBadge estado={r.estado_pago} />
                    </div>
                    <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: 'var(--text)' }}>
                      {r.servicio_nombre || r.nombre_servicio_snap || '—'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                      {r.agencia_nombre || '—'} · {fmtFecha(r.fecha_inicio)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="font-black text-sm" style={{ color: '#059669' }}>{fmtMoneda(adelanto)}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>adelanto</p>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-3)' }} className="flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
