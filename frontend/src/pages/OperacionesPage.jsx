import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, RefreshCw, Search, Package, Edit2, Trash2, ChevronRight,
} from 'lucide-react';
import { proveedoresApi } from '../api/proveedores.api';
import { PageLoader } from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import { fmtFecha, fmtMoneda } from '../utils/formatters';

const ESTADO_CLR = {
  PENDIENTE:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.13)' },
  SOLICITADO:    { color: '#8892aa', bg: 'rgba(136,146,170,0.14)' },
  RESERVADO:     { color: '#4361ee', bg: 'rgba(67,97,238,0.13)' },
  PAGADO:        { color: '#059669', bg: 'rgba(5,150,105,0.13)' },
  CONFIRMADO:    { color: '#4361ee', bg: 'rgba(67,97,238,0.13)' },
  RECONFIRMADO:  { color: '#10b981', bg: 'rgba(16,185,129,0.13)' },
  EMITIDO:       { color: '#0ea5e9', bg: 'rgba(14,165,233,0.13)' },
  ANULADO:       { color: '#dc2626', bg: 'rgba(220,38,38,0.13)' },
  FACTURADO:     { color: '#7c3aed', bg: 'rgba(124,58,237,0.13)' },
  COMPLETADO:    { color: '#10b981', bg: 'rgba(16,185,129,0.13)' },
  CANCELADO:     { color: '#ef4444', bg: 'rgba(239,68,68,0.13)' },
  PENDIENTE_PAGO:{ color: '#f59e0b', bg: 'rgba(245,158,11,0.13)' },
};

const TIPO_CLR = {
  HOTEL:          '#4361ee',
  TRANSPORTE:     '#f97316',
  RESTAURANTE:    '#10b981',
  GUIA:           '#8b5cf6',
  AEROLINEA:      '#06b6d4',
  TREN:           '#f59e0b',
  OPERADOR_LOCAL: '#ec4899',
  SEGURO:         '#64748b',
  ACTIVIDAD:      '#059669',
  OTRO:           '#8892aa',
};

const TIPOS_SERVICIO = ['HOTEL','TRANSPORTE','RESTAURANTE','GUIA','AEROLINEA','TREN','OPERADOR_LOCAL','SEGURO','ACTIVIDAD','OTRO'];
// Lista completa (coincide con el enum de la BD tras 03_migration.sql) — usada
// en el selector de estado del formulario para no disparar CHECK/enum errors.
const ESTADOS_DETALLE_FORM = ['PENDIENTE','SOLICITADO','RESERVADO','PAGADO','CONFIRMADO','RECONFIRMADO','EMITIDO','ANULADO','FACTURADO','COMPLETADO','CANCELADO','PENDIENTE_PAGO'];
// Subconjunto usado en la franja de resumen (para no saturar la UI de cards)
const ESTADOS_DETALLE = ['SOLICITADO','CONFIRMADO','COMPLETADO','CANCELADO','PENDIENTE_PAGO'];

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente', SOLICITADO: 'Solicitado', RESERVADO: 'Reservado',
  PAGADO: 'Pagado', CONFIRMADO: 'Confirmado', RECONFIRMADO: 'Reconfirmado',
  EMITIDO: 'Emitido', ANULADO: 'Anulado', FACTURADO: 'Facturado',
  COMPLETADO: 'Completado', CANCELADO: 'Cancelado', PENDIENTE_PAGO: 'Pend. pago',
};

const DETALLE_EMPTY = {
  proveedor_id: '', tipo_servicio: 'HOTEL', fecha_inicio: '',
  fecha_fin: '', descripcion: '', cantidad: 1,
  costo_unitario_usd: '', estado: 'SOLICITADO', notas: '',
};

/* ── Form (top-level — no focus loss) ───────────────────────── */
function DetalleForm({ inicial, proveedores, onSave, onCancel }) {
  const [f, setF] = useState({ ...DETALLE_EMPTY, ...inicial,
    fecha_inicio: inicial?.fecha_inicio?.slice(0,10) || '',
    fecha_fin:    inicial?.fecha_fin?.slice(0,10)    || '',
  });
  const [tipoProveedor, setTipoProveedor] = useState('');
  const [err, setErr] = useState('');
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const proveedoresFiltrados = tipoProveedor
    ? proveedores.filter(p => p.tipo === tipoProveedor)
    : proveedores;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr('');
    if (f.fecha_fin && f.fecha_fin < f.fecha_inicio) {
      return setErr('La fecha fin no puede ser anterior a la fecha inicio');
    }
    // Los campos opcionales se envían como undefined (no null): el esquema
    // Zod del backend usa .optional() y rechazaría valores null.
    onSave({
      proveedor_id:       f.proveedor_id ? Number(f.proveedor_id) : undefined,
      tipo_servicio:      f.tipo_servicio,
      descripcion:        f.descripcion || undefined,
      fecha_inicio:       f.fecha_inicio || undefined,
      fecha_fin:          f.fecha_fin    || undefined,
      cantidad:           Number(f.cantidad) || 1,
      costo_unitario_usd: Number(f.costo_unitario_usd) || 0,
      estado:             f.estado,
      notas:              f.notas || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && (
        <div className="text-sm px-4 py-3 rounded-2xl font-medium" style={{ background: '#fef2f2', color: '#ef4444' }}>
          {err}
        </div>
      )}
      <div>
        <label className="label">Tipo de proveedor (filtro)</label>
        <select className="input-field" value={tipoProveedor}
          onChange={e => { setTipoProveedor(e.target.value); set('proveedor_id', ''); }}>
          <option value="">— Todos los tipos —</option>
          {TIPOS_SERVICIO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Proveedor *</label>
        <select required className="input-field" value={f.proveedor_id}
          onChange={e => set('proveedor_id', e.target.value)}>
          <option value="">— Seleccionar —</option>
          {proveedoresFiltrados.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tipo de servicio</label>
          <select className="input-field" value={f.tipo_servicio}
            onChange={e => set('tipo_servicio', e.target.value)}>
            {TIPOS_SERVICIO.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Estado</label>
          <select className="input-field" value={f.estado}
            onChange={e => set('estado', e.target.value)}>
            {ESTADOS_DETALLE_FORM.map(s => <option key={s} value={s}>{ESTADO_LABEL[s]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Descripción</label>
        <input className="input-field" value={f.descripcion}
          onChange={e => set('descripcion', e.target.value)}
          placeholder="Ej: Hotel 2 noches habitación doble" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Fecha inicio *</label>
          <input required type="date" className="input-field" value={f.fecha_inicio}
            onChange={e => set('fecha_inicio', e.target.value)} />
        </div>
        <div>
          <label className="label">Fecha fin</label>
          <input type="date" className="input-field" value={f.fecha_fin}
            onChange={e => set('fecha_fin', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Cantidad</label>
          <input type="number" min="1" className="input-field" value={f.cantidad}
            onChange={e => set('cantidad', e.target.value)} />
        </div>
        <div>
          <label className="label">Costo unit. USD</label>
          <input type="number" min="0" step="0.01" className="input-field"
            value={f.costo_unitario_usd}
            onChange={e => set('costo_unitario_usd', e.target.value)}
            placeholder="0.00" />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">Guardar</button>
      </div>
    </form>
  );
}

/* ── Row (top-level) ─────────────────────────────────────────── */
function OperacionRow({ d, onEdit, onDelete, navigate }) {
  const ec  = ESTADO_CLR[d.estado] || ESTADO_CLR.SOLICITADO;
  const tc  = TIPO_CLR[d.tipo_servicio] || '#8892aa';
  const cost = Number(d.costo_total_usd || 0);

  return (
    <div className="flex items-stretch relative" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="w-1 flex-shrink-0" style={{ background: ec.color, minHeight: 68 }} />

      <div className="flex-1 min-w-0 px-3 md:px-5 py-3 md:py-4">
        {/* L1: proveedor + tipo + estado */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="font-semibold text-sm md:text-base truncate" style={{ color: 'var(--text)', maxWidth: '45%' }}>
            {d.proveedor_nombre}
          </span>
          <span className="text-xs md:text-sm px-1.5 md:px-2.5 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{ background: `${tc}20`, color: tc }}>
            {d.tipo_servicio}
          </span>
          <span className="text-xs md:text-sm px-1.5 md:px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0"
            style={{ background: ec.bg, color: ec.color }}>
            {ESTADO_LABEL[d.estado]}
          </span>
        </div>

        {/* L2: descripción */}
        {d.descripcion && (
          <p className="text-xs md:text-sm mt-0.5 truncate" style={{ color: 'var(--text-2)', maxWidth: '95%' }}>
            {d.descripcion}
          </p>
        )}

        {/* L3: fecha + reserva + ref + qty */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs md:text-sm" style={{ color: 'var(--text-3)' }}>
          <span className="flex-shrink-0">
            {fmtFecha(d.fecha_inicio)}
            {d.fecha_fin && d.fecha_fin !== d.fecha_inicio ? ` → ${fmtFecha(d.fecha_fin)}` : ''}
          </span>
          {d.codigo_reserva && (
            <button
              onClick={() => navigate(`/reservas/${d.reserva_id}`)}
              className="font-mono font-bold hover:underline cursor-pointer flex-shrink-0"
              style={{ color: 'var(--brand)' }}>
              {d.codigo_reserva}
            </button>
          )}
          {d.confirmacion_ref && (
            <span className="font-mono hidden sm:inline flex-shrink-0">{d.confirmacion_ref}</span>
          )}
          <span className="flex-shrink-0">×{d.cantidad}</span>
        </div>
      </div>

      {/* Right: cost + actions */}
      <div className="flex items-center gap-1 md:gap-3 px-2 md:px-4 flex-shrink-0">
        <div className="text-right mr-1 hidden sm:block">
          <p className="font-black text-sm md:text-xl tabular-nums" style={{ color: 'var(--text)' }}>
            {fmtMoneda(cost)}
          </p>
          <p className="text-xs md:text-sm" style={{ color: 'var(--text-3)' }}>total</p>
        </div>
        <div className="flex flex-col gap-0.5">
          <button onClick={() => onEdit(d)}
            className="p-2 md:p-3 rounded-lg cursor-pointer hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-2)' }}>
            <Edit2 size={13} className="md:hidden" />
            <Edit2 size={17} className="hidden md:block" />
          </button>
          <button onClick={() => onDelete(d)}
            className="p-2 md:p-3 rounded-lg cursor-pointer hover:opacity-70 transition-opacity"
            style={{ color: '#ef4444' }}>
            <Trash2 size={13} className="md:hidden" />
            <Trash2 size={17} className="hidden md:block" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function OperacionesPage() {
  const navigate = useNavigate();
  const [detalles,    setDetalles]    = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [deleting,    setDeleting]    = useState(null);
  const [busqueda,    setBusqueda]    = useState('');
  const [filtroEstado,setFiltroEstado]= useState('');
  const [filtroTipo,  setFiltroTipo]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [d, p] = await Promise.all([
        proveedoresApi.getAllDetalles(),
        proveedoresApi.getAll(),
      ]);
      setDetalles(Array.isArray(d) ? d : (d.data || []));
      setProveedores(Array.isArray(p) ? p : (p.data || []));
    } catch (e) {
      setError(e.message || 'Error al cargar operaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (d) => { setEditing(d); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSave = async (data) => {
    try {
      if (editing?.id) {
        await proveedoresApi.updateDetalle(editing.id, data);
      } else {
        // Need a reserva_id when creating from this page — not implemented without selecting one
        setError('Para crear operaciones desde aquí, usa la reserva específica. Esta vista es de consulta.');
        return;
      }
      closeModal();
      await load();
    } catch (e) {
      setError(e.message || 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    try {
      await proveedoresApi.deleteDetalle(deleting.id);
      setDeleting(null);
      await load();
    } catch (e) {
      setError(e.message || 'Error al eliminar');
    }
  };

  // Filtros locales
  const filtrados = detalles.filter(d => {
    if (filtroEstado && d.estado !== filtroEstado) return false;
    if (filtroTipo   && d.tipo_servicio !== filtroTipo) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return (d.proveedor_nombre   || '').toLowerCase().includes(q)
          || (d.codigo_reserva     || '').toLowerCase().includes(q)
          || (d.descripcion        || '').toLowerCase().includes(q)
          || (d.confirmacion_ref   || '').toLowerCase().includes(q)
          || (d.nombre_servicio_snap|| '').toLowerCase().includes(q);
    }
    return true;
  });

  const totalCosto = filtrados.reduce((s, d) => s + Number(d.costo_total_usd || 0), 0);
  const byEstado   = ESTADOS_DETALLE.reduce((acc, e) => ({
    ...acc, [e]: detalles.filter(d => d.estado === e).length
  }), {});

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* ── Stats strip — clickable filters ── */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-4">
        {ESTADOS_DETALLE.map(e => {
          const ec  = ESTADO_CLR[e];
          const act = filtroEstado === e;
          return (
            <button key={e}
              onClick={() => setFiltroEstado(act ? '' : e)}
              className="rounded-2xl p-3 md:p-6 text-center cursor-pointer transition-all"
              style={{
                background:  act ? ec.color : 'var(--card)',
                boxShadow:   'var(--shadow-sm)',
                border:      act ? 'none' : '1px solid var(--border)',
              }}>
              <p className="text-xl md:text-3xl xl:text-4xl font-black tabular-nums leading-none"
                style={{ color: act ? 'white' : ec.color }}>
                {byEstado[e] || 0}
              </p>
              <p className="text-xs md:text-sm font-semibold mt-1 leading-tight"
                style={{ color: act ? 'rgba(255,255,255,0.85)' : 'var(--text-2)' }}>
                {ESTADO_LABEL[e]}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-3)' }} />
          <input className="input-field pl-9 w-full" placeholder="Proveedor, reserva, referencia..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <select className="input-field sm:w-40 flex-shrink-0" value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS_SERVICIO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={load} className="btn-ghost flex items-center gap-2 flex-shrink-0">
          <RefreshCw size={14} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {/* ── Count + total ── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs md:text-sm" style={{ color: 'var(--text-3)' }}>
          {filtrados.length} operación{filtrados.length !== 1 ? 'es' : ''}
          {(filtroEstado || filtroTipo || busqueda) ? ' (filtrado)' : ''}
        </p>
        <p className="text-sm md:text-base font-bold" style={{ color: 'var(--text)' }}>
          Costo total:{' '}
          <span className="tabular-nums" style={{ color: 'var(--brand)' }}>{fmtMoneda(totalCosto)}</span>
        </p>
      </div>

      {/* ── List ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)' }}>
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--text-2)' }}>
            <Package size={40} className="mb-3" style={{ color: 'var(--text-3)' }} />
            <p className="text-sm font-semibold">Sin operaciones</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
              {busqueda || filtroEstado || filtroTipo
                ? 'Prueba ajustando los filtros'
                : 'Las operaciones se agregan desde cada reserva'}
            </p>
            <button onClick={() => navigate('/reservas')}
              className="mt-4 btn-primary flex items-center gap-2">
              <ChevronRight size={14} />
              Ir a Reservas
            </button>
          </div>
        ) : (
          filtrados.map(d => (
            <OperacionRow key={d.id} d={d}
              onEdit={openEdit}
              onDelete={setDeleting}
              navigate={navigate}
            />
          ))
        )}
      </div>

      {/* ── Edit Modal ── */}
      <Modal open={modalOpen} onClose={closeModal} title="Editar operación">
        <DetalleForm
          key={editing?.id || 'new'}
          inicial={editing || {}}
          proveedores={proveedores}
          onSave={handleSave}
          onCancel={closeModal}
        />
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Eliminar operación">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            ¿Eliminar la operación de{' '}
            <strong style={{ color: 'var(--text)' }}>{deleting?.proveedor_nombre}</strong>
            {' '}en reserva{' '}
            <span className="font-mono" style={{ color: 'var(--brand)' }}>{deleting?.codigo_reserva}</span>?
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleting(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleDelete}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
              style={{ background: '#ef4444' }}>
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
