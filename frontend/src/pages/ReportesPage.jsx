import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Printer, Hash, DollarSign, Users, FileSpreadsheet, Search, Download, X, Plus, Trash2, FolderOpen, CreditCard, AlertTriangle } from 'lucide-react';
import FiltrosReporte from '../components/reportes/FiltrosReporte';
import Alert from '../components/ui/Alert';
import { PageLoader } from '../components/ui/Spinner';
import { fmtMoneda, fmtFecha } from '../utils/formatters';
import { reservasApi } from '../api/reservas.api';
import { reportesApi } from '../api/reportes.api';
import client from '../api/client';
import { getAgenciaData } from './AgenciaPage';

const LABELS = {
  proveedor_nombre:'Proveedor', tipo_proveedor:'Tipo', reserva_codigo:'Código reserva',
  codigo_reserva:'Código reserva',
  servicio_nombre:'Servicio', fecha_inicio:'Fecha inicio', fecha_fin:'Fecha fin',
  reserva_fecha_inicio:'Fecha inicio', reserva_fecha_fin:'Fecha fin',
  n_pasajeros:'Pax', operador_nombre:'Operador', descripcion_detalle:'Descripción',
  descripcion:'Descripción', servicio_descripcion:'Descripción',
  cantidad:'Cantidad', costo_unitario_usd:'Costo unit.', costo_total_usd:'Costo total',
  estado_detalle:'Estado', detalle_estado:'Estado', confirmacion_ref:'Confirmación',
  estado_operacion:'Estado op.', reserva_estado:'Estado reserva',
  estado_pago:'Estado pago', total_usd:'Total USD', adelanto_usd:'Adelanto',
  saldo_usd:'Saldo', agencia_nombre:'Agencia', observaciones:'Observaciones',
  notas_proveedor:'Notas', notas:'Notas', tipo_servicio:'Tipo servicio',
  contacto_nombre:'Contacto', contacto_email:'Email prov.', contacto_telefono:'Tel. prov.',
  idioma_servicio:'Idioma', servicio_turistico:'Servicio turístico',
  briefing_fecha:'Fecha briefing', briefing_hora:'Hora briefing', briefing_lugar:'Lugar briefing',
  briefing_persona_encargada:'Encargado briefing', briefing_notas:'Notas briefing',
};

/* ── Summary KPI strip ─────────────────────────────────────────── */
function SummaryStrip({ rows }) {
  const totalCosto = rows.reduce((s, r) => s + Number(r.costo_total_usd || 0), 0);
  const totalUsd = rows.reduce((s, r) => s + Number(r.total_usd || 0), 0);
  const provUnicos = [...new Set(rows.map(r => r.proveedor_nombre).filter(Boolean))].length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[
        { label: 'Registros', value: rows.length, icon: Hash, color: 'var(--brand)' },
        { label: 'Costo total', value: fmtMoneda(totalCosto || totalUsd), icon: DollarSign, color: '#10b981' },
        { label: 'Proveedores únicos', value: provUnicos || '—', icon: Users, color: '#f59e0b' },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="rounded-2xl p-4 md:p-7 text-center overflow-hidden"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl mx-auto mb-2 md:mb-3 flex items-center justify-center"
            style={{ background: `${color}22` }}>
            <Icon size={14} className="md:hidden" style={{ color }} />
            <Icon size={22} className="hidden md:block" style={{ color }} />
          </div>
          <p className="text-xl md:text-3xl font-black leading-none break-words" style={{ color: 'var(--text)' }}>{value}</p>
          <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--text-3)' }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Data row ─────────────────────────────────────────────────── */
function DataRow({ row, cols, index }) {
  const isEven = index % 2 === 0;
  return (
    <div className="flex items-start gap-2 py-3 px-4 text-xs flex-wrap"
      style={{
        borderBottom: '1px solid var(--border)',
        background: isEven ? 'transparent' : 'var(--card-2)',
      }}>
      <span className="text-xs font-semibold w-5 flex-shrink-0" style={{ color: 'var(--text-3)' }}>
        {index + 1}
      </span>
      {cols.map(c => {
        const v = row[c];
        const isUsd = c.includes('usd');
        const isFecha = c.startsWith('fecha_') || c.includes('fecha');
        return (
          <div key={c} className="min-w-[80px] flex-1">
            <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-3)' }}>
              {LABELS[c] || c}
            </p>
            <p className={`text-xs ${isUsd ? 'font-mono font-semibold' : ''}`} style={{ color: 'var(--text)' }}>
              {isUsd ? fmtMoneda(v) : isFecha ? fmtFecha(v) : (v ?? '—')}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ── helpers ── */
function getBank() {
  const ag = getAgenciaData();
  return {
    banco:          ag.banco          || '',
    cuenta_titular: ag.cuenta_titular || '',
    ruc:            ag.cuenta_ruc     || '',
    cuenta_numero:  ag.cuenta_numero  || '',
    cuenta_cci:     ag.cuenta_cci     || '',
    moneda:         ag.cuenta_moneda  || 'USD',
  };
}

/* ── Modal: formulario TO + items ── */
function InvoiceModal({ reserva, onClose }) {
  const [to, setTo] = useState({
    empresa:   reserva.agencia_nombre || '',
    ruc:       '',
    direccion: '',
    contacto:  '',
  });
  const [items, setItems] = useState([{
    qty:         reserva.n_pasajeros || 1,
    description: reserva.servicio_nombre || reserva.nombre_servicio_snap || '',
    unit_price:  Number(reserva.precio_usd_por_pax || 0),
  }]);
  const [desc, setDesc]   = useState(false);
  const [error, setError] = useState('');

  // Pre-poblar con los servicios adicionales de la reserva (ej. renta de
  // bastones) — antes solo se veía una línea con el precio base del paquete.
  useEffect(() => {
    reservasApi.getById(reserva.id).then(r => {
      const extras = r.data?.servicios_adicionales || [];
      if (!extras.length) return;
      setItems(prev => [
        ...prev,
        ...extras.map(e => ({
          qty: e.cantidad, description: e.nombre, unit_price: Number(e.precio_unitario_usd || 0),
        })),
      ]);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reserva.id]);

  const fTo   = (k, v) => setTo(p => ({ ...p, [k]: v }));
  const fItem = (i, k, v) => setItems(p => { const n = [...p]; n[i] = { ...n[i], [k]: v }; return n; });
  const addItem    = () => setItems(p => [...p, { qty: 1, description: '', unit_price: 0 }]);
  const removeItem = i  => setItems(p => p.filter((_, idx) => idx !== i));

  const descargar = async () => {
    setDesc(true); setError('');
    try {
      const token = localStorage.getItem('cusi_token');
      const ag    = getAgenciaData();
      const body  = {
        agency: {
          name:           ag.nombre             || 'Cusi Travel',
          slogan:         ag.slogan             || '',
          address:        ag.direccion          || '',
          city:           `${ag.ciudad || 'Cusco'}, ${ag.pais || 'Peru'}`,
          phone1:         ag.telefono           || '',
          phone1_contact: ag.telefono_contacto  || '',
          phone2:         ag.telefono2          || '',
          phone2_contact: ag.telefono2_contacto || '',
          phone3:         ag.telefono3          || '',
          phone3_note:    ag.telefono3_nota     || '',
          email:          ag.email              || '',
          logo_b64:       ag.logo_b64           || '',
        },
        bank: getBank(),
        to,
        lineItems: items.map(it => ({
          qty:        Number(it.qty || 1),
          description: it.description,
          unit_price:  Number(it.unit_price || 0),
        })),
      };
      const resp = await fetch(`/api/reportes/invoice/${reserva.id}`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (!resp.ok) {
        const json = await resp.json().catch(() => ({}));
        throw new Error(json.error || `Error ${resp.status}`);
      }
      const blob = await resp.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `Invoice-${reserva.codigo_reserva}.xlsx`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      onClose();
    } catch (e) { setError(e?.message || 'Error al generar invoice'); }
    finally { setDesc(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: 'var(--card)', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: '#0C2350' }}>
          <div>
            <h3 className="font-bold text-white">Invoice — {reserva.codigo_reserva}</h3>
            <p className="text-white/60 text-xs mt-0.5">{reserva.servicio_nombre || reserva.nombre_servicio_snap}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          {/* TO */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
              TO — Datos del destinatario
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Empresa / Agencia</label>
                <input className="input-field" value={to.empresa}
                  onChange={e => fTo('empresa', e.target.value)} placeholder="Nombre de la empresa..." />
              </div>
              <div>
                <label className="label">RUC / Tax ID</label>
                <input className="input-field font-mono" value={to.ruc}
                  onChange={e => fTo('ruc', e.target.value)} placeholder="20601234567" />
              </div>
              <div>
                <label className="label">Contacto (persona)</label>
                <input className="input-field" value={to.contacto}
                  onChange={e => fTo('contacto', e.target.value)} placeholder="Nombre del contacto" />
              </div>
              <div className="col-span-2">
                <label className="label">Dirección</label>
                <input className="input-field" value={to.direccion}
                  onChange={e => fTo('direccion', e.target.value)} placeholder="Dirección fiscal..." />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                Items / Servicios
              </h4>
              <button onClick={addItem}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'var(--brand)', color: 'white' }}>
                <Plus size={12} /> Agregar ítem
              </button>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wide"
                style={{ background: 'var(--card-2)', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
                <span className="col-span-1 text-center">Qty</span>
                <span className="col-span-6">Descripción</span>
                <span className="col-span-3 text-right">Precio unit.</span>
                <span className="col-span-1 text-right">Total</span>
                <span className="col-span-1"></span>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center px-3 py-2"
                  style={{ borderBottom: i < items.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <input type="number" min="1" className="input-field col-span-1 text-center px-1 text-xs"
                    value={item.qty} onChange={e => fItem(i, 'qty', e.target.value)} />
                  <input className="input-field col-span-6 text-xs" value={item.description}
                    onChange={e => fItem(i, 'description', e.target.value)} placeholder="Descripción..." />
                  <input type="number" min="0" step="0.01" className="input-field col-span-3 text-right font-mono text-xs"
                    value={item.unit_price} onChange={e => fItem(i, 'unit_price', e.target.value)} />
                  <span className="col-span-1 text-right text-xs font-mono font-semibold"
                    style={{ color: 'var(--text-2)' }}>
                    ${(Number(item.qty||1)*Number(item.unit_price||0)).toFixed(2)}
                  </span>
                  <div className="col-span-1 flex justify-end">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="p-1 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-6 px-4 py-2 text-xs font-bold"
                style={{ background: 'var(--card-2)', borderTop: '1px solid var(--border)', color: 'var(--text)' }}>
                <span>Total</span>
                <span className="font-mono">
                  ${items.reduce((s, it) => s + Number(it.qty||1)*Number(it.unit_price||0), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--card-2)' }}>
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={descargar} disabled={desc}
            className="btn-primary flex items-center gap-2">
            {desc ? <span className="animate-spin inline-block">⟳</span> : <Download size={14} />}
            Descargar Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── BankPanel ───────────────────────────────────────────────── */
function BankPanel() {
  const navigate = useNavigate();
  const bank = getBank();
  const hasData = !!(bank.banco || bank.cuenta_numero);

  return (
    <div className="card p-5 space-y-3" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CreditCard size={14} style={{ color: 'var(--brand)' }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
            Datos bancarios del Invoice
          </span>
        </div>
        <button
          onClick={() => navigate('/mi-agencia')}
          className="text-xs font-semibold hover:underline flex-shrink-0"
          style={{ color: 'var(--brand)' }}>
          Editar en Mi Agencia →
        </button>
      </div>

      {!hasData ? (
        <div className="flex items-center gap-2 rounded-xl p-3"
          style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <AlertTriangle size={14} style={{ color: '#d97706' }} className="flex-shrink-0" />
          <p className="text-xs" style={{ color: '#92400e' }}>
            No hay datos bancarios configurados. El invoice se generará sin sección de pago.{' '}
            <button onClick={() => navigate('/mi-agencia')} className="underline font-semibold">
              Configurar ahora
            </button>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
          {[
            ['Banco',    bank.banco],
            ['Titular',  bank.cuenta_titular],
            ['N° cuenta',bank.cuenta_numero],
            ['CCI',      bank.cuenta_cci],
            ['RUC',      bank.ruc],
            ['Moneda',   bank.moneda],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label}>
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>{label}: </span>
              <span className="text-xs font-semibold font-mono" style={{ color: 'var(--text)' }}>{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Invoice Section ─────────────────────────────────────────── */
function InvoiceSection() {
  const [busqueda, setBusqueda] = useState('');
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState('');
  const [modal, setModal]      = useState(null);

  const buscar = async () => {
    if (!busqueda.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await reservasApi.getAll({ busqueda: busqueda.trim(), limit: 20 });
      setReservas(Array.isArray(res) ? res : (res.data || []));
    } catch (e) {
      setError(e?.message || 'Error al buscar reservas');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      {modal && <InvoiceModal reserva={modal} onClose={() => setModal(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Hero */}
      <div className="rounded-2xl p-6 flex items-center gap-5"
        style={{ background: 'linear-gradient(135deg, #0C2350 0%, #1A4080 100%)', color: 'white' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          <FileSpreadsheet size={28} />
        </div>
        <div>
          <h2 className="font-bold text-lg">Generar Invoice Excel</h2>
          <p className="text-white/70 text-sm mt-0.5">
            Busca una reserva, completa los datos del destinatario y descarga el .xlsx.
          </p>
        </div>
      </div>

      {/* Panel bancario */}
      <BankPanel />

      {/* Buscador */}
      <div className="card p-5 space-y-3">
        <label className="label font-semibold">Buscar reserva</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-9"
              placeholder="Código reserva, cliente, agencia..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscar()}
            />
          </div>
          <button onClick={buscar} disabled={loading} className="btn-primary flex items-center gap-2 flex-shrink-0">
            <Search size={15} /> Buscar
          </button>
        </div>
      </div>

      {/* Resultados */}
      {loading && <PageLoader />}
      {!loading && reservas.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="px-4 py-3 flex items-center gap-2 text-sm font-semibold"
            style={{ background: 'var(--card-2)', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>
            <FileSpreadsheet size={15} style={{ color: 'var(--brand)' }} />
            {reservas.length} reserva{reservas.length !== 1 ? 's' : ''} encontrada{reservas.length !== 1 ? 's' : ''}
          </div>
          <div style={{ background: 'var(--card)' }}>
            {reservas.map((r, i) => (
              <div key={r.id} className="flex items-center gap-4 px-4 py-3 text-sm"
                style={{ borderBottom: i < reservas.length-1 ? '1px solid var(--border)' : 'none',
                         background: i%2===0 ? 'transparent' : 'var(--card-2)' }}>
                <div className="flex-shrink-0 w-36">
                  <p className="font-bold font-mono text-xs" style={{ color: 'var(--brand)' }}>{r.codigo_reserva}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{fmtFecha(r.fecha_inicio)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-xs" style={{ color: 'var(--text)' }}>
                    {r.servicio_nombre || r.nombre_servicio_snap || '—'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                    {r.agencia_nombre || '—'} · {r.n_pasajeros} pax
                  </p>
                </div>
                <div className="flex-shrink-0 text-right hidden sm:block">
                  <p className="font-semibold text-xs font-mono" style={{ color: 'var(--text)' }}>
                    {fmtMoneda(r.total_usd)}
                  </p>
                  <p className="text-xs" style={{ color: Number(r.saldo_usd) > 0 ? '#ef4444' : '#10b981' }}>
                    Saldo: {fmtMoneda(r.saldo_usd)}
                  </p>
                </div>
                <button onClick={() => setModal(r)}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: '#0C2350', color: 'white' }}>
                  <Download size={13} /> Invoice
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!loading && reservas.length === 0 && busqueda && (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <FileSpreadsheet size={36} className="mx-auto mb-3" style={{ color: 'var(--text-3)', opacity:0.3 }} />
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>No se encontraron reservas</p>
        </div>
      )}
    </div>
  );
}

/* ── Cierre de File Section ──────────────────────────────────── */
const MESES = [
  { v: 1, l: 'Enero' }, { v: 2, l: 'Febrero' }, { v: 3, l: 'Marzo' },
  { v: 4, l: 'Abril' }, { v: 5, l: 'Mayo' },    { v: 6, l: 'Junio' },
  { v: 7, l: 'Julio' }, { v: 8, l: 'Agosto' },  { v: 9, l: 'Septiembre' },
  { v: 10, l: 'Octubre' }, { v: 11, l: 'Noviembre' }, { v: 12, l: 'Diciembre' },
];

function CierreSection() {
  const now  = new Date();
  const [mes,  setMes]  = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [desc, setDesc] = useState(false);
  const [error, setError] = useState('');

  const descargar = async () => {
    setDesc(true); setError('');
    try {
      const token = localStorage.getItem('cusi_token');
      const ag    = getAgenciaData();
      const agencia = {
        name:    ag.nombre   || 'Cusi Travel',
        slogan:  ag.slogan   || '',
        logo_b64: ag.logo_b64 || '',
      };
      const resp = await fetch(`/api/reportes/cierre?mes=${mes}&anio=${anio}`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ agencia }),
      });
      if (!resp.ok) {
        const json = await resp.json().catch(() => ({}));
        throw new Error(json.error || `Error ${resp.status}`);
      }
      const blob     = await resp.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement('a');
      const mesNombre = MESES.find(m => m.v === mes)?.l || mes;
      a.href = url; a.download = `Cierre-${mesNombre}-${anio}.xlsx`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { setError(e?.message || 'Error al generar el cierre'); }
    finally { setDesc(false); }
  };

  return (
    <div className="space-y-5">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Hero */}
      <div className="rounded-2xl p-6 flex items-center gap-5"
        style={{ background: 'linear-gradient(135deg, #0C2350 0%, #1A4080 100%)', color: 'white' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          <FolderOpen size={28} />
        </div>
        <div>
          <h2 className="font-bold text-lg">Cierre de File Mensual</h2>
          <p className="text-white/70 text-sm mt-0.5">
            Reporte Excel con todas las operaciones (gastos a proveedores) del mes seleccionado.
          </p>
        </div>
      </div>

      {/* Selector mes/año */}
      <div className="card p-6 space-y-5">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>Seleccionar período</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="label">Mes</label>
            <select className="input-field" value={mes} onChange={e => setMes(Number(e.target.value))}>
              {MESES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </div>
          <div className="w-32">
            <label className="label">Año</label>
            <input
              type="number" className="input-field font-mono"
              min={2020} max={2099}
              value={anio} onChange={e => setAnio(Number(e.target.value))}
            />
          </div>
          <button onClick={descargar} disabled={desc}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{ background: desc ? 'var(--card-2)' : '#0C2350',
                     color: desc ? 'var(--text-3)' : 'white',
                     boxShadow: desc ? 'none' : '0 4px 14px rgba(12,35,80,0.35)' }}>
            {desc
              ? <><span className="animate-spin inline-block">⟳</span> Generando...</>
              : <><Download size={15} /> Descargar Excel</>
            }
          </button>
        </div>

        {/* Info de campos */}
        <div className="rounded-xl p-4 space-y-2"
          style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
            Campos incluidos en el reporte
          </p>
          <div className="flex flex-wrap gap-2">
            {['N°', 'Código Reserva', 'Fecha Servicio', 'Tipo', 'Detalle Gasto',
              'Proveedor', 'RUC', 'Cant.', 'Monto Unit.', 'Monto Total',
              'Fecha Emisión', 'Fecha Pago *', 'Operador', 'Estado'].map(f => (
              <span key={f} className="text-xs px-2 py-1 rounded-lg font-medium"
                style={{ background: f.includes('*') ? '#fffde7' : 'var(--card)',
                         color: f.includes('*') ? '#a07800' : 'var(--text-2)',
                         border: '1px solid var(--border)' }}>
                {f}
              </span>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            * Fecha Pago aparece en amarillo en el Excel para completar manualmente.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function ReportesPage() {
  const [tab, setTab]           = useState('reportes');
  const [rows, setRows]         = useState([]);
  const [campos, setCampos]     = useState([]);
  const [filtrosActivos, setFiltrosActivos] = useState({});
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [ejecutado, setEjecutado] = useState(false);
  const [descargandoExcel, setDescargandoExcel] = useState(false);

  const handleResultados = (data, camposArr, filtros) => {
    setRows(data || []);
    setCampos(camposArr || []);
    setFiltrosActivos(filtros || {});
    setEjecutado(true);
  };

  const descargarExcel = async () => {
    setDescargandoExcel(true);
    try {
      const blob = await reportesApi.reporteProveedoresExcel({ ...filtrosActivos, labels: LABELS });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'Reporte-Proveedores.xlsx';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { setError('No se pudo generar el Excel'); }
    finally { setDescargandoExcel(false); }
  };

  const cols = campos.length ? campos : Object.keys(LABELS);

  const TABS = [
    { key: 'reportes', label: 'Reportes',        icon: BarChart3 },
    { key: 'invoice',  label: 'Invoice Excel',   icon: FileSpreadsheet },
    { key: 'cierre',   label: 'Cierre de File',  icon: FolderOpen },
  ];

  return (
    <div className="space-y-5">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Pestañas */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === key
              ? { background: 'var(--brand)', color: 'white', boxShadow: 'var(--shadow-sm)' }
              : { color: 'var(--text-2)' }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'invoice'  && <InvoiceSection />}
      {tab === 'cierre'   && <CierreSection />}

      {tab === 'reportes' && <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* ── Filters panel ── */}
        <div className="xl:col-span-1">
          <FiltrosReporte onResultados={handleResultados} />
        </div>

        {/* ── Results panel ── */}
        <div className="xl:col-span-3 space-y-4">
          {loading && <PageLoader />}

          {!loading && ejecutado && (
            <>
              <SummaryStrip rows={rows} />

              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                  <BarChart3 size={16} style={{ color: 'var(--brand)' }} />
                  <span><strong style={{ color: 'var(--text)' }}>{rows.length}</strong> resultados</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={descargarExcel} disabled={descargandoExcel} className="btn-primary">
                    <FileSpreadsheet size={15} /> {descargandoExcel ? 'Generando...' : 'Descargar Excel'}
                  </button>
                  <button onClick={() => window.print()} className="btn-secondary">
                    <Printer size={15} /> Imprimir
                  </button>
                </div>
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block rounded-2xl overflow-hidden print:shadow-none"
                style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead style={{ background: 'var(--card-2)', borderBottom: '1px solid var(--border)' }}>
                      <tr>
                        <th className="table-header">#</th>
                        {cols.map(c => (
                          <th key={c} className="table-header whitespace-nowrap">{LABELS[c] || c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={cols.length + 1} className="text-center py-12">
                            <BarChart3 size={32} className="mx-auto mb-2" style={{ color: 'var(--text-3)' }} />
                            <p className="text-sm" style={{ color: 'var(--text-2)' }}>Sin resultados</p>
                          </td>
                        </tr>
                      ) : rows.map((r, i) => (
                        <tr key={i}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            background: i % 2 === 0 ? 'transparent' : 'var(--card-2)',
                          }}>
                          <td className="table-cell font-semibold" style={{ color: 'var(--text-3)' }}>{i + 1}</td>
                          {cols.map(c => {
                            const v = r[c];
                            const isUsd = c.includes('usd');
                            const isFecha = c.startsWith('fecha_') || c.includes('fecha');
                            return (
                              <td key={c} className={`table-cell ${isUsd ? 'font-mono font-semibold' : ''}`}
                                style={{ color: 'var(--text)' }}>
                                {isUsd ? fmtMoneda(v) : isFecha ? fmtFecha(v) : (v ?? '—')}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile: card rows */}
              <div className="md:hidden rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--border)', background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
                {rows.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 size={32} className="mx-auto mb-2" style={{ color: 'var(--text-3)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-2)' }}>Sin resultados</p>
                  </div>
                ) : rows.map((r, i) => <DataRow key={i} row={r} cols={cols} index={i} />)}
              </div>
            </>
          )}

          {!loading && !ejecutado && (
            <div className="rounded-2xl p-16 flex flex-col items-center justify-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <BarChart3 size={48} className="mb-4" style={{ color: 'var(--text-3)', opacity: 0.3 }} />
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                Configura los filtros y haz clic en <strong style={{ color: 'var(--text)' }}>Generar reporte</strong>
              </p>
            </div>
          )}
        </div>
      </div>}
    </div>
  );
}
