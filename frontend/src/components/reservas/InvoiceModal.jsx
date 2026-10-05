import { useState, useEffect, useRef } from 'react';
import { Download, Plus, Trash2, ChevronDown, Save, Info } from 'lucide-react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import Alert from '../ui/Alert';
import { reportesApi } from '../../api/reportes.api';
import { getAgenciaData, saveAgenciaData } from '../../pages/AgenciaPage';

const usd = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hoyISO = () => new Date().toLocaleDateString('en-CA');

// Datos de "Mi Agencia" → formato "agency" que espera el backend del invoice.
const agencyFromAgenciaData = () => {
  const ag = getAgenciaData();
  return {
    name:           ag.nombre             || 'Cusi Travel',
    slogan:         ag.slogan             || '',
    address:        ag.direccion          || '',
    city:           [ag.ciudad, ag.pais].filter(Boolean).join(', '),
    phone1:         ag.telefono           || '',
    phone1_contact: ag.telefono_contacto  || '',
    phone2:         ag.telefono2          || '',
    phone2_contact: ag.telefono2_contacto || '',
    phone3:         ag.telefono3          || '',
    phone3_note:    ag.telefono3_nota     || '',
    email:          ag.email              || '',
  };
};

const TO_KEY = (id) => `cusi_invoice_to_${id}`;
const loadTo = (reserva) => {
  try {
    const raw = localStorage.getItem(TO_KEY(reserva.id));
    if (raw) return JSON.parse(raw);
  } catch { /* sin almacenamiento disponible */ }
  return { empresa: reserva.agencia_nombre || '', ruc: '', direccion: '', contacto: '' };
};

/* ── Hoja del invoice (vista previa en HTML, misma estructura que el Excel) ── */
function InvoicePaper({ data, logo }) {
  const { agency, to } = data;
  const cell = { border: '1px solid #ccc', padding: '6px 8px' };
  return (
    <div className="mx-auto text-[12px] leading-snug" style={{ background: '#fff', color: '#222', maxWidth: 720, padding: 28, fontFamily: 'Calibri, Arial, sans-serif' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {logo && <img src={logo} alt="" style={{ maxHeight: 56, marginBottom: 6 }} />}
          <p style={{ fontSize: 17, fontWeight: 700 }}>{agency.name}</p>
          {agency.slogan && <p style={{ fontStyle: 'italic', color: '#888' }}>{agency.slogan}</p>}
        </div>
        <div className="text-right">
          <p style={{ fontSize: 30, fontWeight: 700, color: '#1F3864', lineHeight: 1 }}>Invoice</p>
          <p className="mt-2"><b>Date:</b> {data.fecha_texto}</p>
          <p><b>Invoice #:</b> {data.invoice_number}</p>
          {(to.contacto || to.empresa) && <p><b>Pax:</b> {to.contacto || to.empresa}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-5">
        <div>
          <p><b>FROM:</b> <b>{agency.name}</b></p>
          {agency.address && <p>{agency.address}</p>}
          {agency.city && <p>{agency.city}</p>}
          {agency.phone1 && <p>{agency.phone1}{agency.phone1_contact ? ` (${agency.phone1_contact})` : ''}</p>}
          {agency.phone2 && <p>{agency.phone2}{agency.phone2_contact ? ` (${agency.phone2_contact})` : ''}</p>}
          {agency.phone3 && <p>{agency.phone3}{agency.phone3_note ? ` — ${agency.phone3_note}` : ''}</p>}
          {agency.email && <p style={{ color: '#1155CC' }}>{agency.email}</p>}
        </div>
        <div>
          <p><b>TO:</b> <b>{to.empresa}</b></p>
          {to.ruc && <p>RUC: {to.ruc}</p>}
          {to.direccion && <p>{to.direccion}</p>}
        </div>
      </div>

      <table className="w-full mt-5" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th style={{ ...cell, width: 50, textAlign: 'center' }}>Qty</th>
            <th style={{ ...cell, textAlign: 'left' }}>Description</th>
            <th style={{ ...cell, width: 95, textAlign: 'right' }}>Unit Price</th>
            <th style={{ ...cell, width: 100, textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, i) => (
            <tr key={i}>
              <td style={{ ...cell, textAlign: 'center' }}>{it.qty}</td>
              <td style={cell}>{it.description}</td>
              <td style={{ ...cell, textAlign: 'right' }}>{usd(it.unit_price)}</td>
              <td style={{ ...cell, textAlign: 'right' }}>{usd(it.total)}</td>
            </tr>
          ))}
          {data.descuento > 0 && (
            <tr>
              <td style={cell} />
              <td style={cell}>Discount</td>
              <td style={cell} />
              <td style={{ ...cell, textAlign: 'right' }}>-{usd(data.descuento)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-3 ml-auto" style={{ maxWidth: 360 }}>
        <div className="flex justify-between py-1" style={{ fontWeight: 700 }}>
          <span>Total</span><span>{usd(data.total)}</span>
        </div>
        {data.pagos.map((p, i) => (
          <div key={i} className="flex justify-between py-0.5">
            <span>Payment received{p.fecha_texto ? ` ${p.fecha_texto}` : ''}</span><span>-{usd(p.monto)}</span>
          </div>
        ))}
        <div className="flex justify-between py-1 mt-1" style={{ fontWeight: 700, color: '#1F3864', borderTop: '1px solid #ccc' }}>
          <span>Balance Due</span><span>{usd(data.balance)}</span>
        </div>
      </div>

      <p className="text-center mt-6" style={{ fontSize: 15, fontWeight: 700, fontStyle: 'italic', color: '#1F3864' }}>
        Thank you for choosing {agency.name}!
      </p>
      <p className="text-center mt-1" style={{ fontSize: 10, color: '#888' }}>
        {[agency.address, agency.city, agency.phone1, agency.email].filter(Boolean).join(' • ')}
      </p>
    </div>
  );
}

/* ── Editor del invoice: datos editables a la izquierda, vista previa a la derecha ── */
export default function InvoiceModal({ open, reserva, onClose }) {
  const [agency, setAgency] = useState(agencyFromAgenciaData);
  const [to, setTo]         = useState(() => (reserva ? loadTo(reserva) : {}));
  const [numero, setNumero] = useState(reserva?.codigo_reserva || '');
  const [fecha, setFecha]   = useState(hoyISO);
  const [items, setItems]   = useState(null); // null = aún no se cargan los ítems por defecto
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showFrom, setShowFrom] = useState(false);
  const [error, setError]   = useState('');
  const [info, setInfo]     = useState('');
  const seq = useRef(0);
  const logo = getAgenciaData().logo_b64 || '/logo-cusi.png';

  // Al abrir: datos frescos de Mi Agencia + ítems por defecto calculados por el
  // backend (paquete con su rango de fechas + servicios adicionales).
  useEffect(() => {
    if (!open || !reserva) return;
    setAgency(agencyFromAgenciaData());
    setTo(loadTo(reserva));
    setNumero(reserva.codigo_reserva || '');
    setFecha(hoyISO());
    setItems(null); setPreview(null); setError(''); setInfo('');
    reportesApi.previewInvoice(reserva.id, { agency: agencyFromAgenciaData() })
      .then(r => setItems(r.data.items.map(({ qty, description, unit_price }) => ({ qty, description, unit_price }))))
      .catch(e => setError(e?.error || 'No se pudo cargar el invoice'));
  }, [open, reserva?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const payload = () => ({
    agency, to,
    invoice_number: numero,
    invoice_date: fecha,
    lineItems: (items || []).map(it => ({
      qty: Number(it.qty) || 1,
      description: it.description || '',
      unit_price: Number(it.unit_price) || 0,
    })),
  });

  // Vista previa en vivo (con debounce) cada vez que cambia algún dato.
  useEffect(() => {
    if (!open || !reserva || !items) return;
    const mySeq = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await reportesApi.previewInvoice(reserva.id, payload());
        if (mySeq === seq.current) setPreview(r.data);
      } catch (e) {
        if (mySeq === seq.current) setError(e?.error || 'No se pudo actualizar la vista previa');
      } finally {
        if (mySeq === seq.current) setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [open, agency, to, numero, fecha, items]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !reserva) return null;

  const fTo    = (k, v) => setTo(p => ({ ...p, [k]: v }));
  const fAg    = (k, v) => setAgency(p => ({ ...p, [k]: v }));
  const fItem  = (i, k, v) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const addItem    = () => setItems(p => [...p, { qty: 1, description: '', unit_price: 0 }]);
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));

  const guardarEmisor = () => {
    const [ciudad, ...resto] = (agency.city || '').split(',').map(s => s.trim());
    const ok = saveAgenciaData({
      nombre: agency.name, slogan: agency.slogan, direccion: agency.address,
      ciudad: ciudad || '', pais: resto.join(', '),
      telefono: agency.phone1, telefono_contacto: agency.phone1_contact,
      telefono2: agency.phone2, telefono2_contacto: agency.phone2_contact,
      telefono3: agency.phone3, telefono3_nota: agency.phone3_note,
      email: agency.email,
    });
    setInfo(ok ? 'Datos del emisor guardados en Mi Agencia.' : 'No se pudieron guardar los datos.');
  };

  const descargar = async () => {
    setDownloading(true); setError('');
    try {
      try { localStorage.setItem(TO_KEY(reserva.id), JSON.stringify(to)); } catch { /* opcional */ }
      const blob = await reportesApi.generarInvoice(reserva.id, {
        ...payload(),
        agency: { ...agency, logo_b64: getAgenciaData().logo_b64 || '' },
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Invoice-${reserva.codigo_reserva || reserva.id}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo generar el invoice');
    } finally { setDownloading(false); }
  };

  const FROM_FIELDS = [
    ['name', 'Nombre'], ['slogan', 'Slogan'], ['address', 'Dirección'], ['city', 'Ciudad, país'],
    ['phone1', 'Teléfono 1'], ['phone1_contact', 'Contacto tel. 1'],
    ['phone2', 'Teléfono 2'], ['phone2_contact', 'Contacto tel. 2'],
    ['phone3', 'Teléfono 3'], ['phone3_note', 'Nota tel. 3'], ['email', 'Email'],
  ];

  return (
    <Modal open={open} onClose={onClose} title={`Invoice — ${reserva.codigo_reserva || ''}`} size="full">
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4">
        {/* ── Datos editables ── */}
        <div className="space-y-4">
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}
          {info && <Alert type="success" message={info} onClose={() => setInfo('')} />}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">N° de invoice</label>
              <input className="input-field font-mono" value={numero} onChange={e => setNumero(e.target.value)} />
            </div>
            <div>
              <label className="label">Fecha</label>
              <input type="date" className="input-field" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>TO — Destinatario</p>
            <input className="input-field" value={to.empresa || ''} onChange={e => fTo('empresa', e.target.value)} placeholder="Empresa / Agencia" />
            <div className="grid grid-cols-2 gap-2">
              <input className="input-field font-mono" value={to.ruc || ''} onChange={e => fTo('ruc', e.target.value)} placeholder="RUC / Tax ID" />
              <input className="input-field" value={to.contacto || ''} onChange={e => fTo('contacto', e.target.value)} placeholder="Contacto / Pax" />
            </div>
            <input className="input-field" value={to.direccion || ''} onChange={e => fTo('direccion', e.target.value)} placeholder="Dirección" />
          </div>

          <div className="rounded-xl" style={{ border: '1px solid var(--border)' }}>
            <button type="button" onClick={() => setShowFrom(s => !s)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-widest cursor-pointer"
              style={{ color: 'var(--text-3)' }}>
              FROM — Emisor (Mi Agencia)
              <ChevronDown size={14} className={`transition-transform ${showFrom ? 'rotate-180' : ''}`} />
            </button>
            {showFrom && (
              <div className="px-3 pb-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {FROM_FIELDS.map(([k, l]) => (
                    <div key={k} className={k === 'name' || k === 'address' || k === 'email' ? 'col-span-2' : ''}>
                      <label className="label text-xs">{l}</label>
                      <input className="input-field text-xs" value={agency[k] || ''} onChange={e => fAg(k, e.target.value)} />
                    </div>
                  ))}
                </div>
                <button type="button" onClick={guardarEmisor}
                  className="text-xs font-semibold flex items-center gap-1 cursor-pointer" style={{ color: 'var(--brand)' }}>
                  <Save size={12} /> Guardar como datos predeterminados de Mi Agencia
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Ítems</p>
              <button type="button" onClick={addItem} disabled={!items}
                className="text-xs font-semibold flex items-center gap-1 cursor-pointer" style={{ color: 'var(--brand)' }}>
                <Plus size={12} /> Agregar ítem
              </button>
            </div>
            {!items ? <Spinner size="sm" /> : items.map((it, i) => (
              <div key={i} className="rounded-xl p-2 space-y-1.5" style={{ background: 'var(--card-2)' }}>
                <textarea rows={2} className="input-field text-xs resize-none" value={it.description}
                  onChange={e => fItem(i, 'description', e.target.value)} placeholder="Descripción..." />
                <div className="flex items-center gap-2">
                  <input type="number" min="1" className="input-field text-xs text-center" style={{ width: '4.5rem' }}
                    value={it.qty} onChange={e => fItem(i, 'qty', e.target.value)} title="Cantidad" />
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>×</span>
                  <input type="number" min="0" step="0.01" className="input-field text-xs text-right font-mono flex-1"
                    value={it.unit_price} onChange={e => fItem(i, 'unit_price', e.target.value)} title="Precio unitario" />
                  <span className="text-xs font-mono font-semibold w-20 text-right" style={{ color: 'var(--text-2)' }}>
                    {usd(Number(it.qty || 1) * Number(it.unit_price || 0))}
                  </span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="p-1 cursor-pointer" title="Quitar ítem">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 text-xs rounded-xl p-3" style={{ background: 'var(--card-2)', color: 'var(--text-2)' }}>
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <span>Los pagos (con sus fechas) y el descuento salen de la reserva: se editan en <b>Editar reserva → Datos financieros</b>.</span>
          </div>

          <button type="button" onClick={descargar} disabled={downloading || !items}
            className="btn-primary w-full justify-center">
            {downloading ? <Spinner size="sm" /> : <Download size={15} />} Descargar Invoice (Excel)
          </button>
        </div>

        {/* ── Vista previa ── */}
        <div className="relative rounded-2xl overflow-auto" style={{ background: '#e5e7eb', border: '1px solid var(--border)', minHeight: 500, maxHeight: '75vh' }}>
          {loading && (
            <div className="absolute top-3 right-3 z-10"><Spinner size="sm" /></div>
          )}
          {preview ? (
            <div className="p-4"><InvoicePaper data={preview} logo={logo} /></div>
          ) : (
            <div className="flex items-center justify-center h-full py-24"><Spinner /></div>
          )}
        </div>
      </div>
    </Modal>
  );
}
