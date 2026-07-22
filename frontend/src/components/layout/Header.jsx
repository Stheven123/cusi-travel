import { useState } from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ title }) {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const [imgError, setImgError] = useState(false);

  return (
    <header
      className="px-4 md:px-7 xl:px-9 py-3 md:py-3.5 flex items-center justify-between sticky top-0 z-20"
      style={{
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 8px rgba(28,26,46,0.05)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {!imgError && (
          <div className="md:hidden flex-shrink-0">
            <img src="/logo-cusi.png" alt="CT" className="h-9 w-auto object-contain"
              onError={() => setImgError(true)} />
          </div>
        )}
        <h1 className="text-lg md:text-xl xl:text-2xl font-black truncate"
          style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={toggle} aria-label={dark ? 'Modo claro' : 'Modo oscuro'}
          className="p-2.5 rounded-xl transition-all min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
          style={{ color: 'var(--text-2)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-2)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-2)'; }}
          title={dark ? 'Modo claro' : 'Modo oscuro'}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button aria-label="Notificaciones"
          className="p-2.5 rounded-xl transition-all min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer relative"
          style={{ color: 'var(--text-2)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-2)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-2)'; }}>
          <Bell size={18} />
        </button>

        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 cursor-pointer ml-1"
          style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-2))' }}>
          {user?.avatar_iniciales || user?.nombre?.[0] || '?'}
        </div>
      </div>
    </header>
  );
}
