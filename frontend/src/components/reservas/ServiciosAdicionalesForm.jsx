import { useState } from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { fmtMoneda } from '../../utils/formatters';

const MANUAL_VACIO = { nombre: '', cantidad: 1, precio_unitario_usd: '' };

export default function ServiciosAdicionalesForm({ extras = [], catalogo = [], onChange }) {
  const [manual, setManual] = useState(MANUAL_VACIO);
  const [showManual, setShowManual] = useState(false);

  const addDesdeCatalogo = (item) => {
    const idx = extras.findIndex(e => e.nombre === item.nombre);
    if (idx >= 0) {
      const next = extras.map((e, i) => i === idx ? { ...e, cantidad: Number(e.cantidad || 1) + 1 } : e);
      onChange(next);
    } else {
      onChange([...extras, { nombre: item.nombre, cantidad: 1, precio_unitario_usd: item.precio_usd }]);
    }
  };

  const addManual = () => {
    if (!manual.nombre.trim()) return;
    onChange([...extras, {
      nombre: manual.nombre,
      cantidad: Number(manual.cantidad) || 1,
      precio_unitario_usd: Number(manual.precio_unitario_usd) || 0,
    }]);
    setManual(MANUAL_VACIO);
    setShowManual(false);
  };

  const updateExtra = (idx, field, value) =>
    onChange(extras.map((e, i) => i === idx ? { ...e, [field]: value } : e));

  const removeExtra = (idx) => onChange(extras.filter((_, i) => i !== idx));

  const total = extras.reduce((s, e) => s + Number(e.cantidad || 1) * Number(e.precio_unitario_usd || 0), 0);

  return (
    <div className="space-y-3">
      {catalogo.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-2)' }}>
            <Sparkles size={12} /> Extras comunes de este paquete
          </p>
          <div className="flex flex-wrap gap-2">
            {catalogo.map(item => (
              <button key={item.id} type="button" onClick={() => addDesdeCatalogo(item)}
                className="text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer transition-all"
                style={{ background: 'var(--brand-bg)', color: 'var(--brand)', border: '1px solid rgba(67,97,238,0.25)' }}>
                + {item.nombre} · {fmtMoneda(item.precio_usd)}
              </button>
            ))}
          </div>
        </div>
      )}

      {extras.length > 0 && (
        <div className="space-y-1.5">
          {extras.map((e, idx) => (
            <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--card-2)' }}>
              <input className="input-field text-xs flex-1" value={e.nombre}
                onChange={ev => updateExtra(idx, 'nombre', ev.target.value)} />
              <input type="number" min="1" className="input-field text-xs" style={{ width: '4rem' }}
                value={e.cantidad} onChange={ev => updateExtra(idx, 'cantidad', ev.target.value)} />
              <input type="number" min="0" step="0.01" className="input-field text-xs" style={{ width: '6rem' }}
                value={e.precio_unitario_usd} onChange={ev => updateExtra(idx, 'precio_unitario_usd', ev.target.value)} />
              <span className="text-xs font-semibold w-16 text-right flex-shrink-0" style={{ color: 'var(--text)' }}>
                {fmtMoneda(Number(e.cantidad || 1) * Number(e.precio_unitario_usd || 0))}
              </span>
              <button type="button" onClick={() => removeExtra(idx)} style={{ color: '#ef4444' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <div className="flex justify-end text-xs font-bold px-3" style={{ color: 'var(--text-2)' }}>
            Extras: {fmtMoneda(total)}
          </div>
        </div>
      )}

      {showManual ? (
        <div className="flex items-end gap-2 p-2 rounded-xl" style={{ background: 'var(--card-2)' }}>
          <input className="input-field text-xs flex-1" placeholder="Nombre del extra..." autoFocus
            value={manual.nombre} onChange={e => setManual(p => ({ ...p, nombre: e.target.value }))} />
          <input type="number" min="1" className="input-field text-xs" style={{ width: '4rem' }} placeholder="Cant."
            value={manual.cantidad} onChange={e => setManual(p => ({ ...p, cantidad: e.target.value }))} />
          <input type="number" min="0" step="0.01" className="input-field text-xs" style={{ width: '6rem' }} placeholder="USD"
            value={manual.precio_unitario_usd} onChange={e => setManual(p => ({ ...p, precio_unitario_usd: e.target.value }))} />
          <button type="button" onClick={addManual} className="px-3 py-2 rounded-lg" style={{ background: 'var(--brand)', color: 'white' }}>
            <Plus size={13} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setShowManual(true)}
          className="text-xs font-semibold flex items-center gap-1 cursor-pointer" style={{ color: 'var(--brand)' }}>
          <Plus size={12} /> Agregar extra manual
        </button>
      )}
    </div>
  );
}
