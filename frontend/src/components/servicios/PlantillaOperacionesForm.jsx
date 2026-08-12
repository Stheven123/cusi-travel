import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';

const TIPOS = ['HOTEL','TRANSPORTE','RESTAURANTE','GUIA','AEROLINEA','TREN','OPERADOR_LOCAL','SEGURO','ACTIVIDAD','COCINERO','PORTER','OTRO','INGRESOS'];

const OP_VACIA = () => ({
  tipo_servicio: '', proveedor_id: '', descripcion: '',
  cantidad: 1, costo_unitario_usd: '', moneda: 'USD', tareas: [],
});

export default function PlantillaOperacionesForm({ operaciones = [], proveedores = [], onChange }) {
  const [expanded, setExpanded] = useState({});
  const [nuevaTarea, setNuevaTarea] = useState({});

  const handleAdd = () => {
    onChange([...operaciones, OP_VACIA()]);
    setExpanded(p => ({ ...p, [operaciones.length]: true }));
  };

  const handleRemove = (idx) => onChange(operaciones.filter((_, i) => i !== idx));
  const handleChange = (idx, field, value) =>
    onChange(operaciones.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  const toggle = (idx) => setExpanded(p => ({ ...p, [idx]: !p[idx] }));

  const addTarea = (idx) => {
    const titulo = (nuevaTarea[idx] || '').trim();
    if (!titulo) return;
    const op = operaciones[idx];
    handleChange(idx, 'tareas', [...(op.tareas || []), { titulo }]);
    setNuevaTarea(p => ({ ...p, [idx]: '' }));
  };
  const removeTarea = (idx, tIdx) => {
    const op = operaciones[idx];
    handleChange(idx, 'tareas', op.tareas.filter((_, i) => i !== tIdx));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
        Cada operación que agregues aquí se creará automáticamente (con su checklist) cuando alguien
        haga una reserva nueva usando este paquete — así el equipo no tiene que armarla desde cero cada vez.
      </p>
      {operaciones.map((op, idx) => {
        const esIngreso = op.tipo_servicio === 'INGRESOS';
        const proveedoresFiltrados = op.tipo_servicio ? proveedores.filter(p => p.tipo === op.tipo_servicio) : proveedores;
        return (
          <div key={idx} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" style={{ background: 'var(--card-2)' }} onClick={() => toggle(idx)}>
              <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0" style={{ background: 'var(--brand-bg)', color: 'var(--brand)' }}>
                {op.tipo_servicio || '—'}
              </span>
              <p className="flex-1 text-sm truncate" style={{ color: 'var(--text)' }}>
                {op.descripcion || <span style={{ color: 'var(--text-3)' }}>Operación {idx + 1} sin descripción</span>}
              </p>
              <button type="button" onClick={e => { e.stopPropagation(); handleRemove(idx); }} style={{ color: '#ef4444' }}>
                <Trash2 size={14} />
              </button>
              {expanded[idx] ? <ChevronUp size={16} style={{ color: 'var(--text-3)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-3)' }} />}
            </div>

            {expanded[idx] && (
              <div className="p-4 space-y-3" style={{ background: 'var(--card)' }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Tipo de operación <span style={{ color: '#ef4444' }}>*</span></label>
                    <select className="input-field" value={op.tipo_servicio}
                      onChange={e => handleChange(idx, 'tipo_servicio', e.target.value)}>
                      <option value="">— Selecciona —</option>
                      {TIPOS.map(t => <option key={t} value={t}>{t === 'INGRESOS' ? 'INGRESOS (sin proveedor)' : t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Proveedor {!esIngreso && <span style={{ color: '#ef4444' }}>*</span>}{esIngreso && '(opcional)'}</label>
                    <select className="input-field" value={op.proveedor_id} onChange={e => handleChange(idx, 'proveedor_id', e.target.value)}>
                      <option value="">{esIngreso ? '— Sin proveedor —' : '— Selecciona —'}</option>
                      {proveedoresFiltrados.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Descripción</label>
                  <input className="input-field" value={op.descripcion}
                    onChange={e => handleChange(idx, 'descripcion', e.target.value)} placeholder="Ej: Guía principal del trek" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">Cantidad</label>
                    <input type="number" min="1" className="input-field" value={op.cantidad}
                      onChange={e => handleChange(idx, 'cantidad', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Costo unitario</label>
                    <input type="number" min="0" step="0.01" className="input-field" value={op.costo_unitario_usd}
                      onChange={e => handleChange(idx, 'costo_unitario_usd', e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="label">Moneda</label>
                    <select className="input-field" value={op.moneda} onChange={e => handleChange(idx, 'moneda', e.target.value)}>
                      <option value="USD">USD $</option>
                      <option value="PEN">PEN S/</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2" style={{ borderTop: '1px dashed var(--border)' }}>
                  <label className="label">
                    Checklist de tareas {op.tipo_servicio === 'GUIA' && (!op.tareas || !op.tareas.length) && (
                      <span className="font-normal" style={{ color: 'var(--text-3)' }}>(si lo dejas vacío, se usa el checklist estándar de guía)</span>
                    )}
                  </label>
                  <div className="space-y-1.5 mt-1">
                    {(op.tareas || []).map((t, tIdx) => (
                      <div key={tIdx} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg" style={{ background: 'var(--card-2)' }}>
                        <span className="flex-1" style={{ color: 'var(--text)' }}>{t.titulo}</span>
                        <button type="button" onClick={() => removeTarea(idx, tIdx)} style={{ color: '#ef4444' }}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input className="input-field text-xs flex-1" placeholder="Nueva tarea del checklist..."
                        value={nuevaTarea[idx] || ''}
                        onChange={e => setNuevaTarea(p => ({ ...p, [idx]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTarea(idx); } }} />
                      <button type="button" onClick={() => addTarea(idx)}
                        className="px-3 rounded-lg text-xs font-semibold" style={{ background: 'var(--brand)', color: 'white' }}>
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button type="button" onClick={handleAdd}
        className="w-full rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
        style={{ border: '2px dashed var(--border)', color: 'var(--text-2)' }}>
        <Plus size={16} /> Agregar operación a la plantilla
      </button>
    </div>
  );
}
