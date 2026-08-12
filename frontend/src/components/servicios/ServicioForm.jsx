import { useState, useEffect } from 'react';
import { TIPOS_SERVICIO, NIVELES_DIFICULTAD } from '../../utils/constants';
import { serviciosApi } from '../../api/servicios.api';
import { proveedoresApi } from '../../api/proveedores.api';
import Alert from '../ui/Alert';
import Spinner from '../ui/Spinner';
import PlantillaOperacionesForm from './PlantillaOperacionesForm';
import CatalogoAdicionalesForm from './CatalogoAdicionalesForm';

const EMPTY = {
  codigo: '', nombre: '', descripcion: '',
  tipo: 'TREK', duracion_dias: 1, precio_base_usd: 0,
  nivel_dificultad: 'MODERADO', min_pax: 1, max_pax: '',
  incluye: '', no_incluye: '', que_llevar: '',
  politica_cancelacion: '',
  activo: true, es_plantilla: false,
};

const TABS = ['Datos generales', 'Operaciones de plantilla', 'Servicios adicionales'];

export default function ServicioForm({ inicial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, ...inicial });
  const [plantillaOperaciones, setPlantillaOperaciones] = useState(inicial?.plantilla_operaciones || []);
  const [catalogoAdicionales, setCatalogoAdicionales]   = useState(inicial?.catalogo_adicionales || []);
  const [proveedores, setProveedores] = useState([]);
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    proveedoresApi.getAll({ activo: true }).then(r => setProveedores(r.data || [])).catch(() => {});
    if (inicial?.id) {
      serviciosApi.getById(inicial.id).then(r => {
        setPlantillaOperaciones(r.data?.plantilla_operaciones || []);
        setCatalogoAdicionales(r.data?.catalogo_adicionales || []);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await onSave({
        ...form,
        duracion_dias:   Number(form.duracion_dias),
        precio_base_usd: Number(form.precio_base_usd),
        min_pax:         Number(form.min_pax),
        max_pax:         form.max_pax ? Number(form.max_pax) : undefined,
        plantilla_operaciones: plantillaOperaciones.map(op => ({
          ...op,
          proveedor_id: op.proveedor_id || null,
          cantidad: Number(op.cantidad) || 1,
          costo_unitario_usd: Number(op.costo_unitario_usd) || 0,
        })),
        catalogo_adicionales: catalogoAdicionales
          .filter(it => it.nombre?.trim())
          .map(it => ({ nombre: it.nombre, precio_usd: Number(it.precio_usd) || 0 })),
      });
    } catch (err) { setError(err.error || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="flex gap-1" style={{ borderBottom: '2px solid var(--border)' }}>
        {TABS.map((t, i) => (
          <button key={t} type="button" onClick={() => setTab(i)}
            className="px-3 py-2 text-xs font-semibold border-b-2 -mb-0.5 transition-colors cursor-pointer"
            style={tab === i
              ? { borderColor: 'var(--brand)', color: 'var(--brand)' }
              : { borderColor: 'transparent', color: 'var(--text-2)' }}>
            {t}
            {t === 'Operaciones de plantilla' && plantillaOperaciones.length > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--card-2)' }}>{plantillaOperaciones.length}</span>
            )}
            {t === 'Servicios adicionales' && catalogoAdicionales.length > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--card-2)' }}>{catalogoAdicionales.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 1 && (
        <PlantillaOperacionesForm operaciones={plantillaOperaciones} proveedores={proveedores} onChange={setPlantillaOperaciones} />
      )}
      {tab === 2 && (
        <CatalogoAdicionalesForm items={catalogoAdicionales} onChange={setCatalogoAdicionales} />
      )}

      <div className={tab === 0 ? 'space-y-4' : 'hidden'}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Código <span className="text-red-500">*</span></label>
          <input value={form.codigo} onChange={e => set('codigo', e.target.value.toUpperCase())}
            className="input-field font-mono" required maxLength={30} placeholder="IT4D, STK5..." />
        </div>
        <div>
          <label className="label">Nombre <span className="text-red-500">*</span></label>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
            className="input-field" required maxLength={200} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Tipo</label>
          <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="input-field">
            {TIPOS_SERVICIO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Días</label>
          <input type="number" min="1" value={form.duracion_dias}
            onChange={e => set('duracion_dias', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="label">Precio base USD</label>
          <input type="number" min="0" step="0.01" value={form.precio_base_usd}
            onChange={e => set('precio_base_usd', e.target.value)} className="input-field" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Dificultad</label>
          <select value={form.nivel_dificultad} onChange={e => set('nivel_dificultad', e.target.value)} className="input-field">
            <option value="">— Sin nivel —</option>
            {NIVELES_DIFICULTAD.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Pax mín.</label>
          <input type="number" min="1" value={form.min_pax}
            onChange={e => set('min_pax', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="label">Pax máx.</label>
          <input type="number" min="1" value={form.max_pax}
            onChange={e => set('max_pax', e.target.value)} className="input-field" placeholder="Sin límite" />
        </div>
      </div>

      <div>
        <label className="label">Descripción</label>
        <textarea rows={3} value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
          className="input-field resize-none" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[['incluye','✓ Incluye'],['no_incluye','✗ No incluye'],['que_llevar','Qué llevar']].map(([k, lbl]) => (
          <div key={k}>
            <label className="label">{lbl}</label>
            <textarea rows={4} value={form[k]} onChange={e => set(k, e.target.value)}
              className="input-field resize-none text-xs" placeholder="Un ítem por línea..." />
          </div>
        ))}
      </div>

      <div>
        <label className="label">Política de cancelación / Condiciones generales</label>
        <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>Un punto por línea. Aparece al final de la cotización PDF de este paquete.</p>
        <textarea rows={4} value={form.politica_cancelacion} onChange={e => set('politica_cancelacion', e.target.value)}
          className="input-field resize-none text-xs"
          placeholder={'Cancelación 15+ días antes: reembolso completo.\nCancelación 7-14 días antes: reembolso del 50%.\nCancelación < 7 días: sin reembolso.'} />
      </div>

      <div className="flex items-center gap-6">
        {[['activo','Activo'],['es_plantilla','Es plantilla']].map(([k, lbl]) => (
          <label key={k} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!form[k]} onChange={e => set(k, e.target.checked)}
              className="w-4 h-4 rounded text-brand-600" />
            <span className="text-sm text-gray-700">{lbl}</span>
          </label>
        ))}
      </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving && <Spinner size="sm" />}
          {form.id ? 'Guardar cambios' : 'Crear servicio'}
        </button>
      </div>
    </form>
  );
}
