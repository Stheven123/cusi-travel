import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Key, UserCheck, UserX } from 'lucide-react';
import { usuariosApi } from '../api/usuarios.api';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import { fmtFecha } from '../utils/formatters';

const ROLES = ['ADMIN','OPERACIONES','VENTAS','FINANZAS','GUIA','SOLO_LECTURA'];
const ROL_COLOR = { ADMIN:'red', OPERACIONES:'blue', VENTAS:'green', FINANZAS:'orange', GUIA:'purple', SOLO_LECTURA:'gray' };
const EMPTY_USER = { codigo:'', nombre:'', apellido:'', email:'', password:'', rol:'OPERACIONES', activo:true };

function UsuarioForm({ inicial, onSave, onCancel }) {
  const [f, setF] = useState({ ...EMPTY_USER, ...inicial, password: '' });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const esNuevo = !inicial?.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Backend exige: codigo (USR-###), nombre, apellido, email, password (al crear), rol.
    const payload = esNuevo
      ? { codigo: f.codigo.trim(), nombre: f.nombre.trim(), apellido: f.apellido.trim(),
          email: f.email.trim(), password: f.password, rol: f.rol, activo: f.activo }
      : { nombre: f.nombre.trim(), apellido: f.apellido.trim(),
          email: f.email.trim(), rol: f.rol, activo: f.activo };
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {esNuevo && (
        <div>
          <label className="label">Código <span className="text-red-500">*</span></label>
          <input required className="input-field font-mono" value={f.codigo}
            onChange={e => set('codigo', e.target.value.toUpperCase())}
            placeholder="USR-007" pattern="USR-\d{3,}" title="Formato: USR-001" />
          <p className="text-xs text-gray-400 mt-1">Formato: USR-001</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Nombre <span className="text-red-500">*</span></label>
          <input required minLength={2} className="input-field" value={f.nombre}
            onChange={e => set('nombre', e.target.value)} placeholder="María" />
        </div>
        <div>
          <label className="label">Apellido <span className="text-red-500">*</span></label>
          <input required minLength={2} className="input-field" value={f.apellido}
            onChange={e => set('apellido', e.target.value)} placeholder="López Quispe" />
        </div>
      </div>
      <div>
        <label className="label">Correo electrónico <span className="text-red-500">*</span></label>
        <input required type="email" className="input-field" value={f.email}
          onChange={e => set('email', e.target.value)} placeholder="usuario@cusitravel.pe" />
      </div>
      {esNuevo && (
        <div>
          <label className="label">Contraseña <span className="text-red-500">*</span></label>
          <input required type="password" className="input-field" value={f.password}
            onChange={e => set('password', e.target.value)} minLength={8} />
          <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres</p>
        </div>
      )}
      <div>
        <label className="label">Rol <span className="text-red-500">*</span></label>
        <select required className="input-field" value={f.rol} onChange={e => set('rol', e.target.value)}>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      {!esNuevo && (
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" className="accent-brand-600 w-4 h-4" checked={f.activo}
            onChange={e => set('activo', e.target.checked)} />
          Usuario activo
        </label>
      )}
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary">Guardar usuario</button>
      </div>
    </form>
  );
}

function CambiarPasswordForm({ usuario, onSave, onCancel }) {
  const [f, setF] = useState({ password_nuevo: '', confirmar: '' });
  const ok = f.password_nuevo.length >= 8 && f.password_nuevo === f.confirmar;

  return (
    <form onSubmit={e => { e.preventDefault(); if (ok) onSave(f.password_nuevo); }} className="space-y-4">
      <p className="text-sm text-gray-600">Cambiar contraseña de <strong>{usuario ? `${usuario.nombre} ${usuario.apellido}` : ''}</strong></p>
      <div>
        <label className="label">Nueva contraseña <span className="text-red-500">*</span></label>
        <input required type="password" className="input-field" value={f.password_nuevo} minLength={8}
          onChange={e => setF(p => ({ ...p, password_nuevo: e.target.value }))} />
      </div>
      <div>
        <label className="label">Confirmar contraseña <span className="text-red-500">*</span></label>
        <input required type="password" className={`input-field ${f.confirmar && !ok ? 'border-red-400' : ''}`}
          value={f.confirmar} onChange={e => setF(p => ({ ...p, confirmar: e.target.value }))} />
        {f.confirmar && !ok && <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden o son muy cortas</p>}
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={!ok} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          <Key size={14} /> Cambiar contraseña
        </button>
      </div>
    </form>
  );
}

export default function UsuariosPage() {
  const [lista, setLista]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [modal, setModal]       = useState(false);
  const [pwModal, setPwModal]   = useState(false);
  const [editando, setEditando] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await usuariosApi.getAll(); setLista(r.data || []); }
    catch { setError('Error al cargar usuarios'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    if (editando?.id) await usuariosApi.update(editando.id, data);
    else              await usuariosApi.create(data);
    setModal(false); setEditando(null);
    setSuccess('Usuario guardado');
    load();
  };

  const handlePassword = async (nuevaPassword) => {
    await usuariosApi.cambiarPassword(editando.id, { nueva_password: nuevaPassword });
    setPwModal(false); setEditando(null);
    setSuccess('Contraseña actualizada');
  };

  const handleToggle = async (u) => {
    if (!confirm(`¿${u.activo ? 'Desactivar' : 'Activar'} al usuario "${u.nombre} ${u.apellido}"?`)) return;
    await usuariosApi.toggleActivo(u.id);
    setSuccess(`Usuario ${u.activo ? 'desactivado' : 'activado'}`);
    load();
  };

  return (
    <div className="space-y-5">
      {error   && <Alert type="error"   message={error}   onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="flex justify-end">
        <button onClick={() => { setEditando(null); setModal(true); }} className="btn-primary">
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {loading ? <PageLoader /> : lista.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">Sin usuarios registrados</div>
      ) : (
        <>
          {/* ── Mobile: cards ── */}
          <div className="md:hidden space-y-3">
            {lista.map(u => (
              <div key={u.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${!u.activo ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{u.nombre} {u.apellido}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge color={ROL_COLOR[u.rol] || 'gray'}>{u.rol}</Badge>
                    <Badge color={u.activo ? 'green' : 'gray'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Creado: {fmtFecha(u.creado_en)}</p>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditando(u); setModal(true); }}
                      aria-label="Editar usuario"
                      className="btn-ghost p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => { setEditando(u); setPwModal(true); }}
                      aria-label="Cambiar contraseña"
                      className="btn-ghost p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer">
                      <Key size={15} />
                    </button>
                    <button onClick={() => handleToggle(u)}
                      aria-label={u.activo ? 'Desactivar' : 'Activar'}
                      className={`btn-ghost p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${u.activo ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'}`}>
                      {u.activo ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop: tabla ── */}
          <div className="hidden md:block table-wrap">
            <table className="min-w-full">
              <thead className="table-head">
                <tr>
                  <th className="table-header">Usuario</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Rol</th>
                  <th className="table-header">Estado</th>
                  <th className="table-header">Creado</th>
                  <th className="table-header">Último acceso</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody>
                {lista.map(u => (
                  <tr key={u.id} className={`table-row ${!u.activo ? 'opacity-60' : ''}`}>
                    <td className="table-cell font-semibold">{u.nombre} {u.apellido}</td>
                    <td className="table-cell" style={{ color: 'var(--text-2)' }}>{u.email}</td>
                    <td className="table-cell"><Badge color={ROL_COLOR[u.rol] || 'gray'}>{u.rol}</Badge></td>
                    <td className="table-cell"><Badge color={u.activo ? 'green' : 'gray'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge></td>
                    <td className="table-cell">{fmtFecha(u.creado_en)}</td>
                    <td className="table-cell" style={{ color: 'var(--text-3)' }}>{fmtFecha(u.ultimo_acceso) || '—'}</td>
                    <td className="table-cell">
                      <div className="flex gap-1 md:gap-2">
                        <button onClick={() => { setEditando(u); setModal(true); }} aria-label="Editar"
                          className="btn-ghost p-2 md:p-3 cursor-pointer" title="Editar">
                          <Edit2 size={13} className="md:hidden" /><Edit2 size={17} className="hidden md:block" /></button>
                        <button onClick={() => { setEditando(u); setPwModal(true); }} aria-label="Cambiar contraseña"
                          className="btn-ghost p-2 md:p-3 cursor-pointer" title="Contraseña">
                          <Key size={13} className="md:hidden" /><Key size={17} className="hidden md:block" /></button>
                        <button onClick={() => handleToggle(u)} aria-label={u.activo ? 'Desactivar' : 'Activar'}
                          className={`btn-ghost p-2 md:p-3 cursor-pointer ${u.activo ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'}`}
                          title={u.activo ? 'Desactivar' : 'Activar'}>
                          {u.activo ? <><UserX size={13} className="md:hidden" /><UserX size={17} className="hidden md:block" /></> : <><UserCheck size={13} className="md:hidden" /><UserCheck size={17} className="hidden md:block" /></>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setEditando(null); }}
        title={editando ? 'Editar usuario' : 'Nuevo usuario'}>
        <UsuarioForm inicial={editando} onSave={handleSave} onCancel={() => { setModal(false); setEditando(null); }} />
      </Modal>

      <Modal open={pwModal} onClose={() => { setPwModal(false); setEditando(null); }} title="Cambiar contraseña">
        <CambiarPasswordForm usuario={editando} onSave={handlePassword}
          onCancel={() => { setPwModal(false); setEditando(null); }} />
      </Modal>
    </div>
  );
}
