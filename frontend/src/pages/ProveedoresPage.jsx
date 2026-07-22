import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Phone, Mail } from 'lucide-react';
import { proveedoresApi } from '../api/proveedores.api';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';

const TIPO_COLOR = {
  HOTEL:'blue', TRANSPORTE:'green', RESTAURANTE:'orange', GUIA:'purple',
  AEROLINEA:'teal', TREN:'teal', OPERADOR_LOCAL:'green', SEGURO:'gray',
  ACTIVIDAD:'yellow', OTRO:'gray',
};

const EMPTY = {
  codigo:'', nombre:'', tipo:'', contacto_nombre:'', contacto_email:'',
  contacto_telefono:'', whatsapp:'', observaciones:'', activo: true,
};

function ProveedorForm({ inicial, onSave, onCancel }) {
  const [f, setF] = useState({ ...EMPTY, ...inicial });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(f); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Código <span className="text-red-500">*</span></label>
          <input required className="input-field font-mono" value={f.codigo}
            onChange={e => set('codigo', e.target.value.toUpperCase())} placeholder="PROV-XXX" />
        </div>
        <div>
          <label className="label">Tipo <span className="text-red-500">*</span></label>
          <select required className="input-field" value={f.tipo} onChange={e => set('tipo', e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="HOTEL">Hotel / Alojamiento</option>
            <option value="TRANSPORTE">Transporte</option>
            <option value="RESTAURANTE">Restaurante</option>
            <option value="GUIA">Guía</option>
            <option value="AEROLINEA">Aerolínea</option>
            <option value="TREN">Tren</option>
            <option value="OPERADOR_LOCAL">Operador local</option>
            <option value="SEGURO">Seguro</option>
            <option value="ACTIVIDAD">Actividad</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Nombre <span className="text-red-500">*</span></label>
        <input required className="input-field" value={f.nombre}
          onChange={e => set('nombre', e.target.value)} placeholder="Nombre del proveedor" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Contacto</label>
          <input className="input-field" value={f.contacto_nombre}
            onChange={e => set('contacto_nombre', e.target.value)} placeholder="Nombre de contacto" />
        </div>
        <div>
          <label className="label">Teléfono</label>
          <input className="input-field" value={f.contacto_telefono}
            onChange={e => set('contacto_telefono', e.target.value)} placeholder="+51 984 000 000" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Email</label>
          <input type="email" className="input-field" value={f.contacto_email}
            onChange={e => set('contacto_email', e.target.value)} />
        </div>
        <div>
          <label className="label">WhatsApp</label>
          <input className="input-field" value={f.whatsapp}
            onChange={e => set('whatsapp', e.target.value)} placeholder="+51 984 000 000" />
        </div>
      </div>
      <div>
        <label className="label">Observaciones</label>
        <textarea rows={2} className="input-field resize-none" value={f.observaciones}
          onChange={e => set('observaciones', e.target.value)} />
      </div>
      {inicial?.id && (
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" className="accent-brand-600 w-4 h-4" checked={f.activo}
            onChange={e => set('activo', e.target.checked)} />
          Proveedor activo
        </label>
      )}
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">Guardar proveedor</button>
      </div>
    </form>
  );
}

export default function ProveedoresPage() {
  const [lista, setLista]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [modal, setModal]       = useState(false);
  const [editando, setEditando] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (busqueda) params.busqueda = busqueda;
      if (tipo)     params.tipo     = tipo;
      const r = await proveedoresApi.getAll(params);
      setLista(Array.isArray(r) ? r : (r.data || []));
    } catch (e) { setError(e?.message || e?.error || 'Error al cargar proveedores'); }
    finally { setLoading(false); }
  }, [busqueda, tipo]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    if (editando?.id) await proveedoresApi.update(editando.id, data);
    else              await proveedoresApi.create(data);
    setModal(false); setEditando(null);
    setSuccess('Proveedor guardado');
    load();
  };

  const handleDelete = async (p) => {
    if (!confirm(`¿Desactivar "${p.nombre}"? Se preservan los registros históricos.`)) return;
    await proveedoresApi.remove(p.id);
    setSuccess('Proveedor desactivado');
    load();
  };

  return (
    <div className="space-y-5">
      {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Nombre, código, contacto..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <select className="input-field w-40" value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {Object.keys(TIPO_COLOR).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={() => { setEditando(null); setModal(true); }} className="btn-primary">
          <Plus size={16} /> Nuevo proveedor
        </button>
      </div>

      {loading ? <PageLoader /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {lista.length === 0 ? (
            <div className="col-span-full card p-10 md:p-16 text-center" style={{ color: 'var(--text-2)' }}>Sin proveedores registrados</div>
          ) : lista.map(p => (
            <div key={p.id} className={`card p-5 md:p-7 ${!p.activo ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-3 md:mb-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs md:text-sm px-1.5 md:px-2 py-0.5 rounded"
                      style={{ background: 'var(--card-2)', color: 'var(--text-2)' }}>{p.codigo}</span>
                    {!p.activo && <Badge color="gray">Inactivo</Badge>}
                  </div>
                  <h3 className="font-semibold md:text-lg truncate" style={{ color: 'var(--text)' }}>{p.nombre}</h3>
                  <div className="mt-1"><Badge color={TIPO_COLOR[p.tipo] || 'gray'}>{p.tipo}</Badge></div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditando(p); setModal(true); }} className="btn-ghost p-2 md:p-3">
                    <Edit2 size={14} className="md:hidden" />
                    <Edit2 size={17} className="hidden md:block" />
                  </button>
                  <button onClick={() => handleDelete(p)} className="btn-ghost p-2 md:p-3 text-red-400 hover:text-red-600">
                    <Trash2 size={14} className="md:hidden" />
                    <Trash2 size={17} className="hidden md:block" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 md:space-y-2.5 text-sm md:text-base" style={{ color: 'var(--text-2)' }}>
                {p.contacto_nombre && <p className="font-medium" style={{ color: 'var(--text)' }}>{p.contacto_nombre}</p>}
                {p.contacto_telefono && (
                  <div className="flex items-center gap-1.5 md:gap-2"><Phone size={13} className="md:hidden" style={{ color: 'var(--text-3)' }} /><Phone size={16} className="hidden md:block" style={{ color: 'var(--text-3)' }} />{p.contacto_telefono}</div>
                )}
                {p.contacto_email && (
                  <div className="flex items-center gap-1.5 md:gap-2"><Mail size={13} className="md:hidden" style={{ color: 'var(--text-3)' }} /><Mail size={16} className="hidden md:block" style={{ color: 'var(--text-3)' }} />{p.contacto_email}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditando(null); }}
        title={editando ? 'Editar proveedor' : 'Nuevo proveedor'} size="lg">
        <ProveedorForm inicial={editando} onSave={handleSave} onCancel={() => { setModal(false); setEditando(null); }} />
      </Modal>
    </div>
  );
}
