import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Building, Phone, Mail, Hash } from 'lucide-react';
import { agenciasApi } from '../api/agencias.api';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';

const EMPTY = { nombre: '', codigo: '', contacto: '', telefono: '', email: '', activo: true };

function AgenciaForm({ inicial, onSave, onCancel }) {
  const [f, setF] = useState({ ...EMPTY, ...inicial });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(f); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Nombre <span className="text-red-500">*</span></label>
          <input required className="input-field" value={f.nombre}
            onChange={e => set('nombre', e.target.value)} placeholder="Adventure Tours" />
        </div>
        <div>
          <label className="label">Código</label>
          <input className="input-field font-mono" value={f.codigo}
            onChange={e => set('codigo', e.target.value.toUpperCase())} placeholder="AT-001" />
        </div>
      </div>
      <div>
        <label className="label">Persona de contacto</label>
        <input className="input-field" value={f.contacto}
          onChange={e => set('contacto', e.target.value)} placeholder="Nombre del contacto" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Teléfono</label>
          <input className="input-field" value={f.telefono}
            onChange={e => set('telefono', e.target.value)} placeholder="+1 555 000 0000" />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input-field" value={f.email}
            onChange={e => set('email', e.target.value)} placeholder="agencia@mail.com" />
        </div>
      </div>
      {inicial?.id && (
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-2)' }}>
          <input type="checkbox" className="accent-brand-600 w-4 h-4" checked={f.activo}
            onChange={e => set('activo', e.target.checked)} />
          Agencia activa
        </label>
      )}
      <div className="flex gap-3 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {inicial?.id ? 'Guardar cambios' : 'Agregar agencia'}
        </button>
      </div>
    </form>
  );
}

export default function AgenciasPage() {
  const [agencias, setAgencias] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal]       = useState(false);
  const [editando, setEditando] = useState(null);
  const [alerta, setAlerta]     = useState('');
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await agenciasApi.getAll();
      setAgencias(r.data || []);
    } catch (e) {
      setError(e.error || e.message || 'Error al cargar agencias');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    try {
      if (editando?.id) await agenciasApi.update(editando.id, data);
      else              await agenciasApi.create(data);
      setModal(false);
      setEditando(null);
      setAlerta(editando ? 'Agencia actualizada.' : 'Agencia agregada.');
      setTimeout(() => setAlerta(''), 3000);
      load();
    } catch (e) {
      setError(e.error || e.message || 'Error al guardar la agencia');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar esta agencia?')) return;
    try {
      await agenciasApi.remove(id);
      load();
    } catch (e) {
      setError(e.error || e.message || 'Error al eliminar la agencia');
    }
  };

  const handleEdit = (a) => { setEditando(a); setModal(true); };
  const handleNew  = () => { setEditando(null); setModal(true); };

  const filtradas = agencias.filter(a =>
    !busqueda ||
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (a.codigo && a.codigo.toLowerCase().includes(busqueda.toLowerCase())) ||
    (a.contacto && a.contacto.toLowerCase().includes(busqueda.toLowerCase()))
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {alerta && <Alert type="success" message={alerta} onClose={() => setAlerta('')} />}
      {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black" style={{ color: 'var(--text)' }}>Agencias</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            Agencias y operadores que envían reservas
          </p>
        </div>
        <button onClick={handleNew} className="btn-primary gap-1.5 text-sm">
          <Plus size={15} /> Nueva agencia
        </button>
      </div>

      {/* Búsqueda */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)' }}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            className="input-field pl-9"
            placeholder="Buscar agencia..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="rounded-2xl text-center py-16" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
          <Building size={36} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
            {agencias.length === 0 ? 'No hay agencias registradas' : 'Sin resultados'}
          </p>
          {agencias.length === 0 && (
            <button onClick={handleNew} className="mt-3 text-xs hover:underline" style={{ color: 'var(--brand)' }}>
              Agregar primera agencia
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtradas.map(a => (
            <div key={a.id} className={`rounded-2xl p-4 flex flex-col gap-3 ${a.activo === false ? 'opacity-60' : ''}`}
              style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-sm leading-tight truncate" style={{ color: 'var(--text)' }}>
                      {a.nombre}
                    </p>
                    {a.activo === false && <Badge color="gray">Inactivo</Badge>}
                  </div>
                  {a.codigo && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md mt-1"
                      style={{ background: 'var(--brand-bg)', color: 'var(--brand)' }}>
                      <Hash size={10} />{a.codigo}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => handleEdit(a)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: 'var(--card-2)', color: 'var(--text-2)' }}
                    title="Editar">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(a.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                    title="Eliminar">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-2)' }}>
                {a.contacto && (
                  <div className="flex items-center gap-2">
                    <Building size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                    <span className="truncate">{a.contacto}</span>
                  </div>
                )}
                {a.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                    <span>{a.telefono}</span>
                  </div>
                )}
                {a.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                    <span className="truncate">{a.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditando(null); }}
        title={editando ? 'Editar agencia' : 'Nueva agencia'}>
        <AgenciaForm
          key={editando?.id || 'new'}
          inicial={editando}
          onSave={handleSave}
          onCancel={() => { setModal(false); setEditando(null); }}
        />
      </Modal>
    </div>
  );
}
