import { useState } from 'react';
import Alert from '../ui/Alert';
import Spinner from '../ui/Spinner';
import { NACIONALIDADES } from '../../utils/constants';

const EMPTY = {
  nombre: '', apellido: '', genero: 'NO_ESPECIFICADO',
  fecha_nacimiento: '', nacionalidad: '',
  pasaporte: '', pasaporte_vencimiento: '',
  email: '', telefono: '', whatsapp: '',
  es_vegetariano: false, es_vegano: false, es_pescetariano: false, es_flexitariano: false,
  es_celiaco: false, es_diabetico: false, es_halal: false, sin_lactosa: false,
  quechua_extra_kg: '', trekking_poles: false, sleeping_bag: false, carpa_privada: false, duffel_bag: false,
  alergias: '', restricciones_alimenticias: '', condicion_medica: '', observaciones: '',
};

// Calcula la edad en años a partir de una fecha YYYY-MM-DD (parseo local, sin Date/UTC shift).
const calcularEdad = (fechaISO) => {
  if (!fechaISO) return '';
  const [y, m, d] = fechaISO.split('-').map(Number);
  if (!y || !m || !d) return '';
  const hoy = new Date();
  let edad = hoy.getFullYear() - y;
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) edad--;
  return edad >= 0 ? edad : '';
};

function Field({ label, required, children }) {
  return (
    <div>
      <label className="label">
        {label}{required && <span className="ml-0.5" style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionTitle({ children, color }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: color }} />
      <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>
        {children}
      </p>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, var(--border), transparent)' }} />
    </div>
  );
}

function CheckToggle({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
      style={checked
        ? { background: 'rgba(67,97,238,0.15)', color: 'var(--brand)', border: '1px solid rgba(67,97,238,0.3)' }
        : { background: 'var(--card-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }
      }>
      <span className="w-3.5 h-3.5 rounded-sm flex items-center justify-center flex-shrink-0"
        style={{ background: checked ? 'var(--brand)' : 'var(--border)' }}>
        {checked && <span className="text-white text-xs leading-none">✓</span>}
      </span>
      {label}
    </button>
  );
}

export default function PasajeroForm({ reservaId, inicial, onSave, onCancel }) {
  const [form, setForm] = useState({ reserva_id: reservaId, ...EMPTY, ...inicial,
    fecha_nacimiento:      inicial?.fecha_nacimiento?.slice(0,10)      || '',
    pasaporte_vencimiento: inicial?.pasaporte_vencimiento?.slice(0,10) || '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const edadMostrada = calcularEdad(form.fecha_nacimiento);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try { await onSave(form); }
    catch (err) { setError(err.error || err.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* ── Datos personales ── */}
      <SectionTitle color="var(--brand)">Datos personales</SectionTitle>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre">
          <input className="input-field" value={form.nombre}
            onChange={e => set('nombre', e.target.value)} placeholder="James" />
        </Field>
        <Field label="Apellido">
          <input className="input-field" value={form.apellido}
            onChange={e => set('apellido', e.target.value)} placeholder="O'Brien" />
        </Field>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Field label="Género">
          <select className="input-field" value={form.genero} onChange={e => set('genero', e.target.value)}>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="NO_ESPECIFICADO">No especificado</option>
          </select>
        </Field>
        <Field label="Fecha de nacimiento">
          <input type="date" className="input-field" value={form.fecha_nacimiento}
            onChange={e => set('fecha_nacimiento', e.target.value)} />
        </Field>
        <Field label="Edad">
          <input type="number" min="0" max="120" className="input-field"
            value={edadMostrada}
            readOnly
            placeholder="Auto"
            title="Calculada de fecha de nacimiento" />
        </Field>
        <Field label="Nacionalidad">
          <input className="input-field" list="nacionalidades-datalist" value={form.nacionalidad}
            onChange={e => set('nacionalidad', e.target.value)} placeholder="Australiana" />
          <datalist id="nacionalidades-datalist">
            {NACIONALIDADES.map(n => <option key={n} value={n} />)}
          </datalist>
        </Field>
      </div>

      {/* ── Pasaporte ── */}
      <SectionTitle color="#f59e0b">Documento de viaje</SectionTitle>

      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)' }}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Número de pasaporte">
            <input className="input-field font-mono" value={form.pasaporte}
              onChange={e => set('pasaporte', e.target.value)} placeholder="PA1234567" />
          </Field>
          <Field label="Vencimiento del pasaporte">
            <input type="date" className="input-field" value={form.pasaporte_vencimiento}
              onChange={e => set('pasaporte_vencimiento', e.target.value)} />
          </Field>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          El pasaporte debe tener al menos 6 meses de vigencia desde la fecha del viaje.
        </p>
      </div>

      {/* ── Contacto ── */}
      <SectionTitle color="#10b981">Contacto</SectionTitle>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Email">
          <input type="email" className="input-field" value={form.email}
            onChange={e => set('email', e.target.value)} placeholder="james@email.com" />
        </Field>
        <Field label="Teléfono">
          <input className="input-field" value={form.telefono}
            onChange={e => set('telefono', e.target.value)} placeholder="+1 555 0000" />
        </Field>
        <Field label="WhatsApp">
          <input className="input-field" value={form.whatsapp}
            onChange={e => set('whatsapp', e.target.value)} placeholder="+1 555 0000" />
        </Field>
      </div>

      {/* ── Restricciones alimentarias ── */}
      <SectionTitle color="#ef4444">Restricciones alimentarias y salud</SectionTitle>

      <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
        <div className="flex flex-wrap gap-2">
          <CheckToggle checked={form.es_vegetariano}  onChange={v => set('es_vegetariano', v)}  label="Vegetariano" />
          <CheckToggle checked={form.es_vegano}       onChange={v => set('es_vegano', v)}       label="Vegano" />
          <CheckToggle checked={form.es_pescetariano} onChange={v => set('es_pescetariano', v)} label="Pescetariano" />
          <CheckToggle checked={form.es_flexitariano} onChange={v => set('es_flexitariano', v)} label="Flexitariano" />
          <CheckToggle checked={form.es_celiaco}      onChange={v => set('es_celiaco', v)}      label="Celíaco - Gluten Free" />
          <CheckToggle checked={form.sin_lactosa}     onChange={v => set('sin_lactosa', v)}     label="Sin lactosa" />
          <CheckToggle checked={form.es_halal}        onChange={v => set('es_halal', v)}        label="Halal" />
          <CheckToggle checked={form.es_diabetico}    onChange={v => set('es_diabetico', v)}    label="Diabético" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Alergias alimentarias">
            <input className="input-field" value={form.alergias}
              onChange={e => set('alergias', e.target.value)}
              placeholder="Frutos secos, mariscos, lactosa..." />
          </Field>
          <Field label="Restricciones detalladas">
            <textarea rows={2} className="input-field resize-none" value={form.restricciones_alimenticias}
              onChange={e => set('restricciones_alimenticias', e.target.value)}
              placeholder="Descripción completa de restricciones..." />
          </Field>
        </div>

        <Field label="Condición médica relevante">
          <textarea rows={2} className="input-field resize-none" value={form.condicion_medica}
            onChange={e => set('condicion_medica', e.target.value)}
            placeholder="Altura, cardiopatías, medicamentos actuales..." />
        </Field>
      </div>

      {/* ── Equipamiento de trekking ── */}
      <SectionTitle color="#0ea5e9">Equipamiento de trekking</SectionTitle>

      <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.18)' }}>
        <Field label="Quechua extra (equipaje adicional cargado por porteador)">
          <div className="flex flex-wrap gap-2">
            <CheckToggle checked={form.quechua_extra_kg === '8'}
              onChange={v => set('quechua_extra_kg', v ? '8' : '')} label="8 kilos" />
            <CheckToggle checked={form.quechua_extra_kg === '15'}
              onChange={v => set('quechua_extra_kg', v ? '15' : '')} label="15 kilos" />
          </div>
        </Field>
        <div className="flex flex-wrap gap-2">
          <CheckToggle checked={form.trekking_poles} onChange={v => set('trekking_poles', v)} label="Trekking poles" />
          <CheckToggle checked={form.sleeping_bag}   onChange={v => set('sleeping_bag', v)}   label="Sleeping bag" />
          <CheckToggle checked={form.carpa_privada}  onChange={v => set('carpa_privada', v)}  label="Carpa privada" />
          <CheckToggle checked={form.duffel_bag}     onChange={v => set('duffel_bag', v)}     label="Duffel bag" />
        </div>
      </div>

      {/* ── Observaciones ── */}
      <Field label="Observaciones generales">
        <textarea rows={2} className="input-field resize-none" value={form.observaciones}
          onChange={e => set('observaciones', e.target.value)} />
      </Field>

      <div className="flex gap-3 justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving && <Spinner size="sm" />}
          {form.id ? 'Guardar cambios' : 'Agregar pasajero'}
        </button>
      </div>
    </form>
  );
}
