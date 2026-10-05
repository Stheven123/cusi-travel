import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays, Clock, MapPin, Users, Globe, TrendingUp,
  Building2, Lock, DollarSign, Package, Plus, Trash2,
} from 'lucide-react';
import { ESTADOS_OPERACION, IDIOMAS } from '../../utils/constants';
import { serviciosApi } from '../../api/servicios.api';
import { agenciasApi } from '../../api/agencias.api';
import { proveedoresApi } from '../../api/proveedores.api';
import Alert from '../ui/Alert';
import Spinner from '../ui/Spinner';
import ServiciosAdicionalesForm from './ServiciosAdicionalesForm';

const OTRA_AGENCIA = '__otra__';

const EMPTY = {
  servicio_id: '', nombre_servicio_snap: '',
  fecha_inicio: '', fecha_fin: '',
  hora_encuentro: '', lugar_encuentro: '',
  n_pasajeros: 1, idioma_servicio: 'Español',
  modalidad_servicio: '',
  estado_operacion: 'COTIZACION',
  precio_usd_por_pax: 0, total_usd: 0, adelanto_usd: 0, descuento_usd: 0,
  agencia_nombre: '', agencia_codigo: '', operador_nombre: '',
  usuario_guia_id: '',
  proveedor_guia_id: '',
};

/* ── Sección con encabezado visual ── */
function Section({ icon: Icon, title, color = 'var(--brand)', children }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 px-4 py-3"
        style={{ background: 'var(--card-2)', borderBottom: '1px solid var(--border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>{title}</p>
      </div>
      <div className="p-4 space-y-3" style={{ background: 'var(--card)' }}>
        {children}
      </div>
    </div>
  );
}

/* ── Campo con label ── */
function Field({ label, required, children }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

export default function ReservaForm({ inicial, onSave, onCancel }) {
  const [form, setForm]       = useState({
    ...EMPTY,
    ...inicial,
    fecha_inicio: inicial?.fecha_inicio?.slice(0, 10) || '',
    fecha_fin:    inicial?.fecha_fin?.slice(0, 10)    || '',
    proveedor_guia_id: inicial?.proveedor_guia_id ?? '',
    modalidad_servicio: inicial?.modalidad_servicio ?? '',
  });
  const [servicios, setServs] = useState([]);
  const [agencias, setAgencias] = useState([]);
  const [guias, setGuias]     = useState([]);
  const [extras, setExtras]   = useState(
    (inicial?.servicios_adicionales || []).map(e => ({
      nombre: e.nombre, cantidad: e.cantidad, precio_unitario_usd: e.precio_unitario_usd,
    }))
  );
  // Pagos con fecha: el cliente puede pagar en varias fechas. Si hay pagos,
  // el adelanto es la suma de sus montos (se calcula solo).
  const [pagos, setPagos] = useState(
    (inicial?.pagos || []).map(p => ({ fecha: p.fecha?.slice(0, 10) || '', monto: p.monto ?? '', nota: p.nota || '' }))
  );
  const [modoOtraAgencia, setModoOtraAgencia] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    serviciosApi.getAll({}).then(r => setServs(r.data || [])).catch(() => {});
    agenciasApi.getAll({ activo: true }).then(r => {
      const list = r.data || [];
      setAgencias(list);
      if (form.agencia_nombre && !list.some(a => a.nombre === form.agencia_nombre)) {
        setModoOtraAgencia(true);
      }
    }).catch(() => {});
    // Guías = proveedores de tipo GUIA (los mismos que se asignan en Operaciones).
    proveedoresApi.getAll({ tipo: 'GUIA', activo: true }).then(r => setGuias(r.data || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extrasTotal = (list = extras) =>
    list.reduce((s, e) => s + Number(e.cantidad || 1) * Number(e.precio_unitario_usd || 0), 0);

  const set = (k, v) => setForm(p => {
    const next = { ...p, [k]: v };
    if (k === 'precio_usd_por_pax' || k === 'n_pasajeros') {
      next.total_usd = (Number(k === 'precio_usd_por_pax' ? v : p.precio_usd_por_pax) *
                        Number(k === 'n_pasajeros'        ? v : p.n_pasajeros) + extrasTotal()).toFixed(2);
    }
    if (k === 'servicio_id') {
      const s = servicios.find(x => String(x.id) === String(v));
      if (s) {
        next.nombre_servicio_snap = s.nombre;
        if (!p.precio_usd_por_pax || Number(p.precio_usd_por_pax) === 0)
          next.precio_usd_por_pax = s.precio_base_usd;
        next.total_usd = (Number(s.precio_base_usd) * Number(p.n_pasajeros) + extrasTotal()).toFixed(2);
      }
    }
    /* Auto-completar código de agencia al seleccionar una conocida */
    if (k === 'agencia_nombre') {
      const ag = agencias.find(a => a.nombre === v);
      if (ag) next.agencia_codigo = ag.codigo || p.agencia_codigo;
    }
    return next;
  });

  const handleExtrasChange = (next) => {
    setExtras(next);
    setForm(p => ({
      ...p,
      total_usd: (Number(p.precio_usd_por_pax || 0) * Number(p.n_pasajeros || 1) + extrasTotal(next)).toFixed(2),
    }));
  };

  const catalogoDelPaquete = servicios.find(s => String(s.id) === String(form.servicio_id))?.catalogo_adicionales || [];

  const pagosValidos = pagos.filter(p => p.fecha && Number(p.monto) > 0);
  const sumaPagos    = Math.round(pagosValidos.reduce((s, p) => s + Number(p.monto), 0) * 100) / 100;
  const usaPagos     = pagosValidos.length > 0;
  const setPago      = (i, k, v) => setPagos(p => p.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const addPago      = () => setPagos(p => [...p, { fecha: new Date().toLocaleDateString('en-CA'), monto: '', nota: '' }]);
  const removePago   = (i) => setPagos(p => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const incompleto = pagos.find(p => (p.fecha || p.monto !== '') && !(p.fecha && Number(p.monto) > 0));
    if (incompleto) return setError('Cada pago necesita una fecha y un monto mayor a 0');
    if (usaPagos && sumaPagos > Number(form.total_usd)) {
      return setError(`La suma de los pagos ($${sumaPagos.toFixed(2)}) supera el total de la reserva`);
    }
    setSaving(true);
    try {
      const payload = { ...form,
        servicio_id:        form.servicio_id        ? Number(form.servicio_id) : undefined,
        usuario_guia_id:    form.usuario_guia_id     ? Number(form.usuario_guia_id) : null,
        proveedor_guia_id:  form.proveedor_guia_id   ? Number(form.proveedor_guia_id) : null,
        n_pasajeros:        Number(form.n_pasajeros) || 1,
        precio_usd_por_pax: Number(form.precio_usd_por_pax),
        total_usd:          Number(form.total_usd),
        adelanto_usd:       usaPagos ? sumaPagos : Number(form.adelanto_usd),
        pagos:              pagosValidos.map(p => ({ fecha: p.fecha, monto: Number(p.monto), nota: p.nota || null })),
        descuento_usd:      Number(form.descuento_usd),
        fecha_inicio:       form.fecha_inicio || undefined,
        fecha_fin:          form.fecha_fin    || undefined,
        modalidad_servicio: form.modalidad_servicio || null,
        servicios_adicionales: extras
          .filter(e => e.nombre?.trim())
          .map(e => ({
            nombre: e.nombre,
            cantidad: Number(e.cantidad) || 1,
            precio_unitario_usd: Number(e.precio_unitario_usd) || 0,
          })),
      };
      await onSave(payload);
    } catch (err) {
      const detalle = Array.isArray(err.details) && err.details.length
        ? ' — ' + err.details.map(d => d.mensaje).join('; ')
        : '';
      setError((err.error || 'Error al guardar') + detalle);
    } finally { setSaving(false); }
  };

  const adelantoEfectivo = usaPagos ? sumaPagos : Number(form.adelanto_usd);
  const saldo = Number(form.total_usd) - adelantoEfectivo - Number(form.descuento_usd);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* ── Código de reserva ── */}
      <Section icon={Lock} title="Código de reserva" color="#8892aa">
        <Field label="ID / Código (letras y números)">
          <input value={form.codigo_reserva || ''} onChange={e => set('codigo_reserva', e.target.value.toUpperCase())}
            className="input-field font-mono" placeholder="R-2024-00001" maxLength={30} />
        </Field>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          {form.id
            ? 'Puedes personalizar el código. Debe ser único en el sistema.'
            : 'Opcional — si lo dejas vacío, se genera automáticamente (R-año-00001).'}
        </p>
      </Section>

      {/* ── Servicio turístico ── */}
      <Section icon={Package} title="Servicio turístico" color="#4361ee">
        <Field label="Paquete / Servicio">
          <select value={form.servicio_id} onChange={e => set('servicio_id', e.target.value)}
            className="input-field">
            <option value="">— Seleccionar servicio —</option>
            {servicios.length === 0 && (
              <option disabled>Cargando servicios...</option>
            )}
            {servicios.map(s => (
              <option key={s.id} value={s.id}>
                {s.codigo} — {s.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nombre personalizado (si no está en lista)">
          <input value={form.nombre_servicio_snap} onChange={e => set('nombre_servicio_snap', e.target.value)}
            className="input-field" placeholder="Ej: Tour Machu Picchu privado" />
        </Field>
        <Field label="Tipo de servicio">
          <select value={form.modalidad_servicio} onChange={e => set('modalidad_servicio', e.target.value)}
            className="input-field">
            <option value="">— Sin especificar —</option>
            <option value="COMPARTIDO">Compartido</option>
            <option value="PRIVADO">Privado</option>
          </select>
        </Field>
      </Section>

      {/* ── Fechas y logística ── */}
      <Section icon={CalendarDays} title="Fechas y logística" color="#10b981">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha inicio" required>
            <input type="date" required value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)}
              className="input-field" />
          </Field>
          <Field label="Fecha fin" required>
            <input type="date" required value={form.fecha_fin} onChange={e => set('fecha_fin', e.target.value)}
              className="input-field" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hora de encuentro">
            <div className="relative">
              <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
              <input type="time" value={form.hora_encuentro} onChange={e => set('hora_encuentro', e.target.value)}
                className="input-field pl-9" />
            </div>
          </Field>
          <Field label="Lugar de encuentro">
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
              <input value={form.lugar_encuentro} onChange={e => set('lugar_encuentro', e.target.value)}
                className="input-field pl-9" placeholder="Plaza de Armas, Cusco" />
            </div>
          </Field>
        </div>
      </Section>

      {/* ── Pasajeros y estado ── */}
      <Section icon={Users} title="Pasajeros y estado" color="#8b5cf6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="N° pasajeros">
            <div className="relative">
              <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
              <input type="number" min="1" value={form.n_pasajeros} onChange={e => set('n_pasajeros', e.target.value)}
                className="input-field pl-9" />
            </div>
          </Field>
          <Field label="Idioma guía">
            <div className="relative">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
              <select value={form.idioma_servicio} onChange={e => set('idioma_servicio', e.target.value)}
                className="input-field pl-9">
                {IDIOMAS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          </Field>
          <Field label="Guía asignado">
            {/* Se sincroniza con la operación GUIA de la reserva (pestaña Operaciones). */}
            <select value={form.proveedor_guia_id} onChange={e => set('proveedor_guia_id', e.target.value)}
              className="input-field">
              <option value="">— Sin asignar —</option>
              {guias.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </Field>
          <Field label="Estado operación">
            <select value={form.estado_operacion} onChange={e => set('estado_operacion', e.target.value)}
              className="input-field">
              {ESTADOS_OPERACION.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* ── Datos financieros ── */}
      <Section icon={DollarSign} title="Datos financieros" color="#f59e0b">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Precio x pax USD">
            <input type="number" min="0" step="0.01" value={form.precio_usd_por_pax}
              onChange={e => set('precio_usd_por_pax', e.target.value)} className="input-field" />
          </Field>
          <Field label="Total USD">
            <input type="number" min="0" step="0.01" value={form.total_usd}
              onChange={e => set('total_usd', e.target.value)} className="input-field" />
          </Field>
          <Field label={usaPagos ? 'Pagado USD (suma de pagos)' : 'Adelanto USD'}>
            <input type="number" min="0" step="0.01"
              value={usaPagos ? sumaPagos.toFixed(2) : form.adelanto_usd}
              disabled={usaPagos}
              title={usaPagos ? 'Se calcula con los pagos registrados abajo' : undefined}
              onChange={e => set('adelanto_usd', e.target.value)} className="input-field" />
          </Field>
          <Field label="Descuento USD">
            <input type="number" min="0" step="0.01" value={form.descuento_usd}
              onChange={e => set('descuento_usd', e.target.value)} className="input-field" />
          </Field>
        </div>

        <div className="pt-1 space-y-2" style={{ borderTop: '1px dashed var(--border)' }}>
          <div className="flex items-center justify-between">
            <p className="label mb-0">Pagos recibidos</p>
            <button type="button" onClick={addPago}
              className="text-xs font-semibold flex items-center gap-1 cursor-pointer" style={{ color: 'var(--brand)' }}>
              <Plus size={13} /> Agregar pago
            </button>
          </div>
          {pagos.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              Registra cada pago con su fecha (el cliente puede pagar en varias fechas). Las fechas salen en el invoice.
            </p>
          ) : (
            <div className="space-y-1.5">
              {pagos.map((p, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input type="date" className="input-field text-sm" style={{ width: '10rem' }}
                    value={p.fecha} onChange={e => setPago(i, 'fecha', e.target.value)} />
                  <div className="relative" style={{ width: '8.5rem' }}>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--text-3)' }}>$</span>
                    <input type="number" min="0" step="0.01" className="input-field text-sm pl-7" placeholder="0.00"
                      value={p.monto} onChange={e => setPago(i, 'monto', e.target.value)} />
                  </div>
                  <input className="input-field text-sm flex-1 min-w-[140px]" placeholder="Nota (transferencia, efectivo...)"
                    maxLength={200} value={p.nota} onChange={e => setPago(i, 'nota', e.target.value)} />
                  <button type="button" onClick={() => removePago(i)} className="p-1.5 cursor-pointer" title="Quitar pago"
                    style={{ color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <p className="text-xs text-right font-semibold" style={{ color: 'var(--text-2)' }}>
                Total pagado: ${sumaPagos.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        <div className="pt-1" style={{ borderTop: '1px dashed var(--border)' }}>
          <p className="label mb-2">Servicios adicionales</p>
          <ServiciosAdicionalesForm extras={extras} catalogo={catalogoDelPaquete} onChange={handleExtrasChange} />
        </div>

        <div className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{ background: saldo > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${saldo > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
          <div className="flex items-center gap-2">
            <TrendingUp size={14} style={{ color: saldo > 0 ? '#ef4444' : '#10b981' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>Saldo pendiente</span>
          </div>
          <span className="font-black text-lg tabular-nums" style={{ color: saldo > 0 ? '#dc2626' : '#059669' }}>
            ${saldo.toFixed(2)}
          </span>
        </div>
      </Section>

      {/* ── Agencia ── */}
      <Section icon={Building2} title="Agencia / Operador" color="#06b6d4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Nombre agencia">
            <select
              value={modoOtraAgencia ? OTRA_AGENCIA : (form.agencia_nombre || '')}
              onChange={e => {
                const v = e.target.value;
                if (v === OTRA_AGENCIA) { setModoOtraAgencia(true); set('agencia_nombre', ''); }
                else { setModoOtraAgencia(false); set('agencia_nombre', v); }
              }}
              className="input-field">
              <option value="">— Seleccionar —</option>
              {agencias.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
              <option value={OTRA_AGENCIA}>Otra (escribir)...</option>
            </select>
            {modoOtraAgencia && (
              <input
                value={form.agencia_nombre}
                onChange={e => set('agencia_nombre', e.target.value)}
                className="input-field mt-2"
                placeholder="Nombre de la agencia"
                autoFocus
              />
            )}
          </Field>
          <Field label="Código agencia">
            <input value={form.agencia_codigo} onChange={e => set('agencia_codigo', e.target.value)}
              className="input-field" placeholder="AT-001" />
          </Field>
          <Field label="Operador / Responsable">
            <input value={form.operador_nombre} onChange={e => set('operador_nombre', e.target.value)}
              className="input-field" placeholder="Nombre del operador" />
          </Field>
        </div>
        <Link to="/agencias" className="text-xs hover:underline inline-block" style={{ color: 'var(--brand)' }}>
          Gestionar agencias →
        </Link>
      </Section>

      {/* ── Acciones ── */}
      <div className="flex gap-3 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving && <Spinner size="sm" />}
          {form.id ? 'Guardar cambios' : 'Crear reserva'}
        </button>
      </div>
    </form>
  );
}
