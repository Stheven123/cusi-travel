import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReservasPage from './pages/ReservasPage';
import ReservaDetallePage from './pages/ReservaDetallePage';
import ServiciosPage from './pages/ServiciosPage';
import ProveedoresPage from './pages/ProveedoresPage';
import ReportesPage from './pages/ReportesPage';
import TareasPage from './pages/TareasPage';
import UsuariosPage from './pages/UsuariosPage';
import AgenciaPage from './pages/AgenciaPage';
import AgenciasPage from './pages/AgenciasPage';
import CalendarioPage from './pages/CalendarioPage';
import FinanzasPage from './pages/FinanzasPage';
import OperacionesPage from './pages/OperacionesPage';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

// El backend ya rechaza /usuarios con 403 para roles fuera de MANAGEMENT
// (ADMIN/OPERACIONES/FINANZAS) — sin este guard, un usuario GUIA/VENTAS/
// SOLO_LECTURA que entraba a la URL directamente veía la pantalla rota
// ("Error al cargar usuarios") en vez de ser redirigido.
const MANAGEMENT_ROLES = ['ADMIN', 'OPERACIONES', 'FINANZAS'];
const RoleRoute = ({ roles, children }) => {
  const { user } = useAuth();
  return roles.includes(user?.rol) ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

    <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
      <Route index element={<DashboardPage />} />
      <Route path="reservas" element={<ReservasPage />} />
      <Route path="reservas/:id" element={<ReservaDetallePage />} />
      <Route path="servicios" element={<ServiciosPage />} />
      <Route path="proveedores" element={<ProveedoresPage />} />
      <Route path="tareas" element={<TareasPage />} />
      <Route path="reportes" element={<ReportesPage />} />
      <Route path="usuarios" element={<RoleRoute roles={MANAGEMENT_ROLES}><UsuariosPage /></RoleRoute>} />
      <Route path="mi-agencia" element={<AgenciaPage />} />
      <Route path="agencias" element={<AgenciasPage />} />
      <Route path="calendario" element={<CalendarioPage />} />
      <Route path="finanzas" element={<FinanzasPage />} />
      <Route path="operaciones" element={<OperacionesPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
