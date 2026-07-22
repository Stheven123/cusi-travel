import { AlertTriangle, Clock } from 'lucide-react';
import { fmtFecha } from '../../utils/formatters';

const NIVEL = {
  CRITICO: { bar: '#ef4444', bg: 'rgba(239,68,68,0.10)', text: '#ef4444', label: 'Crítico' },
  URGENTE: { bar: '#f97316', bg: 'rgba(249,115,22,0.10)', text: '#f97316', label: 'Urgente' },
  AVISO:   { bar: '#f59e0b', bg: 'rgba(245,158,11,0.10)', text: '#d97706', label: 'Aviso'   },
};

export default function AlertasPasaportes({ alertas = [] }) {
  if (!alertas.length) return null;

  const criticos = alertas.filter(a => a.nivel_alerta === 'CRITICO').length;
  const urgentes = alertas.filter(a => a.nivel_alerta === 'URGENTE').length;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)' }}>

      {/* Header */}
      <div className="px-4 md:px-6 py-3.5 md:py-5 flex items-center gap-3 md:gap-4"
        style={{ background: 'var(--card-2)', borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(249,115,22,0.12)' }}>
          <AlertTriangle size={15} className="md:hidden" style={{ color: '#f97316' }} />
          <AlertTriangle size={22} className="hidden md:block" style={{ color: '#f97316' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm md:text-lg font-black" style={{ color: 'var(--text)' }}>
            Pasaportes por vencer
          </p>
          <p className="text-xs md:text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            {criticos > 0 && <span style={{ color: '#ef4444' }}>{criticos} crítico{criticos > 1 ? 's' : ''} </span>}
            {urgentes > 0 && <span style={{ color: '#f97316' }}>{urgentes} urgente{urgentes > 1 ? 's' : ''} </span>}
            · {alertas.length} total
          </p>
        </div>
        <div className="flex-shrink-0 w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center text-xs md:text-sm font-black text-white"
          style={{ background: criticos > 0 ? '#ef4444' : '#f97316' }}>
          {alertas.length}
        </div>
      </div>

      {/* Listado */}
      <div>
        {alertas.map((a, idx) => {
          const n = NIVEL[a.nivel_alerta] || NIVEL.AVISO;
          return (
            <div
              key={a.pasajero_id}
              className="flex items-stretch"
              style={{ borderBottom: idx < alertas.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              {/* Barra de color */}
              <div className="w-1 flex-shrink-0" style={{ background: n.bar }} />

              {/* Contenido */}
              <div className="flex-1 px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-5 min-w-0">
                {/* Nombre + pasaporte */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base font-semibold leading-tight" style={{ color: 'var(--text)' }}>
                    {a.apellido}, {a.nombre}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="font-mono text-xs md:text-sm px-1.5 md:px-2 py-0.5 rounded-lg"
                      style={{ background: 'var(--card-2)', color: 'var(--text-2)' }}>
                      {a.pasaporte}
                    </span>
                    <span className="text-xs md:text-sm flex items-center gap-1" style={{ color: 'var(--text-2)' }}>
                      <Clock size={11} />
                      {fmtFecha(a.pasaporte_vencimiento)}
                    </span>
                  </div>
                </div>

                {/* Días restantes */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center rounded-2xl px-3 md:px-5 py-2 md:py-3 min-w-[52px] md:min-w-[70px]"
                  style={{ background: n.bg }}>
                  <p className="text-lg md:text-2xl font-black leading-none tabular-nums" style={{ color: n.text }}>
                    {a.dias_para_vencer}
                  </p>
                  <p className="text-[10px] md:text-xs font-bold mt-0.5" style={{ color: n.text }}>días</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
