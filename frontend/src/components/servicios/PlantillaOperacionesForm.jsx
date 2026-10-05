import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, X, Edit2, Check, GripVertical, AlertTriangle } from 'lucide-react';

const TIPOS = ['HOTEL','TRANSPORTE','RESTAURANTE','GUIA','AEROLINEA','TREN','OPERADOR_LOCAL','SEGURO','ACTIVIDAD','COCINERO','PORTER','OTRO','INGRESOS'];

let nextKey = 1;
const OP_VACIA = (dia) => ({
  _k: `new-${nextKey++}`,
  tipo_servicio: '', proveedor_id: '', descripcion: '',
  cantidad: 1, costo_unitario_usd: '', moneda: 'USD', tareas: [],
  dia_numero: dia,
});

const TAREA_VACIA = { titulo: '', fecha: '', monto: '', moneda: 'USD', persona_encargada: '' };

// Clave estable por operación (no por posición): al mover operaciones entre
// días o eliminarlas, el estado "expandido"/borrador sigue a la operación correcta.
const keyOf = (op) => op._k || `id-${op.id}`;

const normTarea = (t) => ({
  titulo: (t.titulo || '').trim(),
  fecha: t.fecha ? String(t.fecha).slice(0, 10) : null,
  monto: t.monto === '' || t.monto == null ? null : Number(t.monto),
  moneda: t.moneda || 'USD',
  persona_encargada: t.persona_encargada || null,
});

const tareaToDraft = (t) => ({
  titulo: t.titulo || '',
  fecha: t.fecha ? String(t.fecha).slice(0, 10) : '',
  monto: t.monto ?? '',
  moneda: t.moneda || 'USD',
  persona_encargada: t.persona_encargada || '',
});

/* Inputs de una tarea del checklist — se usan para agregar y para editar. */
function TareaInputs({ value, onChange, onSubmit, onCancel, editando }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); onSubmit(); }
    if (e.key === 'Escape' && onCancel) { e.preventDefault(); onCancel(); }
  };
  return (
    <div className="flex flex-wrap items-end gap-2">
      <input className="input-field text-xs flex-1 basis-full sm:basis-auto min-w-[140px]" placeholder={editando ? 'Título de la tarea' : 'Nueva tarea del checklist...'}
        value={value.titulo} onChange={e => set('titulo', e.target.value)} onKeyDown={onKeyDown} autoFocus={editando} />
      <input type="date" className="input-field text-xs" style={{ width: '9.5rem' }}
        value={value.fecha} onChange={e => set('fecha', e.target.value)} onKeyDown={onKeyDown} />
      <input type="number" step="0.01" className="input-field text-xs" style={{ width: '6.5rem' }} placeholder="Monto"
        value={value.monto} onChange={e => set('monto', e.target.value)} onKeyDown={onKeyDown} />
      <select className="input-field text-xs" style={{ width: '5.5rem' }}
        value={value.moneda || 'USD'} onChange={e => set('moneda', e.target.value)}>
        <option value="USD">USD $</option>
        <option value="PEN">PEN S/</option>
      </select>
      <input className="input-field text-xs" style={{ width: '9rem' }} placeholder="Encargado"
        value={value.persona_encargada} onChange={e => set('persona_encargada', e.target.value)} onKeyDown={onKeyDown} />
      <button type="button" onClick={onSubmit} title={editando ? 'Guardar cambios' : 'Agregar tarea'}
        className="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer" style={{ background: 'var(--brand)', color: 'white' }}>
        {editando ? <Check size={13} /> : <Plus size={13} />}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} title="Cancelar"
          className="px-2 py-2 rounded-lg text-xs cursor-pointer" style={{ color: 'var(--text-2)' }}>
          <X size={13} />
        </button>
      )}
    </div>
  );
}

export default function PlantillaOperacionesForm({ operaciones = [], proveedores = [], duracionDias = 1, onChange }) {
  const [expanded, setExpanded]     = useState({});
  const [nuevaTarea, setNuevaTarea] = useState({});
  // { [opKey]: { idx, draft } } — tarea del checklist que se está editando
  const [editTarea, setEditTarea]   = useState({});
  const [dragKey, setDragKey]       = useState(null);
  const [dropDia, setDropDia]       = useState(null);

  const duracion = Math.max(1, Number(duracionDias) || 1);
  const maxDiaOps = operaciones.reduce((m, o) => Math.max(m, Number(o.dia_numero) || 1), 1);
  const totalDias = Math.max(duracion, maxDiaOps);
  const dias = Array.from({ length: totalDias }, (_, i) => i + 1);

  const getNuevaTarea = (k) => nuevaTarea[k] || TAREA_VACIA;

  const updateOp = (k, patch) =>
    onChange(operaciones.map(o => keyOf(o) === k ? { ...o, ...patch } : o));

  const handleAdd = (dia) => {
    const op = OP_VACIA(dia);
    onChange([...operaciones, op]);
    setExpanded(p => ({ ...p, [op._k]: true }));
  };

  const handleRemove = (k) => onChange(operaciones.filter(o => keyOf(o) !== k));

  // Mover una operación a otro día: se saca de su lugar y se pone al final de
  // ese día, así el orden dentro del día se mantiene al guardar.
  const moverADia = (k, dia) => {
    const op = operaciones.find(o => keyOf(o) === k);
    if (!op || (Number(op.dia_numero) || 1) === dia) return;
    const resto = operaciones.filter(o => keyOf(o) !== k);
    const ultimoIdxDelDia = resto.reduce((acc, o, i) => ((Number(o.dia_numero) || 1) <= dia ? i : acc), -1);
    const next = [...resto];
    next.splice(ultimoIdxDelDia + 1, 0, { ...op, dia_numero: dia });
    onChange(next);
  };

  const addTarea = (k) => {
    const t = normTarea(getNuevaTarea(k));
    if (!t.titulo) return;
    const op = operaciones.find(o => keyOf(o) === k);
    updateOp(k, { tareas: [...(op.tareas || []), t] });
    setNuevaTarea(p => ({ ...p, [k]: TAREA_VACIA }));
  };

  const removeTarea = (k, tIdx) => {
    const op = operaciones.find(o => keyOf(o) === k);
    updateOp(k, { tareas: op.tareas.filter((_, i) => i !== tIdx) });
    setEditTarea(p => ({ ...p, [k]: undefined }));
  };

  const startEditTarea = (k, tIdx, t) => setEditTarea(p => ({ ...p, [k]: { idx: tIdx, draft: tareaToDraft(t) } }));
  const cancelEditTarea = (k) => setEditTarea(p => ({ ...p, [k]: undefined }));
  const saveEditTarea = (k) => {
    const ed = editTarea[k];
    const t = normTarea(ed.draft);
    if (!t.titulo) return;
    const op = operaciones.find(o => keyOf(o) === k);
    updateOp(k, { tareas: op.tareas.map((x, i) => i === ed.idx ? t : x) });
    cancelEditTarea(k);
  };

  const toggle = (k) => setExpanded(p => ({ ...p, [k]: !p[k] }));

  const renderOp = (op) => {
    const k = keyOf(op);
    const esIngreso = op.tipo_servicio === 'INGRESOS';
    const proveedoresFiltrados = op.tipo_servicio ? proveedores.filter(p => p.tipo === op.tipo_servicio) : proveedores;
    const ed = editTarea[k];
    return (
      <div key={k} className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)', opacity: dragKey === k ? 0.5 : 1 }}>
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 cursor-pointer" style={{ background: 'var(--card-2)' }}
          draggable
          onDragStart={e => { setDragKey(k); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', k); }}
          onDragEnd={() => { setDragKey(null); setDropDia(null); }}
          onClick={() => toggle(k)}>
          <GripVertical size={15} className="flex-shrink-0 cursor-grab" style={{ color: 'var(--text-3)' }} title="Arrastra para mover a otro día" />
          <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0" style={{ background: 'var(--brand-bg)', color: 'var(--brand)' }}>
            {op.tipo_servicio || '—'}
          </span>
          <p className="flex-1 min-w-[8rem] text-sm truncate" style={{ color: 'var(--text)' }}>
            {op.descripcion || <span style={{ color: 'var(--text-3)' }}>Operación sin descripción</span>}
          </p>
          {(op.tareas || []).length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'var(--card)', color: 'var(--text-2)' }}>
              {op.tareas.length} tarea{op.tareas.length !== 1 ? 's' : ''}
            </span>
          )}
          <select className="input-field text-xs py-1 flex-shrink-0" style={{ width: '6.6rem', paddingLeft: '0.5rem', paddingRight: '1.5rem' }} title="Mover a otro día"
            value={Number(op.dia_numero) || 1}
            onClick={e => e.stopPropagation()}
            onChange={e => moverADia(k, Number(e.target.value))}>
            {dias.map(d => <option key={d} value={d}>Día {d}</option>)}
          </select>
          <button type="button" onClick={e => { e.stopPropagation(); handleRemove(k); }} style={{ color: '#ef4444' }} title="Eliminar operación">
            <Trash2 size={14} />
          </button>
          {expanded[k] ? <ChevronUp size={16} style={{ color: 'var(--text-3)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-3)' }} />}
        </div>

        {expanded[k] && (
          <div className="p-4 space-y-3" style={{ background: 'var(--card)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Tipo de operación <span style={{ color: '#ef4444' }}>*</span></label>
                <select className="input-field" value={op.tipo_servicio}
                  onChange={e => updateOp(k, { tipo_servicio: e.target.value })}>
                  <option value="">— Selecciona —</option>
                  {TIPOS.map(t => <option key={t} value={t}>{t === 'INGRESOS' ? 'INGRESOS (sin proveedor)' : t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Proveedor</label>
                {/* "Sin asignar": la operación se crea en cada reserva nueva sin
                    proveedor, y el equipo lo asigna ahí según corresponda. */}
                <select className="input-field" value={op.proveedor_id ?? ''}
                  onChange={e => updateOp(k, { proveedor_id: e.target.value })}>
                  <option value="">{esIngreso ? '— Sin proveedor —' : '— Sin asignar —'}</option>
                  {proveedoresFiltrados.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Descripción</label>
              <input className="input-field" value={op.descripcion || ''}
                onChange={e => updateOp(k, { descripcion: e.target.value })} placeholder="Ej: Guía principal del trek" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Cantidad</label>
                <input type="number" min="1" className="input-field" value={op.cantidad}
                  onChange={e => updateOp(k, { cantidad: e.target.value })} />
              </div>
              <div>
                <label className="label">Costo unitario</label>
                <input type="number" min="0" step="0.01" className="input-field" value={op.costo_unitario_usd}
                  onChange={e => updateOp(k, { costo_unitario_usd: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <label className="label">Moneda</label>
                <select className="input-field" value={op.moneda} onChange={e => updateOp(k, { moneda: e.target.value })}>
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
                  ed && ed.idx === tIdx ? (
                    <div key={tIdx} className="p-2 rounded-lg" style={{ background: 'var(--card-2)' }}>
                      <TareaInputs editando value={ed.draft}
                        onChange={draft => setEditTarea(p => ({ ...p, [k]: { ...ed, draft } }))}
                        onSubmit={() => saveEditTarea(k)}
                        onCancel={() => cancelEditTarea(k)} />
                    </div>
                  ) : (
                    <div key={tIdx} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg" style={{ background: 'var(--card-2)' }}>
                      <span className="flex-1 min-w-0 truncate" style={{ color: 'var(--text)' }}>{t.titulo}</span>
                      {t.fecha && <span className="flex-shrink-0" style={{ color: 'var(--text-3)' }}>{String(t.fecha).slice(0, 10)}</span>}
                      {t.monto != null && t.monto !== '' && (
                        <span className="flex-shrink-0 font-semibold" style={{ color: 'var(--text-2)' }}>
                          {(t.moneda === 'PEN' ? 'S/ ' : '$ ') + t.monto}
                        </span>
                      )}
                      {t.persona_encargada && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full" style={{ background: 'var(--card)', color: 'var(--text-2)' }}>
                          {t.persona_encargada}
                        </span>
                      )}
                      <button type="button" onClick={() => startEditTarea(k, tIdx, t)} title="Editar tarea"
                        className="cursor-pointer" style={{ color: 'var(--text-2)' }}>
                        <Edit2 size={12} />
                      </button>
                      <button type="button" onClick={() => removeTarea(k, tIdx)} title="Eliminar tarea"
                        className="cursor-pointer" style={{ color: '#ef4444' }}>
                        <X size={12} />
                      </button>
                    </div>
                  )
                ))}
                <TareaInputs value={getNuevaTarea(k)}
                  onChange={v => setNuevaTarea(p => ({ ...p, [k]: v }))}
                  onSubmit={() => addTarea(k)} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
        Las operaciones se agrupan por día del paquete ({duracion} día{duracion !== 1 ? 's' : ''}). Arrástralas o usa el
        selector "Día" para moverlas. Al crear una reserva con este paquete, cada operación (con su checklist) se crea en
        la fecha de su día.
      </p>
      {dias.map(dia => {
        const opsDelDia = operaciones.filter(o => (Number(o.dia_numero) || 1) === dia);
        const fueraDeRango = dia > duracion;
        const activo = dropDia === dia && dragKey;
        return (
          <div key={dia} className="rounded-2xl p-3 space-y-2 transition-colors"
            style={{
              background: activo ? 'var(--brand-bg)' : 'var(--card)',
              border: `1px ${activo ? 'dashed' : 'solid'} ${activo ? 'var(--brand)' : 'var(--border)'}`,
            }}
            onDragOver={e => { if (dragKey) { e.preventDefault(); setDropDia(dia); } }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDropDia(null); }}
            onDrop={e => { e.preventDefault(); if (dragKey) moverADia(dragKey, dia); setDragKey(null); setDropDia(null); }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black px-2.5 py-1 rounded-lg" style={{ background: 'var(--brand)', color: 'white' }}>
                Día {dia}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                {opsDelDia.length} operación{opsDelDia.length !== 1 ? 'es' : ''}
              </span>
              {fueraDeRango && (
                <span className="text-xs flex items-center gap-1" style={{ color: '#d97706' }}>
                  <AlertTriangle size={12} /> fuera de la duración del paquete — muévelas a otro día
                </span>
              )}
              <button type="button" onClick={() => handleAdd(dia)}
                className="ml-auto text-xs font-semibold flex items-center gap-1 cursor-pointer" style={{ color: 'var(--brand)' }}>
                <Plus size={13} /> Agregar
              </button>
            </div>
            {opsDelDia.length === 0 ? (
              <p className="text-xs text-center py-3 rounded-xl" style={{ color: 'var(--text-3)', border: '1px dashed var(--border)' }}>
                Sin operaciones — arrastra una aquí o usa "Agregar"
              </p>
            ) : opsDelDia.map(renderOp)}
          </div>
        );
      })}
    </div>
  );
}
