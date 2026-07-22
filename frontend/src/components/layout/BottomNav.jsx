import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarRange, ClipboardList, Calendar,
  Package, Truck, BarChart3, DollarSign, Wrench,
  UserCog, Building2, Users, MoreHorizontal, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MAIN_NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Inicio',    end: true },
  { to: '/reservas',   icon: CalendarRange,   label: 'Reservas' },
  { to: '/calendario', icon: Calendar,        label: 'Agenda'   },
  { to: '/tareas',     icon: ClipboardList,   label: 'Tareas'   },
];

const MORE_NAV = [
  { to: '/servicios',   icon: Package,    label: 'Paquetes'    },
  { to: '/finanzas',    icon: DollarSign, label: 'Finanzas'    },
  { to: '/operaciones', icon: Wrench,     label: 'Operaciones' },
  { to: '/agencias',    icon: Users,      label: 'Agencias'    },
  { to: '/proveedores', icon: Truck,      label: 'Proveedores' },
  { to: '/reportes',    icon: BarChart3,  label: 'Reportes'    },
];

const ADMIN_NAV = [
  { to: '/usuarios',   icon: UserCog,   label: 'Usuarios'  },
  { to: '/mi-agencia', icon: Building2, label: 'Mi Agencia' },
];

export default function BottomNav() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [open, setOpen] = useState(false);

  const goTo = (to) => { setOpen(false); navigate(to); };

  const extraNav = [
    ...MORE_NAV,
    ...(user?.rol === 'ADMIN' ? ADMIN_NAV : []),
  ];

  return (
    <>
      {/* ── Sheet de módulos extra ── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="relative rounded-t-3xl px-5 pt-5 pb-8"
            style={{ background: 'var(--card)', boxShadow: '0 -8px 40px rgba(67,97,238,0.18)' }}
          >
            {/* Handle + titulo */}
            <div className="flex items-center justify-between mb-5">
              <p className="font-black text-base" style={{ color: 'var(--text)' }}>Todos los módulos</p>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--card-2)', color: 'var(--text-2)' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Grid de módulos */}
            <div className="grid grid-cols-3 gap-3">
              {extraNav.map(({ to, icon: Icon, label }) => (
                <button
                  key={to}
                  onClick={() => goTo(to)}
                  className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all active:scale-95"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--brand-bg)' }}
                  >
                    <Icon size={18} style={{ color: 'var(--brand)' }} />
                  </div>
                  <p className="text-xs font-semibold text-center leading-tight"
                    style={{ color: 'var(--text-2)' }}>
                    {label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Barra inferior ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          background: 'var(--card)',
          boxShadow: '0 -4px 24px rgba(67,97,238,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {MAIN_NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className="flex-1">
            {({ isActive }) => (
              <div
                className="flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-semibold transition-colors min-h-[56px]"
                style={{ color: isActive ? 'var(--brand)' : 'var(--text-3)' }}
              >
                <span
                  className="p-1.5 rounded-xl transition-all"
                  style={isActive ? { background: 'var(--brand-bg)' } : {}}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                </span>
                <span>{label}</span>
              </div>
            )}
          </NavLink>
        ))}

        {/* Botón Más */}
        <button className="flex-1" onClick={() => setOpen(v => !v)}>
          <div
            className="flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-semibold min-h-[56px] transition-colors"
            style={{ color: open ? 'var(--brand)' : 'var(--text-3)' }}
          >
            <span
              className="p-1.5 rounded-xl transition-all"
              style={open ? { background: 'var(--brand-bg)' } : {}}
            >
              <MoreHorizontal size={20} strokeWidth={open ? 2.5 : 1.75} />
            </span>
            <span>Más</span>
          </div>
        </button>
      </nav>
    </>
  );
}
