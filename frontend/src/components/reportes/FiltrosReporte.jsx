import { useState, useEffect } from 'react';
import { Filter, Printer } from 'lucide-react';
import { TIPOS_PROVEEDOR, ESTADOS_DETALLE_OPERACION } from '../../utils/constants';
import { proveedoresApi } from '../../api/proveedores.api';
import { reportesApi } from '../../api/reportes.api';
import Spinner from '../ui/Spinner';
import Alert from '../ui/Alert';

const CAMPOS_DISPONIBLES = [
  { key: 'codigo_reserva',      label: 'Código reserva' },
  { key: 'reserva_fecha_inicio',label: 'Fecha inicio' },
  { key: 'reserva_fecha_fin',   label: 'Fecha fin' },
  { key: 'n_pasajeros',         label: 'N° pax' },
  { key: 'reserva_estado',      label: 'Estado operación' },
  { key: 'agencia_nombre',      label: 'Agencia' },
  { key: 'idioma_servicio',     label: 'Idioma' },
  { key: 'servicio_turistico',  label: 'Servicio' },
  { key: 'proveedor_nombre',    label: 'Proveedor' },
  { key: 'tipo_servicio',       label: 'Tipo servicio' },
  { key: 'fecha_inicio',        label: 'Fecha servicio' },
  { key: 'servicio_descripcion',label: 'Descripción' },
  { key: 'cantidad',            label: 'Cantidad' },
  { key: 'costo_unitario_usd',  label: 'Costo unit.' },
  { key: 'costo_total_usd',     label: 'Costo total' },
  { key: 'detalle_estado',      label: 'Estado detalle' },
  { key: 'confirmacion_ref',    label: 'Ref. confirmación' },
  { key: 'contacto_nombre',     label: 'Contacto proveedor' },
  { key: 'contacto_email',      label: 'Email proveedor' },
  { key: 'contacto_telefono',   label: 'Tel. proveedor' },
  { key: 'notas',               label: 'Notas' },
  { key: 'briefing_fecha',      label: 'Fecha briefing' },
  { key: 'briefing_hora',       label: 'Hora briefing' },
  { key: 'briefing_lugar',      label: 'Lugar briefing' },
  { key: 'briefing_persona_encargada', label: 'Encargado briefing' },
  { key: 'briefing_notas',      label: 'Notas briefing' },
];

export default function FiltrosReporte({ onResultados }) {
  const [proveedores, setProvs] = useState([]);
  const [filtros, setFiltros]   = useState({
    proveedor_id: '', tipo_proveedor: '', fecha_desde: '', fecha_hasta: '', estado: '',
  });
  const [camposSelec, setCampos] = useState(new Set([
    'codigo_reserva','reserva_fecha_inicio','n_pasajeros','proveedor_nombre',
    'tipo_servicio','fecha_inicio','costo_total_usd','detalle_estado',
  ]));
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    proveedoresApi.getAll({ activo: true }).then(r => setProvs(r.data || [])).catch(() => {});
  }, []);

  const toggleCampo = (k) => {
    setCampos(prev => {
      const s = new Set(prev);
      s.has(k) ? s.delete(k) : s.add(k);
      return s;
    });
  };

  const generar = async () => {
    setLoading(true); setError('');
    try {
      const payload = {
        proveedor_id:   filtros.proveedor_id   ? Number(filtros.proveedor_id)  : undefined,
        tipo_proveedor: filtros.tipo_proveedor  || undefined,
        fecha_desde:    filtros.fecha_desde     || undefined,
        fecha_hasta:    filtros.fecha_hasta     || undefined,
        estado:         filtros.estado          || undefined,
        campos:         camposSelec.size > 0 ? Array.from(camposSelec) : undefined,
      };
      const res = await reportesApi.reporteProveedores(payload);
      onResultados(res.data || [], Array.from(camposSelec), payload);
    } catch (err) { setError(err.error || 'Error al generar reporte'); }
    finally { setLoading(false); }
  };

  const set = (k, v) => setFiltros(p => ({ ...p, [k]: v }));

  return (
    <div className="rounded-2xl p-5 space-y-5"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--brand-bg)' }}>
          <Filter size={15} style={{ color: 'var(--brand)' }} />
        </div>
        <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Filtros del reporte</h3>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Filtros principales */}
      <div className="space-y-3">
        <div>
          <label className="label">Proveedor</label>
          <select value={filtros.proveedor_id} onChange={e => set('proveedor_id', e.target.value)} className="input-field">
            <option value="">— Todos los proveedores —</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Tipo proveedor</label>
          <select value={filtros.tipo_proveedor} onChange={e => set('tipo_proveedor', e.target.value)} className="input-field">
            <option value="">— Todos los tipos —</option>
            {TIPOS_PROVEEDOR.map(t => <option key={t}>{t}</option>)}
          </select>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            Filtra por "GUIA" para ver solo los guías asignados a cada reserva.
          </p>
        </div>
        <div>
          <label className="label">Estado detalle</label>
          <select value={filtros.estado} onChange={e => set('estado', e.target.value)} className="input-field">
            <option value="">— Todos —</option>
            {ESTADOS_DETALLE_OPERACION.map(s =>
              <option key={s.value} value={s.value}>{s.label}</option>
            )}
          </select>
        </div>
        <div>
          <label className="label">Fecha desde</label>
          <input type="date" value={filtros.fecha_desde}
            onChange={e => set('fecha_desde', e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="label">Fecha hasta</label>
          <input type="date" value={filtros.fecha_hasta}
            onChange={e => set('fecha_hasta', e.target.value)} className="input-field" />
        </div>
      </div>

      {/* Selector de campos */}
      <div>
        <p className="label mb-2">Columnas a incluir</p>
        <div className="rounded-xl p-3 space-y-1.5"
          style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
          {CAMPOS_DISPONIBLES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer py-0.5">
              <input type="checkbox" checked={camposSelec.has(key)} onChange={() => toggleCampo(key)}
                className="w-3.5 h-3.5 rounded"
                style={{ accentColor: 'var(--brand)' }} />
              <span className="text-xs" style={{ color: 'var(--text-2)' }}>{label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
          {camposSelec.size} columnas seleccionadas
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button onClick={generar} disabled={loading} className="btn-primary w-full justify-center">
          {loading ? <Spinner size="sm" /> : <Filter size={16} />}
          Generar reporte
        </button>
        <button onClick={() => window.print()} className="btn-secondary w-full justify-center">
          <Printer size={16} />
          Imprimir
        </button>
      </div>
    </div>
  );
}
