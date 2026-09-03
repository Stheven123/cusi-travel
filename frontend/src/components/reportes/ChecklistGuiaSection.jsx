import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, User, Clock, ClipboardList } from 'lucide-react';
import { proveedoresApi } from '../../api/proveedores.api';
import Alert from '../ui/Alert';
import { PageLoader } from '../ui/Spinner';
import { fmtMoneda, fmtFecha } from '../../utils/formatters';

// Checklist consolidado de las tareas de las operaciones de tipo GUIA de
// todas las reservas (confirmación, reconfirmación, entrega de equipo,
// comprobantes, pago...), agrupado por reserva/guía asignado.
export default function ChecklistGuiaSection() {
  const [tareas, setTareas] = useState(null);
  const [error, setError]   = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const r = await proveedoresApi.getAllTareasOperacion({ tipo_servicio: 'GUIA' });
      setTareas(r.data || []);
    } catch { setError('No se pudo cargar el checklist de guías'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (t) => {
    setTareas(prev => prev.map(x => x.id === t.id ? { ...x, completada: !t.completada } : x));
    try { await proveedoresApi.updateTareaOperacion(t.id, { completada: !t.completada }); }
    catch { load(); }
  };

  if (tareas === null) return <PageLoader />;

  const grupos = [];
  const porReserva = new Map();
  tareas.forEach(t => {
    if (!porReserva.has(t.reserva_id)) {
      const grupo = { reserva_id: t.reserva_id, codigo_reserva: t.codigo_reserva, agencia_nombre: t.agencia_nombre, guia_asignado_nombre: t.guia_asignado_nombre, tareas: [] };
      porReserva.set(t.reserva_id, grupo);
      grupos.push(grupo);
    }
    porReserva.get(t.reserva_id).tareas.push(t);
  });

  return (
    <div className="space-y-5">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="rounded-2xl p-6 flex items-center gap-5"
        style={{ background: 'linear-gradient(135deg, #0C2350 0%, #1A4080 100%)', color: 'white' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          <ClipboardList size={28} />
        </div>
        <div>
          <h2 className="font-bold text-lg">Checklist de guía asignado</h2>
          <p className="text-white/70 text-sm mt-0.5">
            Tareas de confirmación, entrega de equipo, comprobantes y pago de cada operación de tipo GUIA, por reserva.
          </p>
        </div>
      </div>

      {grupos.length === 0 ? (
        <div className="rounded-2xl p-16 flex flex-col items-center justify-center"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <ClipboardList size={40} className="mb-3" style={{ color: 'var(--text-3)', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>Sin tareas de guía registradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map(g => {
            const pendientes = g.tareas.filter(t => !t.completada).length;
            return (
              <div key={g.reserva_id} className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex items-center flex-wrap gap-2 px-4 py-3"
                  style={{ background: 'var(--card-2)', borderBottom: '1px solid var(--border)' }}>
                  <button onClick={() => navigate(`/reservas/${g.reserva_id}`)}
                    className="font-mono font-bold text-sm hover:underline cursor-pointer" style={{ color: 'var(--brand)' }}>
                    {g.codigo_reserva}
                  </button>
                  {g.agencia_nombre && <span className="text-xs" style={{ color: 'var(--text-3)' }}>{g.agencia_nombre}</span>}
                  {g.guia_asignado_nombre?.trim() && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--brand-bg)', color: 'var(--brand)' }}>
                      <User size={11} /> {g.guia_asignado_nombre}
                    </span>
                  )}
                  <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: pendientes ? '#f59e0b22' : '#10b98122', color: pendientes ? '#f59e0b' : '#10b981' }}>
                    {pendientes ? `${pendientes} pendiente${pendientes !== 1 ? 's' : ''}` : 'Completo'}
                  </span>
                </div>
                <div className="p-2 space-y-1.5" style={{ background: 'var(--card)' }}>
                  {g.tareas.map(t => (
                    <div key={t.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${t.completada ? 'opacity-55' : ''}`}
                      style={{ background: 'var(--card-2)' }}>
                      <button onClick={() => toggle(t)} className="flex-shrink-0 cursor-pointer"
                        style={{ color: t.completada ? '#10b981' : 'var(--text-3)' }} title="Marcar completada">
                        {t.completada ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                      </button>
                      <span className={`flex-1 min-w-0 truncate text-xs font-semibold ${t.completada ? 'line-through' : ''}`}
                        style={{ color: 'var(--text)' }}>
                        {t.titulo}
                      </span>
                      {t.proveedor_nombre && <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-3)' }}>{t.proveedor_nombre}</span>}
                      {t.persona_encargada && (
                        <span className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--text-2)' }}>
                          <User size={10} />{t.persona_encargada}
                        </span>
                      )}
                      {t.fecha && (
                        <span className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--text-2)' }}>
                          <Clock size={10} />{fmtFecha(t.fecha)}
                        </span>
                      )}
                      {t.monto != null && (
                        <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--text)' }}>{fmtMoneda(t.monto)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
