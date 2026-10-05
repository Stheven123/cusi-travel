import { useState, useEffect, useCallback } from 'react';
import { Edit2, RotateCcw, Mountain, Map as MapIcon } from 'lucide-react';
import { reservasApi } from '../../api/reservas.api';
import ItinerarioForm from '../servicios/ItinerarioForm';
import Alert from '../ui/Alert';
import Spinner, { PageLoader } from '../ui/Spinner';
import { fmtFecha } from '../../utils/formatters';

// Fecha real de cada día: fecha_inicio de la reserva + (dia - 1).
const fechaDelDia = (fechaInicio, dia) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fechaInicio || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3] + dia - 1);
  return d.toLocaleDateString('en-CA');
};

const numOrNull = (v) => (v === '' || v == null ? null : Number(v));

const sanitize = (it) => ({
  titulo:           (it.titulo || '').trim(),
  descripcion:      it.descripcion || null,
  altitud_max_msnm: numOrNull(it.altitud_max_msnm) != null ? Math.round(Number(it.altitud_max_msnm)) : null,
  distancia_km:     numOrNull(it.distancia_km),
  horas_caminata:   numOrNull(it.horas_caminata),
  desayuno:         !!it.desayuno,
  almuerzo:         !!it.almuerzo,
  cena:             !!it.cena,
  box_lunch:        !!it.box_lunch,
  alojamiento:      it.alojamiento || null,
  notas_operativas: it.notas_operativas || null,
});

// Copia editable de un día (los números llegan como texto desde NUMERIC).
const toDraft = (it, i) => ({
  dia_numero: i + 1,
  titulo: it.titulo || '', descripcion: it.descripcion || '',
  altitud_max_msnm: it.altitud_max_msnm ?? '', distancia_km: it.distancia_km ?? '', horas_caminata: it.horas_caminata ?? '',
  desayuno: !!it.desayuno, almuerzo: !!it.almuerzo, cena: !!it.cena, box_lunch: !!it.box_lunch,
  alojamiento: it.alojamiento || '', notas_operativas: it.notas_operativas || '',
});

// Pestaña "Itinerario" de la reserva: muestra el itinerario del paquete y
// permite personalizarlo solo para esta reserva (sin tocar el paquete).
export default function ItinerarioReservaPanel({ reserva, onChanged }) {
  const [data, setData]       = useState(null); // { personalizado, dias }
  const [editando, setEditando] = useState(false);
  const [draft, setDraft]     = useState([]);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try { const r = await reservasApi.getItinerario(reserva.id); setData(r.data); }
    catch { setError('No se pudo cargar el itinerario'); }
  }, [reserva.id]);

  useEffect(() => { load(); }, [load]);

  if (!data) return error ? <Alert type="error" message={error} /> : <PageLoader />;

  const empezarEdicion = () => { setDraft(data.dias.map(toDraft)); setEditando(true); setError(''); };

  const guardar = async () => {
    const dias = draft.map(sanitize);
    if (dias.some(d => !d.titulo)) return setError('Cada día necesita un título');
    setSaving(true); setError('');
    try {
      const r = await reservasApi.saveItinerario(reserva.id, dias);
      setData(r.data); setEditando(false);
      setSuccess('Itinerario de la reserva guardado');
      onChanged?.(r.data.dias);
    } catch (e) {
      setError(e?.error || 'No se pudo guardar el itinerario');
    } finally { setSaving(false); }
  };

  const restablecer = async () => {
    if (!confirm('¿Descartar el itinerario personalizado y volver a usar el del paquete?')) return;
    try {
      const r = await reservasApi.resetItinerario(reserva.id);
      setData(r.data); setSuccess('Se restableció el itinerario del paquete');
      onChanged?.(r.data.dias);
    } catch { setError('No se pudo restablecer el itinerario'); }
  };

  return (
    <div className="space-y-4">
      {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: data.personalizado ? 'rgba(245,158,11,0.10)' : 'var(--card-2)', border: '1px solid var(--border)' }}>
        <MapIcon size={16} style={{ color: data.personalizado ? '#d97706' : 'var(--brand)' }} />
        <p className="text-sm flex-1 min-w-[200px]" style={{ color: 'var(--text-2)' }}>
          {data.personalizado
            ? <><b>Itinerario personalizado</b> solo para esta reserva (el paquete no cambia).</>
            : <>Itinerario del paquete <b>{reserva.servicio_nombre || reserva.nombre_servicio_snap || ''}</b>. Si esta reserva necesita cambios, edítalo aquí.</>}
        </p>
        {!editando && (
          <div className="flex gap-2">
            {data.personalizado && (
              <button type="button" onClick={restablecer} className="btn-secondary text-xs">
                <RotateCcw size={13} /> Usar el del paquete
              </button>
            )}
            <button type="button" onClick={empezarEdicion} className="btn-primary text-xs">
              <Edit2 size={13} /> {data.personalizado ? 'Editar itinerario' : 'Personalizar para esta reserva'}
            </button>
          </div>
        )}
      </div>

      {editando ? (
        <div className="space-y-3">
          <ItinerarioForm itinerarios={draft} onChange={setDraft} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setEditando(false); setError(''); }} className="btn-secondary" disabled={saving}>Cancelar</button>
            <button type="button" onClick={guardar} className="btn-primary" disabled={saving}>
              {saving && <Spinner size="sm" />} Guardar itinerario de la reserva
            </button>
          </div>
        </div>
      ) : data.dias.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <MapIcon size={32} className="mx-auto mb-2" style={{ color: 'var(--text-3)' }} />
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>Sin itinerario — usa "Personalizar" para armarlo.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.dias.map((it, i) => {
            const fecha = fechaDelDia(reserva.fecha_inicio, it.dia_numero || i + 1);
            return (
              <div key={it.id || i} className="flex items-start gap-3 rounded-2xl p-4"
                style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="text-center flex-shrink-0 w-14">
                  <span className="block text-xs font-black px-2 py-1 rounded-lg" style={{ background: 'var(--brand)', color: 'white' }}>
                    Día {it.dia_numero || i + 1}
                  </span>
                  {fecha && <span className="block text-xs mt-1" style={{ color: 'var(--text-3)' }}>{fmtFecha(fecha)}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{it.titulo}</p>
                  {it.descripcion && <p className="text-xs mt-1 whitespace-pre-line" style={{ color: 'var(--text-2)' }}>{it.descripcion}</p>}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
                    {it.altitud_max_msnm && <span className="flex items-center gap-1"><Mountain size={11} />{it.altitud_max_msnm} msnm</span>}
                    {it.distancia_km && <span>{Number(it.distancia_km)} km</span>}
                    {it.horas_caminata && <span>{Number(it.horas_caminata)} h</span>}
                    {(it.desayuno || it.almuerzo || it.cena || it.box_lunch) && (
                      <span className="text-emerald-600">
                        {[it.desayuno && 'D', it.almuerzo && 'A', it.cena && 'C', it.box_lunch && 'BL'].filter(Boolean).join('·')}
                      </span>
                    )}
                    {it.alojamiento && <span>🏕 {it.alojamiento}</span>}
                  </div>
                  {it.notas_operativas && (
                    <p className="text-xs mt-1 italic" style={{ color: 'var(--text-3)' }}>Nota operativa: {it.notas_operativas}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
