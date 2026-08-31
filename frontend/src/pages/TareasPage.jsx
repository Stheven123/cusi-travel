import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CheckCircle2, Clock, AlertTriangle, User, Search, X, ChevronDown, ClipboardList, Circle } from "lucide-react";
import { tareasApi } from "../api/tareas.api";
import { usuariosApi } from "../api/usuarios.api";
import { proveedoresApi } from "../api/proveedores.api";
import { PrioridadBadge, EstadoTareaBadge } from "../components/ui/Badge";
import { PageLoader } from "../components/ui/Spinner";
import Modal from "../components/ui/Modal";
import Alert from "../components/ui/Alert";
import { fmtFecha, fmtMoneda, localDateFromDateOnly } from "../utils/formatters";
import { PRIORIDADES_TAREA, ESTADOS_TAREA } from "../utils/constants";

const EMPTY = {
  titulo: "", descripcion: "", reserva_id: "",
  usuario_id: "", prioridad: "MEDIA", estado: "PENDIENTE", fecha_vencimiento: "",
};

const ESTADO_LABEL_MAP = {
  PENDIENTE: "Pendiente", EN_PROGRESO: "En progreso", COMPLETADA: "Completada", CANCELADA: "Cancelada",
};

const ESTADO_BG = {
  PENDIENTE: '#f59e0b', EN_PROGRESO: '#4361ee', COMPLETADA: '#10b981', CANCELADA: '#8892aa',
};

const PRIORIDAD_CLR = {
  URGENTE: '#ef4444', ALTA: '#f97316', MEDIA: '#4361ee', BAJA: '#c5cad8',
};

/* ── TareaForm ─────────────────────────────────────────────── */
export function TareaForm({ inicial, usuarios, reservaId, onSave, onCancel }) {
  const [f, setF] = useState({
    ...EMPTY, ...inicial,
    usuario_id: inicial?.usuario_id ?? "",
    reserva_id: inicial?.reserva_id ?? reservaId ?? "",
    fecha_vencimiento: inicial?.fecha_vencimiento ? inicial.fecha_vencimiento.slice(0, 10) : "",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // usuario_id es OBLIGATORIO: la tabla tareas_pendientes exige responsable (NOT NULL).
    if (!f.usuario_id) return;
    onSave({
      titulo: f.titulo, descripcion: f.descripcion || null,
      usuario_id: Number(f.usuario_id),
      reserva_id: reservaId ?? (f.reserva_id ? Number(f.reserva_id) : null),
      prioridad: f.prioridad, estado: f.estado,
      fecha_vencimiento: f.fecha_vencimiento || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="titulo">Titulo <span className="text-red-500">*</span></label>
        <input id="titulo" required className="input-field" value={f.titulo}
          onChange={e => set("titulo", e.target.value)} placeholder="Confirmar traslado aeropuerto..." />
      </div>
      <div>
        <label className="label" htmlFor="desc">Descripcion</label>
        <textarea id="desc" rows={3} className="input-field resize-none" value={f.descripcion}
          onChange={e => set("descripcion", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="prioridad">Prioridad</label>
          <select id="prioridad" className="input-field" value={f.prioridad} onChange={e => set("prioridad", e.target.value)}>
            {PRIORIDADES_TAREA.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="estado">Estado</label>
          <select id="estado" className="input-field" value={f.estado} onChange={e => set("estado", e.target.value)}>
            {ESTADOS_TAREA.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="asignado">Asignar a <span className="text-red-500">*</span></label>
        <select id="asignado" required className="input-field" value={f.usuario_id} onChange={e => set("usuario_id", e.target.value)}>
          <option value="">Selecciona un responsable…</option>
          {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido} ({u.rol})</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="vence">Fecha vencimiento</label>
          <input id="vence" type="date" className="input-field" value={f.fecha_vencimiento}
            onChange={e => set("fecha_vencimiento", e.target.value)} />
        </div>
        {reservaId == null && (
          <div>
            <label className="label" htmlFor="res_id">ID Reserva (número)</label>
            <input id="res_id" type="number" className="input-field" value={f.reserva_id}
              onChange={e => set("reserva_id", e.target.value)} placeholder="123" />
          </div>
        )}
      </div>
      <div className="flex gap-3 justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">Guardar tarea</button>
      </div>
    </form>
  );
}

/* ── TareaRow ──────────────────────────────────────────────── */
function TareaRow({ t, hoy, onCompletar, onEditar }) {
  const navigate = useNavigate();
  const vencida = t.fecha_vencimiento && localDateFromDateOnly(t.fecha_vencimiento) < hoy
    && t.estado !== "COMPLETADA" && t.estado !== "CANCELADA";
  const completada = t.estado === "COMPLETADA" || t.estado === "CANCELADA";
  const prioClr = PRIORIDAD_CLR[t.prioridad] || '#c5cad8';

  return (
    <div className={`flex items-center gap-3 md:gap-4 py-3 md:py-5 px-4 md:px-6 rounded-2xl relative overflow-hidden ${completada ? 'opacity-55' : ''}`}
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="absolute left-0 top-0 bottom-0 w-1 md:w-1.5 rounded-l-2xl" style={{ background: prioClr }} />
      <div className="pl-2 md:pl-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {t.prioridad === "URGENTE" && !completada && (
            <AlertTriangle size={17} className="text-red-500 flex-shrink-0" />
          )}
          <p className="font-semibold text-sm md:text-base truncate" style={{ color: 'var(--text)' }}>{t.titulo}</p>
        </div>
        <div className="flex flex-wrap gap-x-3 md:gap-x-5 gap-y-0.5 mt-1 text-xs md:text-sm" style={{ color: 'var(--text-2)' }}>
          {t.codigo_reserva && (
            <button onClick={() => t.reserva_id && navigate(`/reservas/${t.reserva_id}`)}
              className="font-mono font-medium hover:underline cursor-pointer"
              style={{ color: 'var(--brand)' }}>
              {t.codigo_reserva}
            </button>
          )}
          <span className="flex items-center gap-1">
            <User size={10} />{t.asignado_a || "Sin asignar"}
          </span>
          {t.fecha_vencimiento && (
            <span className={`flex items-center gap-1 ${vencida ? 'text-red-500 font-semibold' : ''}`}
              style={!vencida ? { color: 'var(--text-3)' } : {}}>
              <Clock size={10} />{vencida ? 'Vencida · ' : ''}{fmtFecha(t.fecha_vencimiento)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <PrioridadBadge prioridad={t.prioridad} />
        <EstadoTareaBadge estado={t.estado} />
        <button onClick={() => onEditar(t)}
          className="text-xs md:text-sm px-2 md:px-3 py-1.5 rounded-lg transition-colors cursor-pointer min-h-[36px] md:min-h-[44px]"
          style={{ color: 'var(--text-2)' }}>
          Editar
        </button>
        {!completada && (
          <button onClick={() => onCompletar(t)}
            className="text-xs md:text-sm px-2 md:px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer min-h-[36px] md:min-h-[44px]"
            style={{ color: '#059669' }}>
            <CheckCircle2 size={16} />
            <span className="hidden sm:inline">Completar</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── TareaCard (mobile) ────────────────────────────────────── */
function TareaCard({ t, hoy, onCompletar, onEditar }) {
  const navigate = useNavigate();
  const vencida = t.fecha_vencimiento && localDateFromDateOnly(t.fecha_vencimiento) < hoy
    && t.estado !== "COMPLETADA" && t.estado !== "CANCELADA";
  const completada = t.estado === "COMPLETADA" || t.estado === "CANCELADA";
  const prioClr = PRIORIDAD_CLR[t.prioridad] || '#c5cad8';
  return (
    <div className={`rounded-2xl p-4 flex flex-col gap-3 ${completada ? "opacity-50" : ""}`}
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)', borderLeft: `3px solid ${prioClr}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {t.prioridad === "URGENTE" && !completada && <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />}
          <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--text)' }}>{t.titulo}</p>
        </div>
        <PrioridadBadge prioridad={t.prioridad} />
      </div>
      {t.descripcion && <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-2)' }}>{t.descripcion}</p>}
      <div className="flex flex-wrap gap-2 text-xs">
        {t.codigo_reserva && (
          <button onClick={() => t.reserva_id && navigate(`/reservas/${t.reserva_id}`)}
            className="px-2 py-0.5 rounded-full font-mono font-medium hover:opacity-80 cursor-pointer"
            style={{ background: 'var(--brand-bg)', color: 'var(--brand)' }}>
            {t.codigo_reserva}
          </button>
        )}
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ background: 'var(--card-2)', color: 'var(--text-2)' }}>
          <User size={11} />{t.asignado_a || "Sin asignar"}
        </span>
      </div>
      <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <EstadoTareaBadge estado={t.estado} />
          {t.fecha_vencimiento && (
            <span className={`text-xs flex items-center gap-1 ${vencida ? "text-red-600 font-semibold" : ""}`}
              style={!vencida ? { color: 'var(--text-3)' } : {}}>
              <Clock size={11} />{vencida ? "Vencida " : ""}{fmtFecha(t.fecha_vencimiento)}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEditar(t)}
            className="text-xs px-2 py-1.5 rounded-lg transition-colors cursor-pointer min-h-[36px]"
            style={{ color: 'var(--text-2)' }}>
            Editar
          </button>
          {!completada && (
            <button onClick={() => onCompletar(t)}
              className="text-xs px-2 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
              style={{ color: '#059669' }}>
              <CheckCircle2 size={13} /> Completar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Tareas de operaciones (checklist por operación de proveedor) ─── */
function TareaOperacionRow({ t, onToggle, onEditar, navigate }) {
  return (
    <div className={`flex items-center gap-3 py-3 px-4 rounded-2xl relative overflow-hidden ${t.completada ? 'opacity-55' : ''}`}
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
      <button onClick={() => onToggle(t)} className="flex-shrink-0 cursor-pointer"
        style={{ color: t.completada ? '#10b981' : 'var(--text-3)' }} title="Marcar completada">
        {t.completada ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${t.completada ? 'line-through' : ''}`} style={{ color: 'var(--text)' }}>{t.titulo}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs" style={{ color: 'var(--text-2)' }}>
          {t.codigo_reserva && (
            <button onClick={() => navigate(`/reservas/${t.reserva_id}`)}
              className="font-mono font-medium hover:underline cursor-pointer" style={{ color: 'var(--brand)' }}>
              {t.codigo_reserva}
            </button>
          )}
          {t.tipo_servicio && <span>{t.tipo_servicio}</span>}
          {t.proveedor_nombre && <span>{t.proveedor_nombre}</span>}
          {t.persona_encargada && <span className="flex items-center gap-1"><User size={10} />{t.persona_encargada}</span>}
          {t.fecha && <span className="flex items-center gap-1"><Clock size={10} />{fmtFecha(t.fecha)}</span>}
        </div>
      </div>
      {t.monto != null && (
        <span className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--text)' }}>{fmtMoneda(t.monto)}</span>
      )}
      <button onClick={() => onEditar(t)}
        className="text-xs px-2 py-1.5 rounded-lg transition-colors cursor-pointer flex-shrink-0 min-h-[36px]"
        style={{ color: 'var(--text-2)' }}>
        Editar
      </button>
    </div>
  );
}

/* ── Form de edición de tarea de operación ────────────────────── */
function TareaOperacionForm({ inicial, onSave, onCancel }) {
  const [f, setF] = useState({
    titulo: inicial?.titulo || '',
    fecha: inicial?.fecha ? inicial.fecha.slice(0, 10) : '',
    monto: inicial?.monto ?? '',
    persona_encargada: inicial?.persona_encargada || '',
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      titulo: f.titulo,
      fecha: f.fecha || null,
      monto: f.monto === '' ? null : Number(f.monto),
      persona_encargada: f.persona_encargada || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Título <span className="text-red-500">*</span></label>
        <input required className="input-field" value={f.titulo} onChange={e => set('titulo', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Fecha</label>
          <input type="date" className="input-field" value={f.fecha} onChange={e => set('fecha', e.target.value)} />
        </div>
        <div>
          <label className="label">Monto</label>
          <input type="number" step="0.01" className="input-field" value={f.monto}
            onChange={e => set('monto', e.target.value)} placeholder="0.00" />
        </div>
      </div>
      <div>
        <label className="label">Persona encargada</label>
        <input className="input-field" value={f.persona_encargada} onChange={e => set('persona_encargada', e.target.value)} />
      </div>
      <div className="flex gap-3 justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">Guardar</button>
      </div>
    </form>
  );
}

function TareasOperacionSection() {
  const [tareas, setTareas] = useState(null);
  const [error, setError]   = useState('');
  const [editModal, setEditModal] = useState(false);
  const [editando, setEditando]   = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try { const r = await proveedoresApi.getAllTareasOperacion(); setTareas(r.data || []); }
    catch { setError('No se pudieron cargar las tareas de operaciones'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (t) => {
    setTareas(prev => prev.map(x => x.id === t.id ? { ...x, completada: !t.completada } : x));
    try { await proveedoresApi.updateTareaOperacion(t.id, { completada: !t.completada }); }
    catch { load(); }
  };

  const abrirEditar = (t) => { setEditando(t); setEditModal(true); };

  const guardarEdicion = async (data) => {
    try {
      await proveedoresApi.updateTareaOperacion(editando.id, data);
      setEditModal(false); setEditando(null);
      await load();
    } catch { setError('No se pudo actualizar la tarea'); }
  };

  if (tareas === null) return <PageLoader />;

  const pendientes = tareas.filter(t => !t.completada);
  const completadas = tareas.filter(t => t.completada);

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
        Checklist de tareas de cada operación (hoteles, guías, transportes...) de todas las reservas.
      </p>
      {tareas.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-2)' }}>
          <ClipboardList size={40} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
          <p>No hay tareas de operaciones registradas</p>
        </div>
      ) : (
        <>
          {pendientes.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#f59e0b' }} />
                <p className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>Pendientes</p>
                <span className="text-xs md:text-sm px-2.5 py-0.5 rounded-full font-semibold" style={{ background: '#f59e0b22', color: '#f59e0b' }}>
                  {pendientes.length}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
              <div className="space-y-2.5">
                {pendientes.map(t => <TareaOperacionRow key={t.id} t={t} onToggle={toggle} onEditar={abrirEditar} navigate={navigate} />)}
              </div>
            </div>
          )}
          {completadas.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#10b981' }} />
                <p className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>Completadas</p>
                <span className="text-xs md:text-sm px-2.5 py-0.5 rounded-full font-semibold" style={{ background: '#10b98122', color: '#10b981' }}>
                  {completadas.length}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
              <div className="space-y-2.5">
                {completadas.map(t => <TareaOperacionRow key={t.id} t={t} onToggle={toggle} onEditar={abrirEditar} navigate={navigate} />)}
              </div>
            </div>
          )}
        </>
      )}
      <Modal open={editModal} onClose={() => { setEditModal(false); setEditando(null); }} title="Editar tarea de operación">
        <TareaOperacionForm inicial={editando} onSave={guardarEdicion}
          onCancel={() => { setEditModal(false); setEditando(null); }} />
      </Modal>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */
export default function TareasPage() {
  const [tareas, setTareas]      = useState([]);
  const [usuarios, setUsuarios]  = useState([]);
  const [loading, setLoading]    = useState(true);
  const [error, setError]        = useState("");
  const [success, setSuccess]    = useState("");
  const [modal, setModal]        = useState(false);
  const [editando, setEditando]  = useState(null);
  const [cierreModal, setCierre] = useState(null);
  const [notas, setNotas]        = useState("");
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [filtros, setFiltros]    = useState({
    estado: "", prioridad: "", usuario_id: "",
    fecha_desde: "", fecha_hasta: "", busqueda: "",
  });
  const [mobileTab, setMobileTab]= useState("PENDIENTE");
  const [vista, setVista]        = useState("generales");

  const setF = (k, v) => setFiltros(p => ({ ...p, [k]: v }));

  const activeFilterCount = Object.entries(filtros)
    .filter(([, v]) => v !== "").length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtros.estado)      params.estado      = filtros.estado;
      if (filtros.prioridad)   params.prioridad   = filtros.prioridad;
      if (filtros.usuario_id)  params.usuario_id  = filtros.usuario_id;
      if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde;
      if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta;
      if (filtros.busqueda)    params.busqueda    = filtros.busqueda;
      const [t, u] = await Promise.all([tareasApi.getAll(params), usuariosApi.getAll()]);
      setTareas(t.data || []); setUsuarios(u.data || []);
    } catch { setError("Error al cargar tareas"); }
    finally { setLoading(false); }
  }, [filtros]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    try {
      if (editando?.id) await tareasApi.update(editando.id, data);
      else              await tareasApi.create(data);
      setModal(false); setEditando(null); setSuccess("Tarea guardada"); load();
    } catch (e) { setError(e.response?.data?.message || "Error al guardar"); }
  };

  const handleCompletar = async () => {
    try {
      await tareasApi.completar(cierreModal.id, notas);
      setCierre(null); setNotas(""); setSuccess("Tarea completada"); load();
    } catch { setError("Error al completar la tarea"); }
  };

  const clearFiltros = () => setFiltros({ estado: "", prioridad: "", usuario_id: "", fecha_desde: "", fecha_hasta: "", busqueda: "" });

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

  const grupos = {
    PENDIENTE:   tareas.filter(t => t.estado === "PENDIENTE"),
    EN_PROGRESO: tareas.filter(t => t.estado === "EN_PROGRESO"),
    COMPLETADA:  tareas.filter(t => t.estado === "COMPLETADA"),
    CANCELADA:   tareas.filter(t => t.estado === "CANCELADA"),
  };

  const vencidas = tareas.filter(t =>
    t.fecha_vencimiento && localDateFromDateOnly(t.fecha_vencimiento) < hoy
    && t.estado !== "COMPLETADA" && t.estado !== "CANCELADA"
  );

  return (
    <div className="space-y-4">
      {error   && <Alert type="error"   message={error}   onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      {/* ── Pestañas: generales / operaciones ─── */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
        {[
          { key: 'generales',   label: 'Generales',   icon: CheckCircle2 },
          { key: 'operaciones', label: 'Operaciones',  icon: ClipboardList },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setVista(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
            style={vista === key
              ? { background: 'var(--brand)', color: 'white', boxShadow: 'var(--shadow-sm)' }
              : { color: 'var(--text-2)' }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {vista === 'operaciones' && <TareasOperacionSection />}

      {vista === 'generales' && (
      <>
      {/* ── Barra superior ─── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
          <input className="input-field pl-9 pr-8" placeholder="Buscar por título o código reserva..."
            value={filtros.busqueda} onChange={e => setF("busqueda", e.target.value)} />
          {filtros.busqueda && (
            <button className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              onClick={() => setF("busqueda", "")} style={{ color: 'var(--text-3)' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Toggle filtros avanzados */}
        <button
          onClick={() => setFiltrosOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors"
          style={activeFilterCount > 0
            ? { background: 'var(--brand)', color: 'white' }
            : { background: 'var(--card)', color: 'var(--text-2)', boxShadow: 'var(--shadow-sm)' }}>
          Filtros
          {activeFilterCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }}>
              {activeFilterCount}
            </span>
          )}
          <ChevronDown size={14} className={`transition-transform ${filtrosOpen ? 'rotate-180' : ''}`} />
        </button>

        {vencidas.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border cursor-default"
            style={{ color: '#dc2626', background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
            <AlertTriangle size={13} /> {vencidas.length} vencida{vencidas.length !== 1 ? "s" : ""}
          </span>
        )}
        <button onClick={() => { setEditando(null); setModal(true); }} className="btn-primary ml-auto">
          <Plus size={16} /> Nueva tarea
        </button>
      </div>

      {/* ── Panel de filtros avanzados ─── */}
      {filtrosOpen && (
        <div className="rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <select className="input-field" value={filtros.estado} onChange={e => setF("estado", e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS_TAREA.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
          <select className="input-field" value={filtros.prioridad} onChange={e => setF("prioridad", e.target.value)}>
            <option value="">Toda prioridad</option>
            {PRIORIDADES_TAREA.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select className="input-field" value={filtros.usuario_id} onChange={e => setF("usuario_id", e.target.value)}>
            <option value="">Todos los usuarios</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
          </select>
          <div>
            <label className="label text-xs">Vence desde</label>
            <input type="date" className="input-field" value={filtros.fecha_desde}
              onChange={e => setF("fecha_desde", e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">Vence hasta</label>
            <input type="date" className="input-field" value={filtros.fecha_hasta}
              onChange={e => setF("fecha_hasta", e.target.value)} />
          </div>
          <button onClick={clearFiltros} className="btn-secondary flex items-center gap-1 justify-center text-sm">
            <X size={13} /> Limpiar
          </button>
        </div>
      )}

      {loading ? <PageLoader /> : (
        <>
          {/* ── MOBILE: tabs por estado + cards ── */}
          <div className="md:hidden space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ESTADO_LABEL_MAP).map(([estado, label]) => {
                const active = mobileTab === estado;
                const clr = ESTADO_BG[estado];
                return (
                  <button key={estado} onClick={() => setMobileTab(estado)}
                    className="py-3 px-3 rounded-2xl text-xs font-semibold text-center transition-all cursor-pointer"
                    style={active
                      ? { background: clr, color: 'white', boxShadow: `0 4px 14px ${clr}44` }
                      : { background: 'var(--card)', color: 'var(--text-2)', boxShadow: 'var(--shadow-sm)' }
                    }>
                    {label}
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                      style={{ background: active ? 'rgba(255,255,255,0.22)' : 'var(--card-2)' }}>
                      {grupos[estado]?.length || 0}
                    </span>
                  </button>
                );
              })}
            </div>
            {grupos[mobileTab]?.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--text-2)' }}>
                <CheckCircle2 size={32} className="mx-auto mb-2" style={{ color: 'var(--text-3)' }} />
                <p className="text-sm">Sin tareas en este estado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {grupos[mobileTab].map(t => (
                  <TareaCard key={t.id} t={t} hoy={hoy}
                    onCompletar={t => { setCierre(t); setNotas(""); }}
                    onEditar={t => { setEditando(t); setModal(true); }} />
                ))}
              </div>
            )}
          </div>

          {/* ── DESKTOP: lista agrupada por estado ── */}
          <div className="hidden md:block space-y-6">
            {Object.entries(ESTADO_LABEL_MAP).map(([estado, label]) => {
              const lista = grupos[estado] || [];
              if (lista.length === 0) return null;
              const clr = ESTADO_BG[estado];
              return (
                <div key={estado}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: clr }} />
                    <p className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>
                      {label}
                    </p>
                    <span className="text-xs md:text-sm px-2.5 py-0.5 rounded-full font-semibold"
                      style={{ background: `${clr}22`, color: clr }}>
                      {lista.length}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  </div>
                  <div className="space-y-2.5">
                    {lista.map(t => (
                      <TareaRow key={t.id} t={t} hoy={hoy}
                        onCompletar={t => { setCierre(t); setNotas(""); }}
                        onEditar={t => { setEditando(t); setModal(true); }} />
                    ))}
                  </div>
                </div>
              );
            })}
            {tareas.length === 0 && (
              <div className="text-center py-16" style={{ color: 'var(--text-2)' }}>
                <CheckCircle2 size={40} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
                <p>No hay tareas que coincidan con los filtros</p>
              </div>
            )}
          </div>
        </>
      )}
      </>
      )}

      {/* ── Modal nueva/editar tarea ── */}
      <Modal open={modal} onClose={() => { setModal(false); setEditando(null); }}
        title={editando ? "Editar tarea" : "Nueva tarea"}>
        <TareaForm inicial={editando} usuarios={usuarios} onSave={handleSave}
          onCancel={() => { setModal(false); setEditando(null); }} />
      </Modal>

      {/* ── Modal completar tarea ── */}
      <Modal open={!!cierreModal} onClose={() => setCierre(null)} title="Completar tarea">
        <div className="space-y-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{cierreModal?.titulo}</p>
          <div>
            <label className="label" htmlFor="notas_c">Notas de cierre (opcional)</label>
            <textarea id="notas_c" rows={3} className="input-field resize-none" value={notas}
              onChange={e => setNotas(e.target.value)} placeholder="Observaciones al cerrar..." />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setCierre(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCompletar} className="btn-primary cursor-pointer"
              style={{ background: '#059669' }}>
              <CheckCircle2 size={16} /> Marcar completada
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
