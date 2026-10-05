import { useState, useEffect, useRef, useCallback } from 'react';
import { Download } from 'lucide-react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import { construirOrdenServicioDoc } from '../../utils/ordenServicioPDF';

// Vista previa del PDF de la orden de servicio (solo lectura). Las notas y el
// presupuesto se editan en sus pestañas de la reserva, no aquí. El toggle
// "para guía" genera la variante sin presupuesto ni pagos a staff.
export default function OrdenServicioPreviewModal({
  open, onClose, reserva, briefings, itinerarios, notas, presupuestoItems,
}) {
  const [paraGuia, setParaGuia] = useState(false);
  const [blobUrl, setBlobUrl]   = useState('');
  const [loading, setLoading]   = useState(false);
  const blobUrlRef = useRef('');

  useEffect(() => {
    if (!open) return;
    setParaGuia(false);
    setBlobUrl('');
  }, [open, reserva?.id]);

  const buildDoc = useCallback(() => construirOrdenServicioDoc({
    reserva, briefings, itinerarios, notas, presupuestoItems, paraGuia,
  }), [reserva, briefings, itinerarios, notas, presupuestoItems, paraGuia]);

  useEffect(() => {
    if (!open) return;
    let cancel = false;
    setLoading(true);
    buildDoc().then(doc => {
      if (cancel) return;
      const url = doc.output('bloburl');
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = url;
      setBlobUrl(url);
    }).finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [open, buildDoc]);

  // Revoca el último blob al cerrar/desmontar.
  useEffect(() => () => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
  }, []);

  const handleDescargar = async () => {
    const doc = await buildDoc();
    const sufijo = paraGuia ? '-Guia' : '';
    doc.save(`Orden-Salida-${reserva.codigo_reserva || reserva.id}${sufijo}.pdf`);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Vista previa — Orden de servicio" size="full">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer"
            style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
            <input type="checkbox" checked={paraGuia} onChange={e => setParaGuia(e.target.checked)} />
            Vista para guía (sin presupuesto ni pagos a staff)
          </label>
          <button type="button" onClick={handleDescargar}
            className="ml-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
            style={{ background: 'var(--brand)', color: 'white' }}>
            <Download size={15} /> Descargar PDF
          </button>
        </div>

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
