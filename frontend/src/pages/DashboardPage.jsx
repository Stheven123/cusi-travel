import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, TrendingUp, Plus, CalendarRange, BarChart3 } from 'lucide-react';
import { reportesApi } from '../api/reportes.api';
import { pasajerosApi } from '../api/pasajeros.api';
import { useAuth } from '../context/AuthContext';
import KPICards from '../components/dashboard/KPICards';
import AlertasPasaportes from '../components/dashboard/AlertasPasaportes';

function saludo() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/* ── Quick action button ───────────────────────────────────────── */
function QuickBtn({ icon: Icon, label, onClick, color }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-2 md:gap-3 py-4 md:py-7 px-3 md:px-5 rounded-2xl flex-1 cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.97]"
      style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
      <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center"
        style={{ background: `${color}22` }}>
        <Icon size={18} className="md:hidden" style={{ color }} />
        <Icon size={28} className="hidden md:block" style={{ color }} />
      </div>
      <p className="text-xs md:text-sm font-bold text-center leading-tight" style={{ color: 'var(--text-2)' }}>{label}</p>
    </button>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kpis,   setKpis]   = useState(null);
  const [alertas, setAlertas] = useState([]);

  const load = useCallback(async () => {
    const [k, a] = await Promise.allSettled([
      reportesApi.getKPIs(),
      pasajerosApi.alertasVencimiento(),
    ]);
    if (k.status === 'fulfilled') setKpis(k.value.data);
    if (a.status === 'fulfilled') setAlertas(a.value.data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5 md:space-y-7">
      {/* ── Banner de bienvenida ── */}
      <div
        className="relative overflow-hidden rounded-3xl px-6 md:px-12 py-5 md:py-10 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #4361ee 0%, #2937b0 100%)',
          boxShadow: '0 8px 32px rgba(67,97,238,0.35)',
        }}
      >
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'rgba(255,255,255,0.10)' }} />
        <div className="absolute -bottom-8 right-16 w-24 h-24 rounded-full opacity-10"
          style={{ background: 'rgba(255,255,255,0.10)' }} />
        <div className="absolute top-2 right-32 w-12 h-12 rounded-full opacity-[0.07]"
          style={{ background: 'rgba(255,255,255,0.10)' }} />

        <div className="relative">
          <p className="text-white/70 text-sm md:text-lg font-medium">{saludo()},</p>
          <h1 className="text-white font-black text-xl md:text-4xl xl:text-5xl leading-tight mt-0.5">
            {user?.nombre || 'Bienvenido'}
          </h1>
          <div className="flex items-center gap-1.5 mt-2 md:mt-3">
            <MapPin size={12} className="text-white/50 md:hidden" />
            <MapPin size={16} className="text-white/50 hidden md:block" />
            <span className="text-white/50 text-xs md:text-sm font-medium">Cusi Travel · Cusco, Perú</span>
          </div>
        </div>

        {kpis && (
          <div className="relative hidden sm:flex flex-col items-end">
            <div
              className="rounded-2xl px-4 md:px-6 py-2.5 md:py-4 flex items-center gap-2 md:gap-3"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
            >
              <TrendingUp size={16} className="text-white/80 md:hidden" />
              <TrendingUp size={24} className="text-white/80 hidden md:block" />
              <div className="text-right">
                <p className="text-white/60 text-xs md:text-sm leading-none">Este mes</p>
                <p className="text-white font-black text-sm md:text-2xl mt-0.5">
                  {kpis.reservas_mes ?? 0} reservas
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick actions strip ── */}
      <div className="flex gap-3 md:gap-5">
        <QuickBtn
          icon={Plus}
          label="Nueva reserva"
          color="#4361ee"
          onClick={() => navigate('/reservas')}
        />
        <QuickBtn
          icon={CalendarRange}
          label="Ver calendario"
          color="#10b981"
          onClick={() => navigate('/calendario')}
        />
        <QuickBtn
          icon={BarChart3}
          label="Reportes"
          color="#f59e0b"
          onClick={() => navigate('/reportes')}
        />
      </div>

      <KPICards data={kpis} />

      {alertas.length > 0 && <AlertasPasaportes alertas={alertas} />}
    </div>
  );
}
