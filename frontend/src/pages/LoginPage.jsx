import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await login(form.email, form.password); }
    catch (err) { setError(err.error || 'Credenciales inválidas'); }
    finally { setLoading(false); }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-12"
      style={{ background: 'var(--bg)' }}
    >
      {/* Card principal */}
      <div
        className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}
      >
        {/* ── Logo GRANDE ── */}
        <div className="mb-8 flex flex-col items-center w-full">
          {!imgError ? (
            <img
              src="/logo-cusi.png"
              alt="Cusi Travel"
              className="h-28 w-auto object-contain mb-5"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: 'var(--brand)', boxShadow: 'var(--shadow-brand)' }}
            >
              <span className="text-white font-black text-3xl">CT</span>
            </div>
          )}
          <h1 className="text-2xl font-black text-center" style={{ color: 'var(--text)' }}>
            Cusi Travel
          </h1>
          <p className="text-sm mt-1.5 font-medium text-center" style={{ color: 'var(--text-2)' }}>
            Sistema ERP · Gestión de Tours
          </p>
        </div>

        {error && (
          <div className="w-full mb-5">
            <div className="text-sm px-4 py-3 rounded-xl text-center font-medium"
              style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.15)' }}>
              {error}
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <div>
            <label className="label" htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              autoFocus
              required
              autoComplete="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="input-field"
              placeholder="usuario@cusitravel.pe"
            />
          </div>

          <div>
            <label className="label" htmlFor="pwd">Contraseña</label>
            <div className="relative">
              <input
                id="pwd"
                type={showPwd ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input-field pr-14"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd(p => !p)}
                aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer"
                style={{ color: 'var(--text-2)' }}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2 text-base"
            style={{ minHeight: '52px' }}
          >
            {loading && <Spinner size="sm" />}
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>

      <p className="text-xs mt-8 font-medium" style={{ color: 'var(--text-3)' }}>
        Cusi Travel ERP v1.0 · Solo acceso autorizado
      </p>
    </div>
  );
}
