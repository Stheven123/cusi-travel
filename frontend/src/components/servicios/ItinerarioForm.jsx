import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

const DIAS_VACIO = () => ({
  dia_numero: '', titulo: '', descripcion: '',
  altitud_max_msnm: '', distancia_km: '', horas_caminata: '',
  desayuno: false, almuerzo: false, cena: false, box_lunch: false,
  alojamiento: '', notas_operativas: '',
});

export default function ItinerarioForm({ itinerarios = [], onChange }) {
  const [expanded, setExpanded] = useState({});

  const handleAdd = () => {
    const nextDia = itinerarios.length + 1;
    onChange([...itinerarios, { ...DIAS_VACIO(), dia_numero: nextDia }]);
    setExpanded(p => ({ ...p, [itinerarios.length]: true }));
  };

  const handleRemove = (idx) => {
    const next = itinerarios.filter((_, i) => i !== idx).map((d, i) => ({ ...d, dia_numero: i + 1 }));
    onChange(next);
  };

  const handleChange = (idx, field, value) => {
    const next = itinerarios.map((d, i) => i === idx ? { ...d, [field]: value } : d);
    onChange(next);
  };

  const toggle = (idx) => setExpanded(p => ({ ...p, [idx]: !p[idx] }));

  return (
    <div className="space-y-2">
      {itinerarios.map((dia, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Header del día */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer" onClick={() => toggle(idx)}>
            <GripVertical size={16} className="text-gray-300" />
            <div className="w-8 h-8 bg-brand-600 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
              {dia.dia_numero || idx + 1}
            </div>
            <p className="flex-1 text-sm font-medium text-gray-800 truncate">{dia.titulo || <span className="text-gray-400">Día {idx + 1} sin título</span>}</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 text-xs text-gray-400">
                {dia.desayuno  && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">D</span>}
                {dia.almuerzo  && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">A</span>}
                {dia.cena      && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">C</span>}
                {dia.box_lunch && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">BL</span>}
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); handleRemove(idx); }}
                className="text-red-400 hover:text-red-600 p-1">
                <Trash2 size={14} />
              </button>
              {expanded[idx] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </div>
          </div>

          {/* Cuerpo expandible */}
          {expanded[idx] && (
            <div className="p-4 space-y-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Título del día <span className="text-red-500">*</span></label>
                  <input className="input-field" value={dia.titulo} required
                    onChange={e => handleChange(idx, 'titulo', e.target.value)} placeholder="Cusco → Wayllabamba" />
                </div>
                <div>
                  <label className="label">Alojamiento</label>
                  <input className="input-field" value={dia.alojamiento}
                    onChange={e => handleChange(idx, 'alojamiento', e.target.value)} placeholder="Campamento Wayllabamba" />
                </div>
              </div>

              <div>
                <label className="label">Descripción</label>
                <textarea rows={2} className="input-field resize-none" value={dia.descripcion}
                  onChange={e => handleChange(idx, 'descripcion', e.target.value)}
                  placeholder="Descripción del día..." />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Altitud máx (msnm)</label>
                  <input type="number" className="input-field" value={dia.altitud_max_msnm}
                    onChange={e => handleChange(idx, 'altitud_max_msnm', e.target.value)} placeholder="4215" />
                </div>
                <div>
                  <label className="label">Distancia (km)</label>
                  <input type="number" step="0.1" className="input-field" value={dia.distancia_km}
                    onChange={e => handleChange(idx, 'distancia_km', e.target.value)} placeholder="12.5" />
                </div>
                <div>
                  <label className="label">Horas caminata</label>
                  <input type="number" step="0.5" className="input-field" value={dia.horas_caminata}
                    onChange={e => handleChange(idx, 'horas_caminata', e.target.value)} placeholder="6" />
                </div>
              </div>

              {/* Comidas */}
              <div>
                <label className="label">Comidas incluidas</label>
                <div className="flex gap-4">
                  {[['desayuno','Desayuno'],['almuerzo','Almuerzo'],['cena','Cena'],['box_lunch','Box Lunch']].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input type="checkbox" className="accent-brand-600 w-4 h-4"
                        checked={!!dia[key]} onChange={e => handleChange(idx, key, e.target.checked)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Nota operativa (opcional, sale en la orden de servicio)</label>
                <textarea rows={2} className="input-field resize-none" value={dia.notas_operativas}
                  onChange={e => handleChange(idx, 'notas_operativas', e.target.value)}
                  placeholder="Instrucciones operativas para este día..." />
              </div>
            </div>
          )}
        </div>
      ))}

      <button type="button" onClick={handleAdd}
        className="w-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-brand-400 hover:text-brand-600 rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
        <Plus size={16} /> Agregar día al itinerario
      </button>
    </div>
  );
}
