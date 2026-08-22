import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Trash2, Plus, UserPlus, MapPin, Users,
  Calendar, DollarSign, CheckCircle2, Clock,
  ChevronDown, ClipboardList, FileText, X, Download, FolderOpen,
  Link as LinkIcon, User, Wallet,
} from 'lucide-react';
import { reservasApi } from '../api/reservas.api';
import { pasajerosApi } from '../api/pasajeros.api';
import { proveedoresApi } from '../api/proveedores.api';
import { briefingsApi } from '../api/briefings.api';
import { notasApi } from '../api/notas.api';
import { presupuestoApi } from '../api/presupuesto.api';
import { tareasApi } from '../api/tareas.api';
import { usuariosApi } from '../api/usuarios.api';
import { reportesApi } from '../api/reportes.api';
import { serviciosApi } from '../api/servicios.api';
import { TareaForm } from './TareasPage';
import { EstadoOpBadge, EstadoPagoBadge, PrioridadBadge, EstadoTareaBadge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import ReservaForm from '../components/reservas/ReservaForm';
import PasajeroForm from '../components/reservas/PasajeroForm';
import { fmtFecha, fmtFechaHora, fmtMoneda } from '../utils/formatters';
import { generarOrdenServicioPDF } from '../utils/ordenServicioPDF';
import { ESTADOS_OPERACION, ESTADOS_DETALLE_OPERACION, TIPOS_DOCUMENTO } from '../utils/constants';

const TABS = ['Info', 'Pasajeros', 'Operaciones', 'Tareas', 'Briefings', 'Notas', 'Presupuesto'];

const ESTADO_DETALLE_CLR = {
  PENDIENTE:    '#f59e0b',
  SOLICITADO:   '#8892aa',
  RESERVADO:    '#4361ee',
  PAGADO:       '#059669',
  CONFIRMADO:   '#4f46e5',
  RECONFIRMADO: '#10b981',
  EMITIDO:      '#0ea5e9',
  ANULADO:      '#dc2626',
  FACTURADO:    '#7c3aed',
  COMPLETADO:   '#059669',
  CANCELADO:    '#dc2626',
  PENDIENTE_PAGO: '#d97706',
};

const ESTADOS_DETALLE = ESTADOS_DETALLE_OPERACION;

const TIPOS_SERVICIO_OP = ['HOTEL','TRANSPORTE','RESTAURANTE','GUIA','AEROLINEA','TREN','OPERADOR_LOCAL','SEGURO','ACTIVIDAD','COCINERO','PORTER','OTRO'];
const TIPOS_OPERACION = [...TIPOS_SERVICIO_OP, 'INGRESOS'];

const PRIORIDAD_CLR = {
  URGENTE: '#dc2626', ALTA: '#f97316', MEDIA: '#4f46e5', BAJA: '#c0bad6',
};

const GENERO_LABEL = { M: 'Masculino', F: 'Femenino', NO_ESPECIFICADO: 'No esp.' };

/* ── Finance mini-card ─────────────────────────────────────────── */
function FinanceCard({ label, value, warn }) {
  return (
    <div className="flex flex-col items-center px-4 py-2.5 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
      <p className="text-white/60 text-xs leading-none mb-1">{label}</p>
      <p className="font-black text-sm text-white" style={warn ? { color: '#fca5a5' } : {}}>{value}</p>
    </div>
  );
}

/* ── Passengers table ──────────────────────────────────────────── */
function PaxTable({ pasajeros, onEdit, onDelete }) {
  const hoy = new Date();
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: 'var(--card-2)', borderBottom: '2px solid var(--border)' }}>
              {['#','Pasajero','Género','Nac.','Pasaporte','Vencimiento','Nacimiento','Edad','Dieta / Salud','Equipo',''].map(h => (
                <th key={h} className="px-3 py-3 text-left text-xs font-black uppercase tracking-wider whitespace-nowrap"
                  style={{ color: 'var(--text-3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pasajeros.map((p, i) => {
              const vencida = p.pasaporte_vencimiento && new Date(p.pasaporte_vencimiento) < hoy;
              const pronto  = !vencida && p.pasaporte_vencimiento &&
                (new Date(p.pasaporte_vencimiento) - hoy) < 180 * 24 * 60 * 60 * 1000;
              const stripe  = vencida ? '#ef4444' : pronto ? '#f59e0b' : '#10b981';
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-7 rounded-full flex-shrink-0" style={{ background: stripe }} />
                      <span className="text-xs font-bold" style={{ color: 'var(--text-3)' }}>{i + 1}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 min-w-[140px]">
                    <p className="font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>
                      {p.apellido || '—'}{p.apellido && p.nombre ? ', ' : ''}{p.nombre}
                    </p>
                    {(p.email || p.whatsapp) && (
                      <p className="text-xs mt-0.5 truncate max-w-[160px]" style={{ color: 'var(--text-3)' }}>
                        {p.email || p.whatsapp}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-2)' }}>
                    {GENERO_LABEL[p.genero] || '—'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-2)' }}>
                    {p.nacionalidad || '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-mono text-xs font-medium" style={{ color: 'var(--text)' }}>
                      {p.pasaporte || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs font-medium"
                    style={{ color: vencida ? '#ef4444' : pronto ? '#f59e0b' : 'var(--text-2)' }}>
                    {p.pasaporte_vencimiento ? (
                      <>{fmtFecha(p.pasaporte_vencimiento)}{vencida || pronto ? ' ⚠' : ''}</>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-2)' }}>
                    {p.fecha_nacimiento ? fmtFecha(p.fecha_nacimiento) : '—'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs text-center font-semibold" style={{ color: 'var(--text-2)' }}>
                    {p.edad_calculada ?? '—'}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1 min-w-[80px]">
                      {p.es_vegetariano  && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.13)', color: '#059669' }}>Veg.</span>}
                      {p.es_vegano       && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.13)', color: '#059669' }}>Vegano</span>}
                      {p.es_pescetariano && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.13)', color: '#059669' }}>Pescet.</span>}
                      {p.es_flexitariano && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.13)', color: '#059669' }}>Flexit.</span>}
                      {p.es_celiaco      && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.13)', color: '#b45309' }}>Celíaco</span>}
                      {p.sin_lactosa     && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.13)', color: '#b45309' }}>S/lactosa</span>}
                      {p.es_halal        && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.13)', color: '#b45309' }}>Halal</span>}
                      {p.es_diabetico    && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(249,115,22,0.13)', color: '#c2410c' }}>Diab.</span>}
                      {p.alergias        && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.13)', color: '#dc2626' }}>Alergia</span>}
                      {!p.es_vegetariano && !p.es_vegano && !p.es_pescetariano && !p.es_flexitariano &&
                       !p.es_celiaco && !p.sin_lactosa && !p.es_halal && !p.es_diabetico && !p.alergias && (
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1 min-w-[80px]">
                      {p.quechua_extra_kg && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(14,165,233,0.13)', color: '#0369a1' }}>Duffel extra {p.quechua_extra_kg}kg</span>}
                      {p.trekking_poles   && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(14,165,233,0.13)', color: '#0369a1' }}>Bastones</span>}
                      {p.sleeping_bag     && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(14,165,233,0.13)', color: '#0369a1' }}>Sleeping</span>}
                      {p.carpa_privada    && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(14,165,233,0.13)', color: '#0369a1' }}>Carpa</span>}
                      {p.duffel_bag       && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(14,165,233,0.13)', color: '#0369a1' }}>Duffel bag</span>}
                      {!p.quechua_extra_kg && !p.trekking_poles && !p.sleeping_bag && !p.carpa_privada && !p.duffel_bag && (
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(p)} className="p-1.5 rounded-lg cursor-pointer hover:opacity-70"
                        style={{ color: 'var(--text-2)' }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => onDelete(p.id)} className="p-1.5 rounded-lg cursor-pointer hover:opacity-70"
                        style={{ color: '#ef4444' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Checklist de tareas de una operación ──────────────────────── */
const TAREA_OP_EMPTY = { titulo: '', fecha: '', monto: '', persona_encargada: '' };

function TareaOperacionForm({ onSave, onCancel }) {
  const [f, setF] = useState(TAREA_OP_EMPTY);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    if (!f.titulo.trim()) return;
    onSave({
      titulo: f.titulo,
      fecha: f.fecha || null,
      monto: f.monto === '' ? null : Number(f.monto),
      persona_encargada: f.persona_encargada || null,
    });
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2 p-2 rounded-xl" style={{ background: 'var(--card-2)' }}>
      <input className="input-field text-xs flex-1 min-w-[160px]" placeholder="Nueva tarea..." value={f.titulo}
        onChange={e => set('titulo', e.target.value)} autoFocus />
      <input type="date" className="input-field text-xs" style={{ width: '9.5rem' }} value={f.fecha}
        onChange={e => set('fecha', e.target.value)} />
      <input type="number" step="0.01" className="input-field text-xs" style={{ width: '6.5rem' }} placeholder="Monto"
        value={f.monto} onChange={e => set('monto', e.target.value)} />
      <input className="input-field text-xs" style={{ width: '9rem' }} placeholder="Encargado"
        value={f.persona_encargada} onChange={e => set('persona_encargada', e.target.value)} />
      <button type="submit" className="p-2 rounded-lg cursor-pointer" style={{ background: 'var(--brand)', color: 'white' }}>
        <Plus size={13} />
      </button>
      <button type="button" onClick={onCancel} className="p-2 rounded-lg cursor-pointer" style={{ color: 'var(--text-2)' }}>
        <X size={13} />
      </button>
    </form>
  );
}

function OperacionChecklist({ detalleId }) {
  const [tareas, setTareas] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try { const r = await proveedoresApi.getTareasOperacion(detalleId); setTareas(r.data || []); }
    catch { setErr('No se pudo cargar el checklist'); }
  }, [detalleId]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (t) => {
    setTareas(prev => prev.map(x => x.id === t.id ? { ...x, completada: !t.completada } : x));
    try { await proveedoresApi.updateTareaOperacion(t.id, { completada: !t.completada }); }
    catch { load(); }
  };

  const remove = async (id) => {
    try { await proveedoresApi.deleteTareaOperacion(id); load(); }
    catch { setErr('No se pudo eliminar'); }
  };

  const add = async (data) => {
    try { await proveedoresApi.createTareaOperacion(detalleId, data); setShowForm(false); load(); }
    catch { setErr('No se pudo agregar la tarea'); }
  };

  if (tareas === null) return <p className="text-xs px-2 py-1" style={{ color: 'var(--text-3)' }}>Cargando checklist...</p>;

  return (
    <div className="space-y-1.5 pt-2 mt-2" style={{ borderTop: '1px dashed var(--border)' }}>
      {err && <p className="text-xs" style={{ color: '#ef4444' }}>{err}</p>}
      {tareas.length === 0 && !showForm && (
        <p className="text-xs px-2" style={{ color: 'var(--text-3)' }}>Sin tareas en el checklist.</p>
      )}
      {tareas.map(t => (
        <div key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs" style={{ background: 'var(--card-2)' }}>
          <button type="button" onClick={() => toggle(t)} className="flex-shrink-0 cursor-pointer"
            style={{ color: t.completada ? '#10b981' : 'var(--text-3)' }}>
            <CheckCircle2 size={15} />
          </button>
          <span className={`flex-1 min-w-0 truncate ${t.completada ? 'line-through' : ''}`}
            style={{ color: t.completada ? 'var(--text-3)' : 'var(--text)' }}>
            {t.titulo}
          </span>
          {t.fecha && <span className="flex-shrink-0" style={{ color: 'var(--text-3)' }}>{fmtFecha(t.fecha)}</span>}
          {t.monto != null && <span className="flex-shrink-0 font-semibold" style={{ color: 'var(--text-2)' }}>{fmtMoneda(t.monto)}</span>}
          {t.persona_encargada && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full" style={{ background: 'var(--card)', color: 'var(--text-2)' }}>
              {t.persona_encargada}
            </span>
          )}
          <button type="button" onClick={() => remove(t.id)} className="flex-shrink-0 cursor-pointer" style={{ color: '#ef4444' }}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      {showForm ? (
        <TareaOperacionForm onSave={add} onCancel={() => setShowForm(false)} />
      ) : (
        <button type="button" onClick={() => setShowForm(true)}
          className="text-xs font-semibold px-2 py-1 cursor-pointer flex items-center gap-1" style={{ color: 'var(--brand)' }}>
          <Plus size={12} /> Agregar tarea
        </button>
      )}
    </div>
  );
}

/* ── Operation row (with edit/delete) ─────────────────────────── */
function OperacionRow({ d, onEdit, onDelete }) {
  const clr = ESTADO_DETALLE_CLR[d.estado] || '#8892aa';
  const [open, setOpen] = useState(false);
  return (
    <div className="py-3 px-4 rounded-2xl relative overflow-hidden"
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: clr }} />
      <div className="flex items-start gap-3">
        <div className="pl-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              {d.proveedor_nombre || (d.tipo_servicio === 'INGRESOS' ? (d.descripcion || 'Ingreso libre') : '—')}
            </p>
            {d.tipo_servicio && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--card-2)', color: 'var(--text-2)' }}>
                {d.tipo_servicio}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: `${clr}22`, color: clr }}>
              {ESTADOS_DETALLE.find(e => e.value === d.estado)?.label || d.estado}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs" style={{ color: 'var(--text-2)' }}>
            {d.fecha_inicio && <span className="flex items-center gap-1"><Calendar size={11} />{fmtFecha(d.fecha_inicio)}</span>}
            {d.descripcion  && <span className="truncate max-w-[200px]">{d.descripcion}</span>}
            {d.confirmacion_ref && <span className="font-mono">{d.confirmacion_ref}</span>}
          </div>
          {(d.tipo_documento || d.serie_documento || d.numero_documento || d.enlace_drive) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
              {d.tipo_documento && (
                <span className="font-medium">
                  {d.tipo_documento}{(d.serie_documento || d.numero_documento) ? ` ${d.serie_documento || ''}${d.serie_documento && d.numero_documento ? '-' : ''}${d.numero_documento || ''}` : ''}
                </span>
              )}
              {d.enlace_drive && (
                <a href={d.enlace_drive} target="_blank" rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 font-semibold hover:underline" style={{ color: 'var(--brand)' }}>
                  <LinkIcon size={11} /> Drive
                </a>
              )}
            </div>
          )}
          {d.estado_actualizado_por_nombre && (
            <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
              <User size={10} />
              Estado modificado por {d.estado_actualizado_por_nombre}{d.estado_actualizado_en ? ` · ${fmtFechaHora(d.estado_actualizado_en)}` : ''}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{fmtMoneda(d.costo_total_usd, d.moneda)}</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>x{d.cantidad}</p>
          </div>
          <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg cursor-pointer hover:opacity-70"
            style={{ color: 'var(--text-2)' }} title="Checklist de tareas">
            <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          <button onClick={() => onEdit(d)} className="p-1.5 rounded-lg cursor-pointer hover:opacity-70"
            style={{ color: 'var(--text-2)' }}>
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(d.id)} className="p-1.5 rounded-lg cursor-pointer hover:opacity-70"
            style={{ color: '#ef4444' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {open && <div className="pl-2"><OperacionChecklist detalleId={d.id} /></div>}
    </div>
  );
}

/* ── Tarea row ─────────────────────────────────────────────────── */
function TareaRow({ t, navigate }) {
  const hoy = new Date();
  const vencida = t.fecha_vencimiento && new Date(t.fecha_vencimiento) < hoy
    && t.estado !== 'COMPLETADA' && t.estado !== 'CANCELADA';
  const prioClr = PRIORIDAD_CLR[t.prioridad] || '#c5cad8';
  return (
    <button onClick={() => navigate('/tareas')}
      className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl relative overflow-hidden text-left cursor-pointer hover:opacity-90 transition-opacity"
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: prioClr }} />
      <div className="pl-2 flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{t.titulo}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs" style={{ color: 'var(--text-2)' }}>
          {t.asignado_a && <span>{t.asignado_a}</span>}
          {t.fecha_vencimiento && (
            <span className={vencida ? 'text-red-500 font-semibold' : ''}>
              <Clock size={10} className="inline mr-0.5" />
              {fmtFecha(t.fecha_vencimiento)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <PrioridadBadge prioridad={t.prioridad} />
        <EstadoTareaBadge estado={t.estado} />
      </div>
    </button>
  );
}

/* ── Detalle (operation) form — supports create and edit ─────── */
const DETALLE_EMPTY = {
  proveedor_id: '', tipo_servicio: '', fecha_inicio: '', fecha_fin: '',
  descripcion: '', cantidad: 1, costo_unitario_usd: '', moneda: 'USD',
  estado: 'PENDIENTE', notas: '',
  tipo_documento: '', serie_documento: '', numero_documento: '', enlace_drive: '',
};

function DetalleForm({ reservaId, proveedores, inicial, onSave, onCancel }) {
  const [f, setF]     = useState({
    ...DETALLE_EMPTY,
    ...inicial,
    proveedor_id:  inicial?.proveedor_id  ?? '',
    fecha_inicio:  inicial?.fecha_inicio?.slice(0, 10) ?? '',
    fecha_fin:     inicial?.fecha_fin?.slice(0, 10)   ?? '',
  });
  const [err, setErr]       = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const esIngreso = f.tipo_servicio === 'INGRESOS';
  // El tipo de operación YA filtra el proveedor — no hace falta un segundo
  // selector de "tipo de proveedor" que duplicaba el mismo dato.
  const proveedoresFiltrados = f.tipo_servicio
    ? proveedores.filter(p => p.tipo === f.tipo_servicio)
    : proveedores;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!esIngreso && !f.proveedor_id) return setErr('Selecciona un proveedor');
    if (!f.tipo_servicio) return setErr('Selecciona el tipo de operación');
    if (!f.fecha_inicio)  return setErr('Ingresa la fecha de inicio');
    if (f.fecha_fin && f.fecha_fin < f.fecha_inicio) return setErr('La fecha fin no puede ser anterior a la fecha inicio');
    setSaving(true);
    try {
      await onSave({
        reserva_id:         reservaId,
        proveedor_id:       f.proveedor_id ? Number(f.proveedor_id) : null,
        tipo_servicio:      f.tipo_servicio,
        fecha_inicio:       f.fecha_inicio,
        fecha_fin:          f.fecha_fin   || undefined,
        descripcion:        f.descripcion  || undefined,
        cantidad:           Number(f.cantidad) || 1,
        costo_unitario_usd: Number(f.costo_unitario_usd) || 0,
        moneda:             f.moneda,
        notas:              f.notas        || undefined,
        estado:             f.estado,
        tipo_documento:     f.tipo_documento   || undefined,
        serie_documento:    f.serie_documento  || undefined,
        numero_documento:   f.numero_documento || undefined,
        enlace_drive:       f.enlace_drive     || undefined,
      });
    } catch (e) {
      setErr(e?.error || e?.message || 'Error al guardar la operación');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && (
        <div className="text-sm px-4 py-3 rounded-2xl font-medium"
          style={{ background: '#fef2f2', color: '#ef4444' }}>
          {err}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tipo de operación <span style={{ color: '#ef4444' }}>*</span></label>
          <select className="input-field" value={f.tipo_servicio}
            onChange={e => set('tipo_servicio', e.target.value)} required>
            <option value="">— Selecciona —</option>
            {TIPOS_OPERACION.map(t => <option key={t} value={t}>{t === 'INGRESOS' ? 'INGRESOS (sin proveedor)' : t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Estado</label>
          <select className="input-field" value={f.estado} onChange={e => set('estado', e.target.value)}>
            {ESTADOS_DETALLE.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>
      {esIngreso ? (
        <div>
          <label className="label">Proveedor (opcional)</label>
          <select className="input-field" value={f.proveedor_id} onChange={e => set('proveedor_id', e.target.value)}>
            <option value="">— Sin proveedor (ingreso libre) —</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
      ) : (
        <div>
          <label className="label">Proveedor <span style={{ color: '#ef4444' }}>*</span></label>
          <select className="input-field" value={f.proveedor_id} onChange={e => set('proveedor_id', e.target.value)} required>
            <option value="">
              {f.tipo_servicio ? `— Selecciona un proveedor de tipo ${f.tipo_servicio} —` : '— Selecciona primero el tipo de operación —'}
            </option>
            {proveedoresFiltrados.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Fecha inicio <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="date" className="input-field" value={f.fecha_inicio}
            onChange={e => set('fecha_inicio', e.target.value)} required />
        </div>
        <div>
          <label className="label">Fecha fin</label>
          <input type="date" className="input-field" value={f.fecha_fin}
            onChange={e => set('fecha_fin', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Descripción</label>
        <textarea rows={2} className="input-field resize-none" value={f.descripcion}
          onChange={e => set('descripcion', e.target.value)} placeholder="Detalles del servicio..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Cantidad</label>
          <input type="number" min="1" className="input-field" value={f.cantidad}
            onChange={e => set('cantidad', e.target.value)} />
        </div>
        <div>
          <label className="label">Costo unitario</label>
          <div className="flex gap-2">
            <select className="input-field" style={{ width: '5.5rem', flexShrink: 0 }} value={f.moneda}
              onChange={e => set('moneda', e.target.value)}>
              <option value="USD">USD $</option>
              <option value="PEN">PEN S/</option>
            </select>
            <input type="number" step="0.01" min="0" className="input-field" value={f.costo_unitario_usd}
              onChange={e => set('costo_unitario_usd', e.target.value)} placeholder="0.00" />
          </div>
        </div>
      </div>
      <div>
        <label className="label">Notas internas</label>
        <textarea rows={2} className="input-field resize-none" value={f.notas}
          onChange={e => set('notas', e.target.value)} placeholder="Notas para el equipo..." />
      </div>
      <div className="pt-2 space-y-3" style={{ borderTop: '1px dashed var(--border)' }}>
        <p className="label">Documento sustentatorio</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Tipo de documento</label>
            <select className="input-field" value={f.tipo_documento} onChange={e => set('tipo_documento', e.target.value)}>
              <option value="">— Ninguno —</option>
              {TIPOS_DOCUMENTO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Serie</label>
            <input className="input-field" value={f.serie_documento}
              onChange={e => set('serie_documento', e.target.value)} placeholder="F001" />
          </div>
          <div>
            <label className="label">Número</label>
            <input className="input-field" value={f.numero_documento}
              onChange={e => set('numero_documento', e.target.value)} placeholder="00012345" />
          </div>
        </div>
        <div>
          <label className="label">Enlace de Google Drive</label>
          <input type="url" className="input-field" value={f.enlace_drive}
            onChange={e => set('enlace_drive', e.target.value)} placeholder="https://drive.google.com/..." />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={saving}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : (inicial?.id ? 'Actualizar operación' : 'Guardar operación')}
        </button>
      </div>
    </form>
  );
}

/* ── Briefing form ─────────────────────────────────────────────── */
const BRIEFING_EMPTY = {
  fecha: '', hora: '', lugar: '', persona_encargada: '', notas: '',
};

function BriefingForm({ reservaId, inicial, onSave, onCancel }) {
  const [f, setF]     = useState({
    ...BRIEFING_EMPTY,
    ...inicial,
    fecha: inicial?.fecha?.slice(0, 10) ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!f.fecha) return setErr('La fecha es obligatoria');
    setSaving(true);
    try {
      await onSave({
        reserva_id:        reservaId,
        fecha:             f.fecha,
        hora:              f.hora             || null,
        lugar:             f.lugar            || null,
        persona_encargada: f.persona_encargada|| null,
        notas:             f.notas            || null,
      });
    } catch (e) {
      setErr(e?.message || 'Error al guardar el briefing');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && (
        <div className="text-sm px-4 py-3 rounded-2xl font-medium"
          style={{ background: '#fef2f2', color: '#ef4444' }}>
          {err}
        </div>
      )}
      <div>
        <label className="label">Fecha <span style={{ color: '#ef4444' }}>*</span></label>
        <input type="date" className="input-field" value={f.fecha}
          onChange={e => set('fecha', e.target.value)} required />
      </div>
      <div>
        <label className="label">Hora de inicio</label>
        <input type="time" className="input-field" value={f.hora}
          onChange={e => set('hora', e.target.value)} />
      </div>
      <div>
        <label className="label">Lugar</label>
        <input className="input-field" value={f.lugar}
          onChange={e => set('lugar', e.target.value)} placeholder="Plaza de Armas, Cusco" />
      </div>
      <div>
        <label className="label">Persona encargada</label>
        <input className="input-field" value={f.persona_encargada}
          onChange={e => set('persona_encargada', e.target.value)} placeholder="Nombre del guía o responsable" />
      </div>
      <div>
        <label className="label">Notas</label>
        <textarea rows={3} className="input-field resize-none" value={f.notas}
          onChange={e => set('notas', e.target.value)} placeholder="Instrucciones, observaciones..." />
      </div>
      <div className="flex gap-3 justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={saving}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : (inicial?.id ? 'Actualizar briefing' : 'Guardar briefing')}
        </button>
      </div>
    </form>
  );
}

/* ── Briefing row ──────────────────────────────────────────────── */
function BriefingRow({ b, onEdit, onDelete }) {
  return (
    <div className="flex items-start gap-3 py-3 px-4 rounded-2xl"
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)', borderLeft: '3px solid #4361ee' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-sm" style={{ color: 'var(--brand)' }}>
            {fmtFecha(b.fecha)}
          </span>
          {b.hora && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-2)' }}>
              <Clock size={11} /> {b.hora.slice(0, 5)}
            </span>
          )}
          {b.persona_encargada && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--card-2)', color: 'var(--text-2)' }}>
              {b.persona_encargada}
            </span>
          )}
        </div>
        {b.lugar && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-2)' }}>
            <MapPin size={11} /> {b.lugar}
          </p>
        )}
        {b.notas && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-3)' }}>{b.notas}</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onEdit(b)} className="p-1.5 rounded-lg cursor-pointer hover:opacity-70"
          style={{ color: 'var(--text-2)' }}>
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(b.id)} className="p-1.5 rounded-lg cursor-pointer hover:opacity-70"
          style={{ color: '#ef4444' }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Nota de reserva: form + row (cada nota es su propio registro) ─── */
function NotaForm({ reservaId, inicial, onSave, onCancel }) {
  const [texto, setTexto]   = useState(inicial?.texto || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return setErr('Escribe una nota');
    setSaving(true);
    try {
      await onSave({ reserva_id: reservaId, texto: texto.trim() });
    } catch (e) {
      setErr(e?.error || e?.message || 'Error al guardar la nota');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && (
        <div className="text-sm px-4 py-3 rounded-2xl font-medium" style={{ background: '#fef2f2', color: '#ef4444' }}>
          {err}
        </div>
      )}
      <div>
        <label className="label">Nota <span style={{ color: '#ef4444' }}>*</span></label>
        <textarea rows={4} className="input-field resize-none" value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Requerimiento especial, observación, recordatorio..." autoFocus />
      </div>
      <div className="flex gap-3 justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={saving}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : (inicial?.id ? 'Actualizar nota' : 'Guardar nota')}
        </button>
      </div>
    </form>
  );
}

function NotaRow({ n, onEdit, onDelete }) {
  return (
    <div className="flex items-start gap-3 py-3 px-4 rounded-2xl"
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)', borderLeft: '3px solid #8892aa' }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text)' }}>{n.texto}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
          {n.creado_por_nombre && <span className="flex items-center gap-1"><User size={10} />{n.creado_por_nombre}</span>}
          <span className="flex items-center gap-1"><Clock size={10} />{fmtFechaHora(n.creado_en)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onEdit(n)} className="p-1.5 rounded-lg cursor-pointer hover:opacity-70" style={{ color: 'var(--text-2)' }}>
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(n.id)} className="p-1.5 rounded-lg cursor-pointer hover:opacity-70" style={{ color: '#ef4444' }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Línea de presupuesto: form + row (cada línea es su propio registro) ─── */
const PRESUPUESTO_EMPTY = { descripcion: '', monto: '', moneda: 'USD' };

function PresupuestoForm({ reservaId, inicial, onSave, onCancel }) {
  const [f, setF]           = useState({ ...PRESUPUESTO_EMPTY, ...inicial, monto: inicial?.monto ?? '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!f.descripcion.trim()) return setErr('Ingresa una descripción');
    setSaving(true);
    try {
      await onSave({
        reserva_id:  reservaId,
        descripcion: f.descripcion.trim(),
        monto:       Number(f.monto) || 0,
        moneda:      f.moneda,
      });
    } catch (e) {
      setErr(e?.error || e?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && (
        <div className="text-sm px-4 py-3 rounded-2xl font-medium" style={{ background: '#fef2f2', color: '#ef4444' }}>
          {err}
        </div>
      )}
      <div>
        <label className="label">Descripción <span style={{ color: '#ef4444' }}>*</span></label>
        <input className="input-field" value={f.descripcion} onChange={e => set('descripcion', e.target.value)}
          placeholder="Ej: Propina guía, gasto imprevisto..." autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Monto</label>
          <input type="number" step="0.01" min="0" className="input-field" value={f.monto}
            onChange={e => set('monto', e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="label">Moneda</label>
          <select className="input-field" value={f.moneda} onChange={e => set('moneda', e.target.value)}>
            <option value="USD">USD $</option>
            <option value="PEN">PEN S/</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={saving}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : (inicial?.id ? 'Actualizar' : 'Guardar')}
        </button>
      </div>
    </form>
  );
}

function PresupuestoRow({ p, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-2xl" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{p.descripcion}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
          {p.creado_por_nombre && <span className="flex items-center gap-1"><User size={10} />{p.creado_por_nombre}</span>}
          <span className="flex items-center gap-1"><Clock size={10} />{fmtFechaHora(p.creado_en)}</span>
        </div>
      </div>
      <span className="font-bold text-sm flex-shrink-0" style={{ color: 'var(--text)' }}>{fmtMoneda(p.monto, p.moneda)}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onEdit(p)} className="p-1.5 rounded-lg cursor-pointer hover:opacity-70" style={{ color: 'var(--text-2)' }}>
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(p.id)} className="p-1.5 rounded-lg cursor-pointer hover:opacity-70" style={{ color: '#ef4444' }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */
export default function ReservaDetallePage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [reserva, setReserva]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState(0);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [editModal, setEditModal]       = useState(false);
  const [paxModal, setPaxModal]         = useState(false);
  const [paxEdit, setPaxEdit]           = useState(null);
  const [detalleModal, setDetalleModal] = useState(false);
  const [detalleEdit, setDetalleEdit]   = useState(null);
  const [proveedores, setProveedores]   = useState([]);
  const [estadoOpen, setEstadoOpen]     = useState(false);

  // Briefings
  const [briefings, setBriefings]       = useState([]);
  const [briefingModal, setBriefingModal] = useState(false);
  const [briefingEdit, setBriefingEdit] = useState(null);

  // Notas (una fila por nota)
  const [notas, setNotas]               = useState([]);
  const [notaModal, setNotaModal]       = useState(false);
  const [notaEdit, setNotaEdit]         = useState(null);

  // Presupuesto (una fila por línea)
  const [presupuestoItems, setPresupuestoItems]     = useState([]);
  const [presupuestoModal, setPresupuestoModal]     = useState(false);
  const [presupuestoEdit, setPresupuestoEdit]       = useState(null);

  // Tareas
  const [usuarios, setUsuarios]         = useState([]);
  const [tareaModal, setTareaModal]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, brfs, nts, pres] = await Promise.all([
        reservasApi.getById(id),
        briefingsApi.getByReserva(id),
        notasApi.getByReserva(id),
        presupuestoApi.getByReserva(id),
      ]);
      setReserva(res.data);
      setBriefings(brfs.data || []);
      setNotas(nts.data || []);
      setPresupuestoItems(pres.data || []);
    } catch { setError('No se pudo cargar la reserva'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    proveedoresApi.getAll({}).then(r => setProveedores(r.data || [])).catch(() => {});
    usuariosApi.getAll().then(r => setUsuarios(r.data || [])).catch(() => {});
  }, []);

  const handleSaveReserva = async (data) => {
    await reservasApi.update(id, data);
    setEditModal(false);
    setSuccess('Reserva actualizada');
    load();
  };

  // Notas — CRUD por fila
  const handleSaveNota = async (data) => {
    if (notaEdit?.id) {
      await notasApi.update(notaEdit.id, { texto: data.texto });
      setSuccess('Nota actualizada');
    } else {
      await notasApi.create(data);
      setSuccess('Nota agregada');
    }
    setNotaModal(false); setNotaEdit(null);
    const r = await notasApi.getByReserva(id);
    setNotas(r.data || []);
  };

  const handleDeleteNota = async (notaId) => {
    if (!confirm('¿Eliminar esta nota?')) return;
    await notasApi.remove(notaId);
    setSuccess('Nota eliminada');
    const r = await notasApi.getByReserva(id);
    setNotas(r.data || []);
  };

  // Presupuesto — CRUD por fila
  const handleSavePresupuestoItem = async (data) => {
    if (presupuestoEdit?.id) {
      await presupuestoApi.update(presupuestoEdit.id, data);
      setSuccess('Ítem de presupuesto actualizado');
    } else {
      await presupuestoApi.create(data);
      setSuccess('Ítem de presupuesto agregado');
    }
    setPresupuestoModal(false); setPresupuestoEdit(null);
    const r = await presupuestoApi.getByReserva(id);
    setPresupuestoItems(r.data || []);
  };

  const handleDeletePresupuestoItem = async (itemId) => {
    if (!confirm('¿Eliminar este ítem de presupuesto?')) return;
    await presupuestoApi.remove(itemId);
    setSuccess('Ítem de presupuesto eliminado');
    const r = await presupuestoApi.getByReserva(id);
    setPresupuestoItems(r.data || []);
  };

  const handleCambiarEstado = async (estado) => {
    await reservasApi.cambiarEstado(id, estado);
    setSuccess('Estado actualizado');
    load();
  };

  const handleSavePax = async (data) => {
    if (data.id) await pasajerosApi.update(data.id, data);
    else         await pasajerosApi.create({ ...data, reserva_id: Number(id) });
    setPaxModal(false); setPaxEdit(null);
    setSuccess('Pasajero guardado');
    load();
  };

  const handleDeletePax = async (paxId) => {
    if (!confirm('¿Eliminar este pasajero de la reserva?')) return;
    await pasajerosApi.remove(paxId);
    setSuccess('Pasajero eliminado');
    load();
  };

  const handleSaveDetalle = async (data) => {
    if (detalleEdit?.id) {
      await proveedoresApi.updateDetalle(detalleEdit.id, data);
      setSuccess('Operación actualizada');
    } else {
      await proveedoresApi.createDetalle(data);
      setSuccess('Operación agregada');
    }
    setDetalleModal(false);
    setDetalleEdit(null);
    load();
  };

  const handleDeleteDetalle = async (detalleId) => {
    if (!confirm('¿Eliminar esta operación?')) return;
    await proveedoresApi.deleteDetalle(detalleId);
    setSuccess('Operación eliminada');
    load();
  };

  // Briefings handlers
  const handleSaveBriefing = async (data) => {
    if (briefingEdit?.id) {
      await briefingsApi.update(briefingEdit.id, data);
      setSuccess('Briefing actualizado');
    } else {
      await briefingsApi.create(data);
      setSuccess('Briefing creado');
    }
    setBriefingModal(false);
    setBriefingEdit(null);
    const brfs = await briefingsApi.getByReserva(id);
    setBriefings(brfs.data || []);
  };

  const handleDeleteBriefing = async (briefingId) => {
    if (!confirm('¿Eliminar este briefing?')) return;
    await briefingsApi.remove(briefingId);
    setSuccess('Briefing eliminado');
    const brfs = await briefingsApi.getByReserva(id);
    setBriefings(brfs.data || []);
  };

  const handleGenerarOrdenServicio = async () => {
    try {
      let itinerarios = [];
      if (reserva.servicio_id) {
        try {
          const r = await serviciosApi.getById(reserva.servicio_id);
          itinerarios = r.data?.itinerarios || [];
        } catch { /* si no se puede cargar el itinerario, se genera sin esa sección */ }
      }
      await generarOrdenServicioPDF({ reserva, briefings, itinerarios, notas, presupuestoItems });
    } catch {
      setError('No se pudo generar la orden de salida');
    }
  };

  const handleGenerarCierre = async () => {
    try {
      const blob = await reportesApi.generarCierreReserva(reserva.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Cierre-${reserva.codigo_reserva}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo generar el cierre de file');
    }
  };

  const handleGenerarInvoice = async () => {
    try {
      const lineItems = [
        {
          qty: reserva.n_pasajeros || 1,
          description: reserva.servicio_nombre || reserva.nombre_servicio_snap || 'Servicio turístico',
          unit_price: Number(reserva.precio_usd_por_pax),
        },
        ...(reserva.servicios_adicionales || []).map(e => ({
          qty: e.cantidad, description: e.nombre, unit_price: Number(e.precio_unitario_usd),
        })),
      ];
      const blob = await reportesApi.generarInvoice(reserva.id, { lineItems });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Invoice-${reserva.codigo_reserva}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo generar el invoice');
    }
  };

  const handleSaveTarea = async (data) => {
    await tareasApi.create(data);
    setTareaModal(false);
    setSuccess('Tarea agregada');
    load();
  };

  if (loading) return <PageLoader />;
  if (!reserva) return <Alert type="error" message={error || 'Reserva no encontrada'} />;

  const saldo = Number(reserva.saldo_usd);
  const totalesPresupuesto = presupuestoItems.reduce((acc, it) => {
    acc[it.moneda] = (acc[it.moneda] || 0) + Number(it.monto || 0);
    return acc;
  }, {});

  return (
    <div className="space-y-5 max-w-6xl">
      <button onClick={() => navigate('/reservas')} className="btn-ghost">
        <ArrowLeft size={16} /> Reservas
      </button>

      {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* ── Hero header ──────────────────────────────── */}
      <div className="relative rounded-3xl px-5 py-5 md:px-7 md:py-6"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', boxShadow: '0 8px 32px rgba(79,70,229,0.35)' }}>
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="absolute -bottom-8 right-16 w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono font-black text-2xl text-white leading-none">{reserva.codigo_reserva}</p>
              <p className="text-white/70 text-sm mt-1 font-medium leading-snug truncate">
                {reserva.servicio_nombre || reserva.nombre_servicio_snap || '—'}
              </p>
              {reserva.agencia_nombre && (
                <p className="text-white/50 text-xs mt-0.5 truncate">{reserva.agencia_nombre}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Dropdown estado */}
              <div className="relative">
                <button
                  onClick={() => setEstadoOpen(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all"
                  style={{ background: 'rgba(255,255,255,0.18)', color: 'white', borderColor: 'rgba(255,255,255,0.30)' }}>
                  {ESTADOS_OPERACION.find(e => e.value === reserva.estado_operacion)?.label || reserva.estado_operacion}
                  <ChevronDown size={12} className={`transition-transform ${estadoOpen ? 'rotate-180' : ''}`} />
                </button>
                {estadoOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setEstadoOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 rounded-2xl overflow-hidden z-50 min-w-[200px]"
                      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
                      {ESTADOS_OPERACION.map(e => (
                        <button key={e.value}
                          onClick={() => { handleCambiarEstado(e.value); setEstadoOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm cursor-pointer transition-colors"
                          style={reserva.estado_operacion === e.value
                            ? { background: 'var(--brand-bg)', color: 'var(--brand)', fontWeight: '700' }
                            : { color: 'var(--text-2)' }
                          }>
                          {e.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button onClick={handleGenerarOrdenServicio}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                style={{ background: 'rgba(255,255,255,0.18)', color: 'white' }}
                title="Genera el PDF de Orden de Salida con el formato real de Cusi Travel">
                <FileText size={14} /> Orden de servicio
              </button>
              <button onClick={handleGenerarInvoice}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                style={{ background: 'rgba(255,255,255,0.18)', color: 'white' }}
                title="Descarga el invoice en Excel, incluyendo los servicios adicionales">
                <Download size={14} /> Invoice
              </button>
              <button onClick={handleGenerarCierre}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                style={{ background: 'rgba(255,255,255,0.18)', color: 'white' }}
                title="Descarga el cierre de file de esta reserva en Excel">
                <FolderOpen size={14} /> Cierre de file
              </button>
              <button onClick={() => setEditModal(true)}
                className="p-2 rounded-xl cursor-pointer transition-all"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                <Edit2 size={15} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <EstadoPagoBadge estado={reserva.estado_pago} />
            {reserva.idioma_servicio && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}>
                {reserva.idioma_servicio}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-white/60 text-xs">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />
              {fmtFecha(reserva.fecha_inicio)} → {fmtFecha(reserva.fecha_fin)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={12} />
              {reserva.n_pasajeros} pax
            </span>
            {reserva.operador_nombre && (
              <span className="flex items-center gap-1.5">
                <MapPin size={12} />
                {reserva.operador_nombre}
              </span>
            )}
            {reserva.guia_nombre && (
              <span className="flex items-center gap-1.5">
                <Users size={12} />
                Guía: {reserva.guia_nombre}
              </span>
            )}
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            <FinanceCard label="Total"    value={fmtMoneda(reserva.total_usd)} />
            <FinanceCard label="Adelanto" value={fmtMoneda(reserva.adelanto_usd)} />
            <FinanceCard label="Saldo"    value={fmtMoneda(saldo)} warn={saldo > 0} />
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────── */}
      <div>
        <div className="md:hidden grid grid-cols-3 gap-2">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className="px-2 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center"
              style={tab === i
                ? { background: 'var(--brand)', color: 'white' }
                : { background: 'var(--card)', color: 'var(--text-2)', boxShadow: 'var(--shadow-sm)' }
              }>
              {t}
              {t === 'Pasajeros' && <span className="ml-1 opacity-70">({reserva.pasajeros?.length || 0})</span>}
              {t === 'Briefings' && <span className="ml-1 opacity-70">({briefings.length})</span>}
              {t === 'Notas' && <span className="ml-1 opacity-70">({notas.length})</span>}
              {t === 'Presupuesto' && <span className="ml-1 opacity-70">({presupuestoItems.length})</span>}
            </button>
          ))}
        </div>
        <div className="hidden md:block" style={{ borderBottom: '2px solid var(--border)' }}>
          <div className="flex gap-1">
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)}
                className="px-4 py-2.5 text-sm font-semibold border-b-2 -mb-0.5 transition-colors cursor-pointer"
                style={tab === i
                  ? { borderColor: 'var(--brand)', color: 'var(--brand)' }
                  : { borderColor: 'transparent', color: 'var(--text-2)' }
                }>
                {t}
                {(t === 'Pasajeros' || t === 'Tareas' || t === 'Operaciones' || t === 'Briefings' || t === 'Notas' || t === 'Presupuesto') && (
                  <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--card-2)', color: 'var(--text-3)' }}>
                    {t === 'Pasajeros'  ? reserva.pasajeros?.length || 0
                      : t === 'Tareas'  ? reserva.tareas?.length || 0
                      : t === 'Operaciones' ? reserva.detalles?.length || 0
                      : t === 'Briefings' ? briefings.length
                      : t === 'Notas' ? notas.length
                      : presupuestoItems.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab 0: Info ───────────────────────────────── */}
      {tab === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            ['Agencia', reserva.agencia_nombre],
            ['Código agencia', reserva.agencia_codigo],
            ['Operador', reserva.operador_nombre],
            ['Guía asignado', reserva.guia_nombre],
            ['Hora encuentro', reserva.hora_encuentro],
            ['Lugar encuentro', reserva.lugar_encuentro],
            ['Precio x pax', fmtMoneda(reserva.precio_usd_por_pax)],
            ['Adelanto', fmtMoneda(reserva.adelanto_usd)],
            ['Descuento', fmtMoneda(reserva.descuento_usd)],
          ].map(([label, val]) => (
            <div key={label} className="rounded-2xl p-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>{label}</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{val || '—'}</p>
            </div>
          ))}
          {reserva.servicios_adicionales?.length > 0 && (
            <div className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-2xl p-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>Servicios adicionales</p>
              <div className="space-y-1">
                {reserva.servicios_adicionales.map(e => (
                  <div key={e.id} className="flex justify-between text-sm" style={{ color: 'var(--text)' }}>
                    <span>{e.nombre} {e.cantidad > 1 ? `×${e.cantidad}` : ''}</span>
                    <span className="font-semibold">{fmtMoneda(Number(e.cantidad) * Number(e.precio_unitario_usd))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {briefings.length > 0 && (() => {
            const hoyISO = new Date().toISOString().slice(0, 10);
            const proximo = briefings.find(b => b.fecha >= hoyISO) || briefings[briefings.length - 1];
            return (
              <div className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-2xl p-4"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>
                  {proximo.fecha >= hoyISO ? 'Próximo briefing' : 'Último briefing'}
                </p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm" style={{ color: 'var(--text)' }}>
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Calendar size={13} style={{ color: 'var(--text-3)' }} /> {fmtFecha(proximo.fecha)}
                  </span>
                  {proximo.hora && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} style={{ color: 'var(--text-3)' }} /> {proximo.hora.slice(0, 5)}
                    </span>
                  )}
                  {proximo.lugar && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} style={{ color: 'var(--text-3)' }} /> {proximo.lugar}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Tab 1: Pasajeros ──────────────────────────── */}
      {tab === 1 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setPaxEdit(null); setPaxModal(true); }} className="btn-primary">
              <UserPlus size={16} /> Agregar pasajero
            </button>
          </div>
          {!reserva.pasajeros?.length ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <Users size={32} className="mx-auto mb-2" style={{ color: 'var(--text-3)' }} />
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>Sin pasajeros registrados</p>
            </div>
          ) : (
            <PaxTable
              pasajeros={reserva.pasajeros}
              onEdit={p => { setPaxEdit(p); setPaxModal(true); }}
              onDelete={handleDeletePax}
            />
          )}
        </div>
      )}

      {/* ── Tab 2: Operaciones ────────────────────────── */}
      {tab === 2 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setDetalleEdit(null); setDetalleModal(true); }} className="btn-primary">
              <Plus size={16} /> Agregar operación
            </button>
          </div>
          {!reserva.detalles?.length ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <DollarSign size={32} className="mx-auto mb-2" style={{ color: 'var(--text-3)' }} />
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>Sin operaciones registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reserva.detalles.map(d => (
                <OperacionRow key={d.id} d={d}
                  onEdit={d => { setDetalleEdit(d); setDetalleModal(true); }}
                  onDelete={handleDeleteDetalle} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Tareas ─────────────────────────────── */}
      {tab === 3 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setTareaModal(true)} className="btn-primary">
              <Plus size={16} /> Agregar tarea
            </button>
          </div>
          {!reserva.tareas?.length ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <CheckCircle2 size={32} className="mx-auto mb-2" style={{ color: 'var(--text-3)' }} />
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>Sin tareas vinculadas</p>
              <button onClick={() => navigate('/tareas')} className="mt-3 text-xs font-semibold" style={{ color: 'var(--brand)' }}>
                Ver todas las tareas →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {reserva.tareas.map(t => <TareaRow key={t.id} t={t} navigate={navigate} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: Briefings ──────────────────────────── */}
      {tab === 4 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setBriefingEdit(null); setBriefingModal(true); }} className="btn-primary">
              <FileText size={16} /> Agregar briefing
            </button>
          </div>
          {briefings.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <ClipboardList size={32} className="mx-auto mb-2" style={{ color: 'var(--text-3)' }} />
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>Sin briefings registrados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {briefings.map(b => (
                <BriefingRow key={b.id} b={b}
                  onEdit={b => { setBriefingEdit(b); setBriefingModal(true); }}
                  onDelete={handleDeleteBriefing} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 5: Notas ──────────────────────────────── */}
      {tab === 5 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setNotaEdit(null); setNotaModal(true); }} className="btn-primary">
              <Plus size={16} /> Agregar nota
            </button>
          </div>
          {notas.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <FileText size={32} className="mx-auto mb-2" style={{ color: 'var(--text-3)' }} />
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>Sin notas registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notas.map(n => (
                <NotaRow key={n.id} n={n}
                  onEdit={n => { setNotaEdit(n); setNotaModal(true); }}
                  onDelete={handleDeleteNota} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 6: Presupuesto ────────────────────────── */}
      {tab === 6 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-wrap gap-2">
              {Object.entries(totalesPresupuesto).map(([moneda, total]) => (
                <span key={moneda} className="text-sm font-bold px-3 py-1.5 rounded-xl"
                  style={{ background: 'var(--brand-bg)', color: 'var(--brand)' }}>
                  Total {moneda}: {fmtMoneda(total, moneda)}
                </span>
              ))}
            </div>
            <button onClick={() => { setPresupuestoEdit(null); setPresupuestoModal(true); }} className="btn-primary ml-auto">
              <Plus size={16} /> Agregar ítem
            </button>
          </div>
          {presupuestoItems.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <Wallet size={32} className="mx-auto mb-2" style={{ color: 'var(--text-3)' }} />
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>Sin ítems de presupuesto registrados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {presupuestoItems.map(p => (
                <PresupuestoRow key={p.id} p={p}
                  onEdit={p => { setPresupuestoEdit(p); setPresupuestoModal(true); }}
                  onDelete={handleDeletePresupuestoItem} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modales ───────────────────────────────────── */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar reserva" size="xl">
        <ReservaForm inicial={reserva} onSave={handleSaveReserva} onCancel={() => setEditModal(false)} />
      </Modal>

      <Modal open={paxModal} onClose={() => { setPaxModal(false); setPaxEdit(null); }}
        title={paxEdit ? 'Editar pasajero' : 'Agregar pasajero'} size="xl">
        <PasajeroForm reservaId={Number(id)} inicial={paxEdit}
          onSave={handleSavePax} onCancel={() => { setPaxModal(false); setPaxEdit(null); }} />
      </Modal>

      <Modal open={detalleModal} onClose={() => { setDetalleModal(false); setDetalleEdit(null); }}
        title={detalleEdit ? 'Editar operación' : 'Agregar operación'} size="lg">
        <DetalleForm
          reservaId={Number(id)}
          proveedores={proveedores}
          inicial={detalleEdit}
          onSave={handleSaveDetalle}
          onCancel={() => { setDetalleModal(false); setDetalleEdit(null); }}
        />
      </Modal>

      <Modal open={briefingModal} onClose={() => { setBriefingModal(false); setBriefingEdit(null); }}
        title={briefingEdit ? 'Editar briefing' : 'Nuevo briefing'}>
        <BriefingForm
          reservaId={Number(id)}
          inicial={briefingEdit}
          onSave={handleSaveBriefing}
          onCancel={() => { setBriefingModal(false); setBriefingEdit(null); }}
        />
      </Modal>

      <Modal open={tareaModal} onClose={() => setTareaModal(false)} title="Agregar tarea">
        <TareaForm
          usuarios={usuarios}
          reservaId={Number(id)}
          onSave={handleSaveTarea}
          onCancel={() => setTareaModal(false)}
        />
      </Modal>

      <Modal open={notaModal} onClose={() => { setNotaModal(false); setNotaEdit(null); }}
        title={notaEdit ? 'Editar nota' : 'Nueva nota'}>
        <NotaForm
          reservaId={Number(id)}
          inicial={notaEdit}
          onSave={handleSaveNota}
          onCancel={() => { setNotaModal(false); setNotaEdit(null); }}
        />
      </Modal>

      <Modal open={presupuestoModal} onClose={() => { setPresupuestoModal(false); setPresupuestoEdit(null); }}
        title={presupuestoEdit ? 'Editar ítem de presupuesto' : 'Nuevo ítem de presupuesto'}>
        <PresupuestoForm
          reservaId={Number(id)}
          inicial={presupuestoEdit}
          onSave={handleSavePresupuestoItem}
          onCancel={() => { setPresupuestoModal(false); setPresupuestoEdit(null); }}
        />
      </Modal>
    </div>
  );
}
