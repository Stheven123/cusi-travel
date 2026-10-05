import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import Alert from '../ui/Alert';
import { reportesApi } from '../../api/reportes.api';
import { getAgenciaData } from '../../pages/AgenciaPage';
import { fmtMoneda } from '../../utils/formatters';

// Vista previa del cierre de file de una reserva — las mismas filas y totales
// que el Excel, para revisarlo antes de descargarlo.
export default function CierrePreviewModal({ open, reserva, onClose }) {
  const [data, setData]   = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open || !reserva) return;
    setData(null); setError('');
    reportesApi.previewCierreReserva(reserva.id)
      .then(r => setData(r.data))
      .catch(e => setError(e?.error || 'No se pudo cargar el cierre de file'));
  }, [open, reserva?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !reserva) return null;

  const descargar = async () => {
    setDownloading(true); setError('');
    try {
      const ag = getAgenciaData();
      const blob = await reportesApi.generarCierreReserva(reserva.id, {
        agencia: { name: ag.nombre || 'Cusi Travel', slogan: ag.slogan || '', logo_b64: ag.logo_b64 || '' },
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Cierre-${reserva.codigo_reserva || reserva.id}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo generar el cierre de file');
    } finally { setDownloading(false); }
  };

  const th = 'px-2 py-2 text-xs font-bold text-left whitespace-nowrap';
  const td = 'px-2 py-1.5 text-xs whitespace-nowrap';

  return (
    <Modal open={open} onClose={onClose} title={`Cierre de file — ${reserva.codigo_reserva || ''}`} size="full">
      <div className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {!data ? (
          !error && <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              {[
                ['Total operaciones', data.filas.length],
                ...Object.entries(data.totalesPorMoneda).map(([m, v]) => [`Gasto total ${m}`, fmtMoneda(v, m)]),
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl px-4 py-2" style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{l}</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{v}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl overflow-auto" style={{ border: '1px solid var(--border)', maxHeight: '60vh' }}>
              <table className="w-full border-collapse">
                <thead className="sticky top-0">
                  <tr style={{ background: '#0C2350', color: 'white' }}>
                    {['N°', 'Fecha servicio', 'Tipo', 'Detalle gasto', 'Proveedor', 'RUC', 'Cant.', 'Moneda', 'Monto unit.', 'Monto total', 'Fecha emisión', 'Operador', 'Estado']
                      .map(h => <th key={h} className={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.filas.length === 0 ? (
                    <tr><td colSpan={13} className="text-center text-sm py-10" style={{ color: 'var(--text-3)' }}>Esta reserva no tiene operaciones</td></tr>
                  ) : data.filas.map((f, i) => (
                    <tr key={f.n} style={{ background: i % 2 ? 'var(--card-2)' : 'var(--card)', color: 'var(--text)' }}>
                      <td className={td}>{f.n}</td>
                      <td className={td}>{f.fecha_servicio}</td>
                      <td className={td}>{f.tipo_servicio}</td>
                      <td className="px-2 py-1.5 text-xs min-w-[180px]">{f.detalle_gasto}</td>
                      <td className={td}>{f.proveedor || <span style={{ color: '#f59e0b' }}>Sin asignar</span>}</td>
                      <td className={td}>{f.ruc}</td>
                      <td className={`${td} text-center`}>{f.cantidad}</td>
                      <td className={`${td} text-center`}>{f.moneda}</td>
                      <td className={`${td} text-right font-mono`}>{fmtMoneda(f.monto_unitario, f.moneda)}</td>
                      <td className={`${td} text-right font-mono font-semibold`}>{fmtMoneda(f.monto, f.moneda)}</td>
                      <td className={td}>{f.fecha_emision}</td>
                      <td className={td}>{f.operador}</td>
                      <td className={td}>{f.estado}</td>
                    </tr>
                  ))}
                  {Object.entries(data.totalesPorMoneda).map(([m, v]) => (
                    <tr key={m} style={{ background: '#0C2350', color: 'white' }}>
                      <td colSpan={9} className="px-2 py-2 text-xs font-bold text-right">TOTAL GASTOS ({m})</td>
                      <td className="px-2 py-2 text-xs font-bold text-right font-mono">{fmtMoneda(v, m)}</td>
                      <td colSpan={3} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              En el Excel se agrega la columna "Fecha Pago" (amarilla) para completarla a mano.
            </p>
          </>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cerrar</button>
          <button type="button" onClick={descargar} disabled={downloading} className="btn-primary">
            {downloading ? <Spinner size="sm" /> : <Download size={15} />} Descargar Excel
          </button>
        </div>
      </div>
    </Modal>
  );
}
