import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarRange, Package, Truck,
  ClipboardList, BarChart3, UserCog, LogOut, Building2,
  Calendar, DollarSign, Wrench, MapPin, Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard',           end: true },
  { to: '/reservas',    icon: CalendarRange,   label: 'Reservas' },
  { to: '/calendario',  icon: Calendar,        label: 'Calendario' },
  { to: '/finanzas',    icon: DollarSign,      label: 'Finanzas' },
  { to: '/operaciones', icon: Wrench,          label: 'Operaciones' },
  { to: '/servicios',   icon: Package,         label: 'Paquetes' },
  { to: '/proveedores', icon: Truck,           label: 'Proveedores' },
  { to: '/agencias',    icon: Users,           label: 'Agencias' },
  { to: '/tareas',      icon: ClipboardList,   label: 'Tareas' },
  { to: '/reportes',    icon: BarChart3,       label: 'Reportes' },
];

const ADMIN_NAV = [
  { to: '/usuarios',   icon: UserCog,   label: 'Usuarios' },
  { to: '/mi-agencia', icon: Building2, label: 'Mi Agencia' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [imgError, setImgError] = useState(false);

  return (
    <aside
      className="hidden md:flex w-64 xl:w-72 min-h-screen flex-col fixed left-0 top-0 bottom-0 z-40"
      style={{
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
        boxShadow: '4px 0 24px rgba(28,26,46,0.05)',
      }}
    >
      {/* ── Logo ── */}
      <div className="px-4 pt-8 pb-7 flex flex-col items-center justify-center"
        style={{ borderBottom: '1px solid var(--border)' }}>
        {!imgError ? (
          <img
            src="/logo-cusi.png"
            alt="Cusi Travel"
            className="h-24 xl:h-28 w-auto object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl"
              style={{ background: 'var(--brand)', boxShadow: 'var(--shadow-brand)' }}>
              CT
            </div>
            <div className="text-center">
              <p className="font-black text-base leading-tight" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Cusi Travel
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <MapPin size={10} style={{ color: 'var(--accent)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Cusco, Perú</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Navegación ── */}
      <nav className="flex-1 px-3 xl:px-4 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Icon size={17} className="flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        {user?.rol === 'ADMIN' && (
          <>
            <div className="pt-5 pb-2 px-3">
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-3)', letterSpacing: '0.10em' }}>
                Administración
              </p>
            </div>
            {ADMIN_NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <Icon size={17} className="flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* ── Usuario ── */}
      <div className="px-3 xl:px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
          <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-2))' }}>
            {user?.avatar_iniciales || user?.nombre?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate leading-tight" style={{ color: 'var(--text)', letterSpacing: '-0.01em' }}>
              {user?.nombre} {user?.apellido}
            </p>
            <p className="text-xs font-medium truncate mt-0.5" style={{ color: 'var(--text-2)' }}>{user?.rol}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="p-2 rounded-lg transition-all min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-bg)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = ''; }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
