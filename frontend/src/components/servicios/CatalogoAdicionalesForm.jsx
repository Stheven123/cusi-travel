import { Plus, Trash2 } from 'lucide-react';

export default function CatalogoAdicionalesForm({ items = [], onChange }) {
  const handleAdd = () => onChange([...items, { nombre: '', precio_usd: '' }]);
  const handleRemove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const handleChange = (idx, field, value) =>
    onChange(items.map((it, i) => i === idx ? { ...it, [field]: value } : it));

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
        Extras comunes de este paquete (noche extra, porter, seguro adicional...). Al crear una reserva
        de este paquete, vas a poder agregarlos con un clic — con precio ya cargado — o escribir uno manual.
      </p>
      {items.map((it, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input className="input-field flex-1 text-sm" placeholder="Nombre del extra (ej: Noche extra hotel)"
            value={it.nombre} onChange={e => handleChange(idx, 'nombre', e.target.value)} />
          <div className="relative" style={{ width: '9rem' }}>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-3)' }}>USD</span>
            <input type="number" min="0" step="0.01" className="input-field pl-10 text-sm"
              value={it.precio_usd} onChange={e => handleChange(idx, 'precio_usd', e.target.value)} placeholder="0.00" />
          </div>
          <button type="button" onClick={() => handleRemove(idx)} className="p-2 flex-shrink-0" style={{ color: '#ef4444' }}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" onClick={handleAdd}
        className="w-full rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
        style={{ border: '2px dashed var(--border)', color: 'var(--text-2)' }}>
        <Plus size={15} /> Agregar extra al catálogo
      </button>
    </div>
  );
}
