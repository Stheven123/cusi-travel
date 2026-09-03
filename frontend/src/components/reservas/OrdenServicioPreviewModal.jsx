import { useState, useEffect, useRef, useCallback } from 'react';
import { Download } from 'lucide-react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import { getAgenciaData } from '../../pages/AgenciaPage';
import {
  construirOrdenServicioDoc, buildNotas, buildPresupuesto,
} from '../../utils/ordenServicioPDF';

// Vista previa del PDF de la orden de servicio con los datos (notas, presupuesto)
// editables antes de descargar — y un toggle para generar la variante "para guía"
// (sin presupuesto ni pagos a staff).
export default function OrdenServicioPreviewModal({
  open, onClose, reserva, briefings, itinerarios, notas, presupuestoItems,
}) {
  const [paraGuia, setParaGuia]   = useState(false);
  const [notasLineas, setNotas]   = useState([]);
  const [notasDirty, setNotasDirty] = useState(false); // true en cuanto el usuario edita el texto a mano
  const [presupuesto, setPresu]   = useState([]);
  const [blobUrl, setBlobUrl]     = useState('');
  const [loading, setLoading]     = useState(false);
  const debounceRef = useRef(null);
  const blobUrlRef = useRef('');

  useEffect(() => {
    if (!open) return;
    const agencia = getAgenciaData();
    setNotas(buildNotas(reserva, agencia, notas, false));
    setNotasDirty(false);
    setPresu(buildPresupuesto(reserva, presupuestoItems));
    setParaGuia(false);
    setBlobUrl('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reserva?.id]);

  // Al alternar "vista para guía" se recalculan las notas (que excluyen el
  // pago a staff y el RUC) — salvo que el usuario ya haya editado el texto a
  // mano, en cuyo caso se respeta lo que escribió en vez de pisarlo.
  useEffect(() => {
    if (!open || notasDirty) return;
    const agencia = getAgenciaData();
    setNotas(buildNotas(reserva, agencia, notas, paraGuia));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paraGuia]);

  const regenerar = useCallback(async () => {
    setLoading(true);
    try {
      const doc = await construirOrdenServicioDoc({
        reserva, briefings, itinerarios, notas, presupuestoItems,
        paraGuia,
        notasOverride: notasLineas,
        presupuestoOverride: presupuesto,
      });
      const url = doc.output('bloburl');
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = url;
      setBlobUrl(url);
    } finally { setLoading(false); }
  }, [reserva, briefings, itinerarios, notas, presupuestoItems, paraGuia, notasLineas, presupuesto]);

  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(regenerar, 350);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, paraGuia, notasLineas, presupuesto]);

  // Revoca el último blob al cerrar/desmontar — jsPDF genera uno nuevo en
  // cada regeneración y sin esto se acumulan en memoria mientras el modal
  // sigue abierto.
  useEffect(() => () => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
  }, []);

  const handleDescargar = async () => {
    const doc = await construirOrdenServicioDoc({
      reserva, briefings, itinerarios, notas, presupuestoItems,
      paraGuia,
      notasOverride: notasLineas,
      presupuestoOverride: presupuesto,
    });
    const sufijo = paraGuia ? '-Guia' : '';
    doc.save(`Orden-Salida-${reserva.codigo_reserva || reserva.id}${sufijo}.pdf`);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Vista previa — Orden de servicio" size="full">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        {/* Panel editable */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer"
            style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
            <input type="checkbox" checked={paraGuia} onChange={e => setParaGuia(e.target.checked)} />
            Vista para guía (sin presupuesto ni pagos a staff)
          </label>

          <div>
            <label className="label">Notas (una por línea)</label>
            {notasDirty && (
              <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>
                Editaste el texto a mano — el toggle "para guía" ya no lo recalcula automáticamente.
              </p>
            )}
            <textarea rows={6} className="input-field resize-none text-xs"
              value={notasLineas.join('\n')}
              onChange={e => { setNotas(e.target.value.split('\n')); setNotasDirty(true); }} />
          </div>

          {!paraGuia && (
            <div>
              <label className="label mb-1">Presupuesto</label>
              <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>
                Solo lectura — se edita en la pestaña "Presupuesto" de la reserva.
              </p>
              {presupuesto.length ? (
                <div className="space-y-1">
                  {presupuesto.map((it, i) => (
                    <div key={i} className="flex gap-1.5 items-center justify-between text-xs px-2 py-1.5 rounded-lg"
                      style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
                      <span className="flex-1 truncate">{it.descripcion}</span>
                      <span className="font-semibold whitespace-nowrap">{it.monto} {it.moneda}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Sin ítems de presupuesto.</p>
              )}
            </div>
          )}

          <button type="button" onClick={handleDescargar}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--brand)', color: 'white' }}>
            <Download size={15} /> Descargar PDF
          </button>
        </div>

        {/* Preview del PDF */}
        <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', minHeight: 500 }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <Spinner />
            </div>
          )}
          {blobUrl && (
            <iframe title="Vista previa orden de servicio" src={blobUrl}
              style={{ width: '100%', height: '75vh', border: 'none' }} />
          )}
        </div>
      </div>
    </Modal>
  );
}
