import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { PrioridadBadge } from '../ui/Badge';
import { fmtFecha } from '../../utils/formatters';

export default function TareasWidget({ tareas = [], onCompletar, onVerTodas }) {
  const activas = tareas.filter(t => t.estado !== 'COMPLETADA' && t.estado !== 'CANCELADA');
  return (
    <div className="card flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-brand-600" />
          <span className="font-semibold text-gray-900">Mis Tareas</span>
          {activas.length > 0 && (
            <span className="bg-brand-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{activas.length}</span>
          )}
        </div>
        <button onClick={onVerTodas} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Ver todas</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <CheckCircle2 size={32} className="mb-2 text-green-300" />
            <p className="text-sm">Sin tareas pendientes</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {activas.map(t => {
              const vencida = t.fecha_vencimiento && new Date(t.fecha_vencimiento) < new Date();
              return (
                <li key={t.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {t.prioridad === 'URGENTE' && <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />}
                        <p className="text-sm font-medium text-gray-800 truncate">{t.titulo}</p>
                      </div>
                      {t.codigo_reserva && (
                        <p className="text-xs text-gray-400">→ {t.codigo_reserva}</p>
                      )}
                      {t.fecha_vencimiento && (
                        <p className={`text-xs mt-0.5 ${vencida ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                          {vencida ? '⚠ Vencida: ' : 'Vence: '}{fmtFecha(t.fecha_vencimiento)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <PrioridadBadge prioridad={t.prioridad} />
                      <button onClick={() => onCompletar(t.id)}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap">
                        Completar
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
