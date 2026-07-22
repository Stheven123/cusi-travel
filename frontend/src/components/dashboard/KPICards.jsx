import {
  CalendarRange, TrendingUp, TrendingDown,
  AlertTriangle, Clock, BarChart3, Wallet, CheckCircle, Activity,
  Globe, MapPin, Users, XCircle,
} from 'lucide-react';
import { fmtMoneda, fmtNumero } from '../../utils/formatters';

/* ── Card principal (accent azul) ─────────────────────────── */
function KpiHero({ label, value, icon: Icon, sub, extra }) {
  return (
    <div
      className="rounded-2xl p-5 md:p-7 flex flex-col gap-3 col-span-2 md:col-span-1 md:row-span-2"
      style={{
        background: 'linear-gradient(145deg, #4361ee 0%, #2937b0 100%)',
        boxShadow: '0 8px 32px rgba(67,97,238,0.30), 0 2px 8px rgba(67,97,238,0.20)',
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-white/70">{label}</p>
        <span className="w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <Icon size={16} className="md:hidden text-white" />
          <Icon size={22} className="hidden md:block text-white" />
        </span>
      </div>
      <div>
        <p className="text-lg sm:text-2xl md:text-3xl xl:text-4xl font-black tabular-nums text-white leading-none whitespace-nowrap">{value}</p>
        {sub && <p className="text-xs md:text-sm text-white/55 mt-1.5 md:mt-2 leading-tight">{sub}</p>}
      </div>
      {extra && (
        <div className="mt-auto pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <p className="text-xs text-white/60">{extra}</p>
        </div>
      )}
    </div>
  );
}

/* ── Card secundaria ───────────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, warn = false, sub, tinted = false }) {
  const iconBg  = warn ? 'rgba(245,101,101,0.10)' : 'var(--brand-bg)';
  const iconClr = warn ? '#f56565' : 'var(--brand)';
  const valClr  = warn ? '#f56565' : 'var(--text)';

  return (
    <div
      className="rounded-2xl p-4 md:p-6 flex flex-col gap-2.5 md:gap-4"
      style={{
        background: 'var(--card)',
        boxShadow: tinted ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs md:text-sm font-bold uppercase tracking-wider leading-tight" style={{ color: 'var(--text-2)' }}>{label}</p>
        <span className="w-8 h-8 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}>
          <Icon size={14} className="md:hidden" style={{ color: iconClr }} />
          <Icon size={20} className="hidden md:block" style={{ color: iconClr }} />
        </span>
      </div>
      <p className="text-sm sm:text-xl md:text-2xl xl:text-3xl font-black leading-none tabular-nums whitespace-nowrap" style={{ color: valClr }}>{value}</p>
      {sub && <p className="text-xs md:text-sm leading-tight" style={{ color: 'var(--text-3)' }}>{sub}</p>}
    </div>
  );
}

/* ── Separador de sección ──────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 col-span-full">
      <div className="w-1 md:w-1.5 h-5 md:h-6 rounded-full" style={{ background: 'var(--brand)' }} />
      <p className="text-xs md:text-sm font-black uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>{children}</p>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, var(--border), transparent)' }} />
    </div>
  );
}

/* ── Skeleton ──────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      {[0, 1, 2, 3].map(g => (
        <div key={g}>
          <div className="h-3 rounded-full w-24 mb-3 animate-pulse" style={{ background: 'var(--border)' }} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-4 md:p-6 animate-pulse min-h-[90px] md:min-h-[130px]"
                style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="h-3 rounded w-3/4 mb-3" style={{ background: 'var(--card-2)' }} />
                <div className="h-7 rounded w-1/2" style={{ background: 'var(--card-2)' }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Componente principal ──────────────────────────────────── */
export default function KPICards({ data }) {
  if (!data) return <Skeleton />;

  const ticketPromedio = data.ticket_promedio_mes ?? 0;
  const tasaCobro = data.ingreso_mes > 0
    ? Math.round((Number(data.adelanto_mes) / Number(data.ingreso_mes)) * 100)
    : 0;
  const haySaldo      = Number(data.saldo_total_pendiente) > 0;
  const hayAlertas    = Number(data.alertas_pasaportes_criticas) > 0;
  const hayProx       = Number(data.proximas_7_dias) > 0;
  const hayCanceladas = Number(data.reservas_canceladas_mes) > 0;

  return (
    <div className="space-y-4 md:space-y-7">

      {/* ══ Resultados del mes ══ */}
      <div>
        <SectionLabel>Resultados del mes</SectionLabel>
        <div className="mt-3 md:mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <KpiHero
            label="Ingreso bruto"
            value={fmtMoneda(data.ingreso_mes)}
            icon={TrendingUp}
            sub={`${data.reservas_mes ?? 0} reservas facturadas este mes`}
            extra={`Ticket promedio: ${fmtMoneda(ticketPromedio)}`}
          />
          <KpiCard label="Total cobrado"    value={fmtMoneda(data.adelanto_mes)}           icon={CheckCircle} sub={`${tasaCobro}% del ingreso bruto`} tinted />
          <KpiCard label="Saldo por cobrar" value={fmtMoneda(data.saldo_total_pendiente)}  icon={Wallet}      warn={haySaldo} sub="Reservas activas pendientes" />
          <KpiCard label="Ticket promedio"  value={fmtMoneda(ticketPromedio)}              icon={BarChart3}   sub="Por reserva este mes" />
        </div>
      </div>

      {/* ══ Operaciones ══ */}
      <div>
        <SectionLabel>Operaciones</SectionLabel>
        <div className="mt-3 md:mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <KpiCard label="Reservas este mes"  value={data.reservas_mes     ?? '—'} icon={CalendarRange} sub={`${data.pax_mes ?? 0} pasajeros`} tinted />
          <KpiCard label="Reservas activas"   value={data.reservas_activas ?? '—'} icon={Activity}     sub="Cotizaciones + confirmadas" />
          <KpiCard label="Próximas 7 días"    value={data.proximas_7_dias  ?? '—'} icon={Clock}        warn={hayProx}    sub="Servicios por ejecutar" />
          <KpiCard label="Alertas pasaportes" value={data.alertas_pasaportes_criticas ?? 0} icon={AlertTriangle} warn={hayAlertas} sub="Vencen en < 90 días" />
        </div>
      </div>

      {/* ══ Anual ══ */}
      <div>
        <SectionLabel>Anual</SectionLabel>
        <div className="mt-3 md:mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <KpiCard
            label="Ingreso año"
            value={data.ingreso_ano != null ? fmtMoneda(data.ingreso_ano) : '—'}
            icon={TrendingUp}
            sub="Facturación acumulada"
            tinted
          />
          <KpiCard
            label="PAX total año"
            value={data.pax_total_ano != null ? fmtNumero(data.pax_total_ano) : '—'}
            icon={Users}
            sub="Pasajeros atendidos"
          />
          {data.destino_top ? (
            <KpiCard
              label="Destino top"
              value={data.destino_top}
              icon={MapPin}
              sub="Servicio más demandado"
            />
          ) : <div />}
          {data.idioma_top ? (
            <KpiCard
              label="Idioma top"
              value={data.idioma_top}
              icon={Globe}
              sub="Idioma más solicitado"
            />
          ) : <div />}
        </div>
      </div>

      {/* ══ Conversión ══ */}
      <div>
        <SectionLabel>Conversión</SectionLabel>
        <div className="mt-3 md:mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <KpiCard
            label="Tasa conversión"
            value={data.tasa_conversion_pct != null ? `${data.tasa_conversion_pct}%` : '—'}
            icon={TrendingUp}
            sub="Cotización → Reservado"
            tinted
          />
          <KpiCard
            label="Cancelaciones mes"
            value={data.reservas_canceladas_mes ?? '—'}
            icon={XCircle}
            warn={hayCanceladas}
            sub="Reservas canceladas"
          />
          <KpiCard
            label="Tasa de cobro"
            value={`${tasaCobro}%`}
            icon={TrendingDown}
            sub="Adelantado vs. total"
          />
        </div>
      </div>

    </div>
  );
}
