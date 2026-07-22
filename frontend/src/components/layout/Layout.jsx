import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

const TITLES = {
  '/':            'Dashboard',
  '/reservas':    'Reservas',
  '/servicios':   'Paquetes',
  '/proveedores': 'Proveedores',
  '/tareas':      'Tareas',
  '/reportes':    'Reportes',
  '/usuarios':    'Usuarios',
  '/mi-agencia':  'Mi Agencia',
  '/calendario':  'Calendario',
  '/finanzas':    'Finanzas',
  '/operaciones': 'Operaciones',
};

export default function Layout() {
  const { pathname } = useLocation();
  const base = '/' + (pathname.split('/')[1] || '');
  const title = TITLES[base] || 'Cusi Travel';

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <div className="flex-1 md:ml-64 xl:ml-72 flex flex-col min-h-screen min-w-0">
        <Header title={title} />
        <main className="flex-1 p-4 md:p-7 xl:p-9 overflow-x-hidden pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
