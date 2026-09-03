import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Copy, Search, Clock, Mountain, Bike, MapPin,
  Package, Plane, Pencil, Star, ChevronDown, ChevronUp,
  FileText, Navigation, Users, Globe, CalendarDays,
  Percent, MessageSquare, Download, X,
} from 'lucide-react';
import { serviciosApi } from '../api/servicios.api';
import { PageLoader } from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import ServicioForm from '../components/servicios/ServicioForm';
import { fmtMoneda } from '../utils/formatters';
import { IDIOMAS } from '../utils/constants';
import { generarCotizacionPDF } from '../utils/cotizacionPDF';

// ── Metadatos por tipo ────────────────────────────────────────
const TIPO_META = {
  TREK:             { label: 'Trekking',        icon: Mountain,  bg: 'from-emerald-500 to-teal-700' },
  DAY_TOUR:         { label: 'Tour 1 día',       icon: MapPin,    bg: 'from-sky-500 to-blue-700' },
  CITY_TOUR:        { label: 'City Tour',        icon: Navigation,bg: 'from-violet-500 to-purple-700' },
  TRANSFER:         { label: 'Transfer',         icon: Bike,      bg: 'from-amber-500 to-orange-600' },
  MULTI_DAY:        { label: 'Multi-día',        icon: Clock,     bg: 'from-rose-500 to-pink-700' },
  VUELO:            { label: 'Vuelo',            icon: Plane,     bg: 'from-slate-500 to-gray-700' },
  PAQUETE_COMPLETO: { label: 'Paquete completo', icon: Package,   bg: 'from-brand-600 to-brand-800' },
};

const DIFICULTAD_STARS = { FACIL: 1, MODERADO: 2, DIFICIL: 3, MUY_DIFICIL: 4, EXTREMO: 5 };
const DIFICULTAD_LABEL = {
  FACIL: 'Fácil', MODERADO: 'Moderado', DIFICIL: 'Difícil',
  MUY_DIFICIL: 'Muy difícil', EXTREMO: 'Extremo',
};

function Stars({ nivel }) {
  const n = DIFICULTAD_STARS[nivel] || 1;
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={10}
          className={i <= n ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  );
}

// ── Card compacta ─────────────────────────────────────────────
function ServicioCard({ s, onEditar, onClonar, onCotizar }) {
  const [open, setOpen] = useState(false);
  const meta = TIPO_META[s.tipo] || TIPO_META.PAQUETE_COMPLETO;
  const Icon = meta.icon;

  return (
    <article className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
      {/* ── Franja superior coloreada ── */}
      <div className={`bg-gradient-to-r ${meta.bg} px-4 md:px-5 py-3 md:py-5 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
          <div className="w-7 h-7 md:w-11 md:h-11 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon size={15} className="md:hidden text-white" />
            <Icon size={22} className="hidden md:block text-white" />
          </div>
          <div className="min-w-0">
            <span className="text-white/70 font-mono text-xs md:text-sm">{s.codigo}</span>
            <h3 className="text-white font-bold text-sm md:text-base leading-tight truncate">{s.nombre}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!s.activo && (
            <span className="bg-black/30 text-white text-xs px-1.5 py-0.5 rounded">Inact.</span>
          )}
          <span className="bg-white/20 text-white text-xs md:text-sm px-2 md:px-3 py-0.5 rounded-full">{meta.label}</span>
        </div>
      </div>

      {/* ── Stats en fila ── */}
      <div className="flex items-center" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex-1 min-w-0 px-3 md:px-4 py-2.5 md:py-4 text-center" style={{ borderRight: '1px solid var(--border)' }}>
          <p className="text-base md:text-xl font-bold break-words" style={{ color: 'var(--text)' }}>{s.duracion_dias}</p>
          <p className="text-xs md:text-sm" style={{ color: 'var(--text-3)' }}>día{s.duracion_dias !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 min-w-0 px-3 md:px-4 py-2.5 md:py-4 text-center" style={{ borderRight: '1px solid var(--border)' }}>
          <p className="text-base md:text-xl font-bold break-words" style={{ color: 'var(--brand)' }}>{fmtMoneda(s.precio_base_usd)}</p>
          <p className="text-xs md:text-sm" style={{ color: 'var(--text-3)' }}>/ pax</p>
        </div>
        <div className="flex-1 min-w-0 px-3 md:px-4 py-2.5 md:py-4 text-center" style={{ borderRight: '1px solid var(--border)' }}>
          {s.nivel_dificultad ? (
            <>
              <Stars nivel={s.nivel_dificultad} />
              <p className="text-xs md:text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{DIFICULTAD_LABEL[s.nivel_dificultad]}</p>
            </>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>—</p>
          )}
        </div>
        <div className="flex-1 px-3 md:px-4 py-2.5 md:py-4 text-center">
          <p className="text-base md:text-xl font-bold" style={{ color: 'var(--text)' }}>{s.total_dias_itinerario || 0}</p>
          <p className="text-xs md:text-sm" style={{ color: 'var(--text-3)' }}>etapas</p>
        </div>
      </div>

      {/* ── Itinerario colapsable ── */}
      {s.itinerarios?.length > 0 && (
        <>
          <button
            onClick={() => setOpen(p => !p)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs transition-colors"
            style={{ color: 'var(--text-2)' }}
          >
            <span>{open ? 'Ocultar' : 'Ver'} itinerario ({s.itinerarios.length} etapas)</span>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {open && (
            <div className="max-h-48 overflow-y-auto" style={{ borderTop: '1px solid var(--border)', background: 'var(--card-2)' }}>
              {s.itinerarios.map(it => (
                <div key={it.id} className="flex items-start gap-2.5 px-4 py-2.5"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="w-6 h-6 text-white rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--brand)' }}>
                    {it.dia_numero}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text)' }}>{it.titulo}</p>
                    <div className="flex flex-wrap gap-2 mt-0.5">
                      {it.altitud_max_msnm && (
                        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                          <Mountain size={9} />{it.altitud_max_msnm} m
                        </span>
                      )}
                      {it.distancia_km && (
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>{it.distancia_km} km</span>
                      )}
                      {it.horas_caminata && (
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>{it.horas_caminata}h</span>
                      )}
                      {(it.desayuno || it.almuerzo || it.cena) && (
                        <span className="text-xs text-emerald-600">
                          {[it.desayuno&&'D',it.almuerzo&&'A',it.cena&&'C',it.box_lunch&&'BL'].filter(Boolean).join('·')}
                        </span>
                      )}
                      {it.alojamiento && (
                        <span className="text-xs text-indigo-500 truncate max-w-[120px]">{it.alojamiento}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Acciones ── */}
      <div className="flex" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={() => onCotizar(s)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 md:py-4 text-xs md:text-sm font-semibold text-white transition-colors"
          style={{ background: 'var(--brand)' }}>
          <FileText size={13} /> Cotizar
        </button>
        <button onClick={() => onEditar(s)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 md:py-4 text-xs md:text-sm font-medium transition-colors"
          style={{ color: 'var(--text-2)', borderLeft: '1px solid var(--border)' }}>
          <Pencil size={13} /> Editar
        </button>
        <button onClick={() => onClonar(s)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 md:py-4 text-xs md:text-sm font-medium transition-colors"
          style={{ color: 'var(--text-2)', borderLeft: '1px solid var(--border)' }}>
          <Copy size={13} /> Clonar
        </button>
      </div>
    </article>
  );
}

// ── Cotizador modal ───────────────────────────────────────────
const COT_EMPTY = {
  cliente_nombre: '', cliente_email: '', cliente_telefono: '', cliente_ciudad: '',
  agencia: '',
  n_pasajeros: 2, fecha_inicio: '', idioma: 'Español',
  descuento_pct: 0, notas: '', pdf_lang: 'en',
};

function CotizadorModal({ servicio, onClose }) {
  const [f, setF]       = useState(COT_EMPTY);
  const [loading, setL] = useState(false);
  const [generated, setG] = useState('');
  const [pdfError, setPdfError] = useState('');
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  if (!servicio) return null;

  const precioBase  = Number(servicio.precio_base_usd);
  const pax         = Number(f.n_pasajeros) || 1;
  const pct         = Number(f.descuento_pct) || 0;
  const subtotal    = precioBase * pax;
  const descuento   = subtotal * pct / 100;
  const total       = subtotal - descuento;

  const fmtUSD = (n) => new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(n);

  const handleGenerar = async () => {
    if (!f.cliente_nombre) return;
    setL(true);
    setPdfError('');
    setG('');
    try {
      const cotNum = await generarCotizacionPDF(servicio, f, f.pdf_lang || 'es');
      setG(cotNum);
    } catch (e) {
      console.error(e);
      setPdfError(e?.message || String(e) || 'Error al generar el PDF');
    } finally {
      setL(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-800 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <p className="text-white/70 text-xs font-medium mb-0.5">GENERAR COTIZACIÓN</p>
            <h2 className="text-white font-bold text-base leading-tight">{servicio.nombre}</h2>
            <p className="text-white/60 text-xs mt-0.5">
              {servicio.duracion_dias} día{servicio.duracion_dias!==1?'s':''} · desde {fmtUSD(precioBase)}/pax
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Datos del cliente */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-2)' }}>Datos del cliente</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Nombre del cliente <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className="input-field pl-9" value={f.cliente_nombre}
                    onChange={e => set('cliente_nombre', e.target.value)}
                    placeholder="James O'Brien" />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input-field" value={f.cliente_email}
                  onChange={e => set('cliente_email', e.target.value)}
                  placeholder="cliente@email.com" />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input className="input-field" value={f.cliente_telefono}
                  onChange={e => set('cliente_telefono', e.target.value)}
                  placeholder="+1 555 000 0000" />
              </div>
              <div>
                <label className="label">Ciudad</label>
                <input className="input-field" value={f.cliente_ciudad}
                  onChange={e => set('cliente_ciudad', e.target.value)}
                  placeholder="New York, USA" />
              </div>
              <div className="col-span-2">
                <label className="label">Agencia / Operadora</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className="input-field pl-9" value={f.agencia}
                    onChange={e => set('agencia', e.target.value)}
                    placeholder="Andean Dream Tours" />
                </div>
              </div>
            </div>
          </div>

          {/* Detalles del viaje */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-2)' }}>Detalles del viaje</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2">
                <label className="label">Fecha de inicio</label>
                <div className="relative">
                  <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" className="input-field pl-9" value={f.fecha_inicio}
                    onChange={e => set('fecha_inicio', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">N° pasajeros</label>
                <div className="relative">
                  <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="number" min={1} max={99} className="input-field pl-9" value={f.n_pasajeros}
                    onChange={e => set('n_pasajeros', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Idioma guía</label>
                <div className="relative">
                  <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select className="input-field pl-9" value={f.idioma}
                    onChange={e => set('idioma', e.target.value)}>
                    {IDIOMAS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Precio */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-2)' }}>Precio</h3>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="label">Descuento (%)</label>
                <div className="relative">
                  <Percent size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                  <input type="number" min={0} max={100} className="input-field pl-9" value={f.descuento_pct}
                    onChange={e => set('descuento_pct', e.target.value)} placeholder="0" />
                </div>
              </div>
              {/* Preview de precios */}
              <div className="rounded-xl px-4 py-3 space-y-1.5" style={{ background: 'var(--card-2)' }}>
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-2)' }}>
                  <span>{fmtUSD(precioBase)} × {pax} pax</span>
                  <span className="font-medium">{fmtUSD(subtotal)}</span>
                </div>
                {pct > 0 && (
                  <div className="flex justify-between text-xs text-red-500">
                    <span>Descuento ({pct}%)</span>
                    <span>−{fmtUSD(descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>TOTAL</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--brand)' }}>{fmtUSD(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="label">
              <MessageSquare size={13} className="inline mr-1.5 text-gray-400" />
              Requerimientos especiales
            </label>
            <textarea rows={2} className="input-field resize-none text-sm" value={f.notas}
              onChange={e => set('notas', e.target.value)}
              placeholder="Alergias, necesidades especiales, solicitudes del cliente..." />
          </div>

          {/* Idioma del PDF */}
          <div>
            <label className="label">Idioma del PDF</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ val:'es', label:'🇵🇪  Español' }, { val:'en', label:'🇺🇸  English' }].map(opt => (
                <button key={opt.val} type="button"
                  onClick={() => set('pdf_lang', opt.val)}
                  className="py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all cursor-pointer"
                  style={f.pdf_lang === opt.val
                    ? { background:'#4361ee', color:'white', borderColor:'#4361ee' }
                    : { background:'#f1f5f9', color:'#475569', borderColor:'#e2e8f0' }
                  }>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col gap-3">
            {pdfError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm">
                <span className="font-bold flex-shrink-0">Error:</span>
                <span>{pdfError}</span>
              </div>
            )}
            {generated && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-sm">
                <Download size={16} />
                <span>PDF generado: <strong>{generated}</strong> — revisa tus descargas.</span>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={handleGenerar}
                disabled={!f.cliente_nombre || loading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading
                  ? <span className="animate-spin">⟳</span>
                  : <><Download size={16} /> Generar PDF</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function ServiciosPage() {
  const [servicios, setServicios]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [modal, setModal]           = useState(false);
  const [editando, setEditando]     = useState(null);
  const [clonarModal, setClonarM]   = useState(null);
  const [clonarForm, setClonarF]    = useState({ nuevo_codigo: '', nuevo_nombre: '' });
  const [cotizador, setCotizador]   = useState(null);
  const [busqueda, setBusqueda]     = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');

  // Evita que una respuesta lenta de una búsqueda anterior sobreescriba los
  // resultados de la búsqueda más reciente (cada tecleo dispara un fetch).
  const loadSeq = useRef(0);
  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    try {
      const r = await serviciosApi.getAll(busqueda ? { busqueda } : {});
      if (seq !== loadSeq.current) return;
      setServicios(r.data || []);
    } catch { if (seq === loadSeq.current) setError('Error al cargar paquetes'); }
    finally { if (seq === loadSeq.current) setLoading(false); }
  }, [busqueda]);

  useEffect(() => { load(); }, [load]);

  // No cierra el modal ni recarga la lista todavía — ServicioForm aún tiene
  // que sincronizar el itinerario (llamadas aparte, ver ItinerarioForm) antes
  // de que la lista refleje el conteo de etapas correcto.
  const handleSave = async (data) => {
    return editando?.id
      ? await serviciosApi.update(editando.id, data)
      : await serviciosApi.create(data);
  };

  const handleSaved = () => {
    setModal(false); setEditando(null);
    setSuccess('Paquete guardado correctamente');
    load();
  };

  const handleClonar = async () => {
    if (!clonarForm.nuevo_codigo || !clonarForm.nuevo_nombre) return;
    await serviciosApi.clonar(clonarModal.id, clonarForm);
    setClonarM(null); setClonarF({ nuevo_codigo: '', nuevo_nombre: '' });
    setSuccess('Paquete clonado correctamente');
    load();
  };

  const tipos = [...new Set(servicios.map(s => s.tipo))];
  const filtrados = servicios.filter(s => !tipoFiltro || s.tipo === tipoFiltro);

  return (
    <div className="space-y-5">
      {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9 text-sm" placeholder="Buscar paquete..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)} />
        </div>

        {/* Chips de tipo */}
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setTipoFiltro('')}
            className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
            style={!tipoFiltro
              ? { background: 'var(--brand)', color: 'white' }
              : { background: 'var(--card-2)', color: 'var(--text-2)' }}>
            Todos ({servicios.length})
          </button>
          {tipos.map(t => {
            const meta = TIPO_META[t];
            const count = servicios.filter(s => s.tipo === t).length;
            return (
              <button key={t} onClick={() => setTipoFiltro(prev => prev === t ? '' : t)}
                className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
                style={tipoFiltro === t
                  ? { background: 'var(--brand)', color: 'white' }
                  : { background: 'var(--card-2)', color: 'var(--text-2)' }}>
                {meta?.label || t} ({count})
              </button>
            );
          })}
        </div>

        <button onClick={() => { setEditando(null); setModal(true); }}
          className="btn-primary ml-auto text-sm">
          <Plus size={15} /> Nuevo paquete
        </button>
      </div>

      {/* Grid de cards */}
      {loading ? <PageLoader /> : filtrados.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text-2)' }}>
          <Package size={40} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
          <p className="text-sm">Sin paquetes registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtrados.map(s => (
            <ServicioCard
              key={s.id}
              s={s}
              onEditar={s  => { setEditando(s); setModal(true); }}
              onClonar={s  => setClonarM(s)}
              onCotizar={s => setCotizador(s)}
            />
          ))}
        </div>
      )}

      {/* Cotizador */}
      {cotizador && (
        <CotizadorModal
          servicio={cotizador}
          onClose={() => setCotizador(null)}
        />
      )}

      {/* Modal editar/crear */}
      <Modal open={modal} onClose={() => { setModal(false); setEditando(null); }}
        title={editando ? 'Editar paquete' : 'Nuevo paquete turístico'} size="xl">
        <ServicioForm inicial={editando} onSave={handleSave} onSaved={handleSaved}
          onCancel={() => { setModal(false); setEditando(null); }} />
      </Modal>

      {/* Modal clonar */}
      <Modal open={!!clonarModal} onClose={() => setClonarM(null)} title="Clonar paquete">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Clonar <strong style={{ color: 'var(--text)' }}>{clonarModal?.nombre}</strong> con nuevo código y nombre.
          </p>
          <div>
            <label className="label">Nuevo código <span className="text-red-500">*</span></label>
            <input className="input-field font-mono" value={clonarForm.nuevo_codigo}
              onChange={e => setClonarF(p => ({ ...p, nuevo_codigo: e.target.value.toUpperCase() }))}
              placeholder="IT4D-V2" />
          </div>
          <div>
            <label className="label">Nuevo nombre <span className="text-red-500">*</span></label>
            <input className="input-field" value={clonarForm.nuevo_nombre}
              onChange={e => setClonarF(p => ({ ...p, nuevo_nombre: e.target.value }))}
              placeholder="Inca Trail 4 Días v2" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setClonarM(null)} className="btn-secondary">Cancelar</button>
            <button onClick={handleClonar} className="btn-primary">
              <Copy size={14} /> Crear clon
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
