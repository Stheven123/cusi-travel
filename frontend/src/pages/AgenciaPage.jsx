import { useState, useEffect, useRef } from 'react';
import {
  Building2, Phone, Mail, Globe, MapPin, Hash, User,
  Save, RotateCcw, Upload, X, Eye, CreditCard,
} from 'lucide-react';
import Alert from '../components/ui/Alert';

const STORAGE_KEY = 'cusitravel_agencia';

const DEFAULTS = {
  nombre:       'Cusi Travel',
  slogan:       'Proud to be Quechua',
  ruc:          '',
  direccion:    'Calle Union #140',
  ciudad:       'Cusco',
  pais:         'Peru',
  telefono:     '+51 985808035',
  telefono_contacto: 'Amy',
  telefono2:    '+51 984872580',
  telefono2_contacto: 'Jose',
  telefono3:    '',
  telefono3_nota: '',
  whatsapp:     '',
  email:        'info@cusitravel.com',
  web:          'www.cusitravel.com',
  responsable:  '',
  cargo:        'Sales Manager',
  // Datos bancarios (para Invoice)
  banco:               'Interbank',
  cuenta_titular:      'Empresa Cusi Travel International',
  cuenta_ruc:          '',
  cuenta_numero:       '',
  cuenta_cci:          '',
  cuenta_moneda:       'USD',
};

export const getAgenciaData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch { return DEFAULTS; }
};

function Field({ icon: Icon, label, name, value, onChange, type = 'text', placeholder = '', required = false }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <div className="relative">
        {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`input-field ${Icon ? 'pl-9' : ''}`}
        />
      </div>
    </div>
  );
}

export default function AgenciaPage() {
  const [form, setForm]       = useState(DEFAULTS);
  const [saved, setSaved]     = useState(false);
  const [logoPreview, setLogo]= useState(null);
  const [showPreview, setShow]= useState(false);
  const fileRef               = useRef();

  useEffect(() => {
    const data = getAgenciaData();
    setForm(data);
    if (data.logo_b64) setLogo(data.logo_b64);
  }, []);

  const set = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result;
      setLogo(b64);
      setForm(p => ({ ...p, logo_b64: b64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setForm(DEFAULTS);
    setLogo(null);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {saved && (
        <Alert type="success" message="Datos de agencia guardados correctamente." onClose={() => setSaved(false)} />
      )}

      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl md:rounded-3xl p-6 md:p-10 text-white flex items-center gap-5 md:gap-8">
        <div className="w-20 h-20 md:w-28 md:h-28 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/20 overflow-hidden">
          {logoPreview
            ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
            : <><Building2 size={36} className="md:hidden text-white/50" /><Building2 size={52} className="hidden md:block text-white/50" /></>
          }
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-3xl font-bold">{form.nombre || 'Mi Agencia'}</h1>
          {form.slogan && <p className="text-white/70 text-sm md:text-base italic mt-0.5 md:mt-1">{form.slogan}</p>}
          <div className="flex flex-wrap gap-3 mt-2 md:mt-3 text-white/60 text-xs md:text-sm">
            {form.ciudad && <span>{form.ciudad}, {form.pais}</span>}
            {form.email  && <span>{form.email}</span>}
            {form.telefono && <span>{form.telefono}</span>}
          </div>
        </div>
        <button onClick={() => setShow(true)}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm font-medium px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl transition-colors flex-shrink-0">
          <Eye size={14} className="md:hidden" /><Eye size={18} className="hidden md:block" /> Vista previa PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Col izquierda: logo + datos básicos */}
        <div className="lg:col-span-1 space-y-5">
          {/* Logo */}
          <div className="card p-5 md:p-7">
            <h2 className="font-semibold text-sm md:text-base mb-3 md:mb-5 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Upload size={15} style={{ color: 'var(--brand)' }} /> Logo de la agencia
            </h2>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors"
            >
              {logoPreview ? (
                <div className="relative">
                  <img src={logoPreview} alt="Logo" className="max-h-24 mx-auto object-contain" />
                  <button
                    onClick={e => { e.stopPropagation(); setLogo(null); setForm(p => ({ ...p, logo_b64: null })); }}
                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-0.5 hover:bg-red-200"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="py-3">
                  <Upload size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-500">Clic para subir logo</p>
                  <p className="text-xs text-gray-400">PNG, JPG · máx. 2MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            <p className="text-xs text-gray-400 mt-2 text-center">
              El logo aparece en los PDF de cotización
            </p>
          </div>

          {/* Responsable */}
          <div className="card p-5 md:p-7 space-y-3 md:space-y-4">
            <h2 className="font-semibold text-sm md:text-base flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <User size={15} style={{ color: 'var(--brand)' }} /> Responsable
            </h2>
            <Field icon={User} label="Nombre completo" name="responsable" value={form.responsable}
              onChange={set} placeholder="Lic. María López" />
            <Field icon={null} label="Cargo" name="cargo" value={form.cargo}
              onChange={set} placeholder="Gerente General" />
          </div>
        </div>

        {/* Col derecha: datos de empresa */}
        <div className="lg:col-span-2 space-y-5">

          {/* Datos generales */}
          <div className="card p-5 md:p-7 space-y-3 md:space-y-5">
            <h2 className="font-semibold text-sm md:text-base flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Building2 size={15} style={{ color: 'var(--brand)' }} /> Datos de la empresa
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field icon={Building2} label="Nombre de la agencia" name="nombre" value={form.nombre}
                  onChange={set} placeholder="Cusi Travel" required />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Field icon={null} label="Slogan" name="slogan" value={form.slogan}
                  onChange={set} placeholder="Proud to be Quechua" />
              </div>
              <div>
                <Field icon={Hash} label="RUC / Registro" name="ruc" value={form.ruc}
                  onChange={set} placeholder="20XXXXXXXXX" />
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="card p-5 md:p-7 space-y-3 md:space-y-5">
            <h2 className="font-semibold text-sm md:text-base flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Phone size={15} style={{ color: 'var(--brand)' }} /> Contacto
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Field icon={MapPin} label="Dirección" name="direccion" value={form.direccion}
                onChange={set} placeholder="Av. El Sol 123" />
              <Field icon={MapPin} label="Ciudad" name="ciudad" value={form.ciudad}
                onChange={set} placeholder="Cusco" />
              <Field icon={null} label="País" name="pais" value={form.pais}
                onChange={set} placeholder="Perú" />
              <Field icon={Phone} label="Teléfono" name="telefono" value={form.telefono}
                onChange={set} placeholder="+51 84 000 000" />
              <Field icon={Phone} label="WhatsApp" name="whatsapp" value={form.whatsapp}
                onChange={set} placeholder="+51 984 000 000" />
              <Field icon={Mail} label="Email" name="email" value={form.email}
                onChange={set} type="email" placeholder="info@cusitravel.pe" />
              <div className="col-span-2">
                <Field icon={Globe} label="Sitio web" name="web" value={form.web}
                  onChange={set} placeholder="www.cusitravel.pe" />
              </div>
            </div>
          </div>

          {/* Teléfonos adicionales */}
          <div className="card p-5 md:p-7 space-y-3 md:space-y-4">
            <h2 className="font-semibold text-sm md:text-base flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Phone size={15} style={{ color: 'var(--brand)' }} /> Teléfonos de contacto (Invoice)
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>Aparecen en el Invoice Excel en la sección "From".</p>
            <div className="grid grid-cols-2 gap-3">
              <Field icon={Phone} label="Teléfono 1" name="telefono" value={form.telefono} onChange={set} placeholder="+51 985808035" />
              <Field icon={User} label="Contacto 1" name="telefono_contacto" value={form.telefono_contacto} onChange={set} placeholder="Amy" />
              <Field icon={Phone} label="Teléfono 2" name="telefono2" value={form.telefono2} onChange={set} placeholder="+51 984872580" />
              <Field icon={User} label="Contacto 2" name="telefono2_contacto" value={form.telefono2_contacto} onChange={set} placeholder="Jose" />
              <Field icon={Phone} label="Teléfono 3" name="telefono3" value={form.telefono3} onChange={set} placeholder="1-507-298-0709" />
              <Field icon={null} label="Nota (ej: USA)" name="telefono3_nota" value={form.telefono3_nota} onChange={set} placeholder="(USA)" />
            </div>
          </div>

          {/* Datos bancarios */}
          <div className="card p-5 md:p-7 space-y-3 md:space-y-4">
            <h2 className="font-semibold text-sm md:text-base flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <CreditCard size={15} style={{ color: 'var(--brand)' }} /> Datos bancarios (Invoice)
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>Aparecen en la sección de pago del Invoice Excel.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field icon={null} label="Banco" name="banco" value={form.banco} onChange={set} placeholder="Interbank" />
              <Field icon={null} label="Moneda" name="cuenta_moneda" value={form.cuenta_moneda} onChange={set} placeholder="USD" />
              <div className="col-span-2">
                <Field icon={null} label="Titular de la cuenta" name="cuenta_titular" value={form.cuenta_titular} onChange={set} placeholder="Empresa Cusi Travel International" />
              </div>
              <Field icon={Hash} label="RUC empresa" name="cuenta_ruc" value={form.cuenta_ruc} onChange={set} placeholder="20491021439" />
              <Field icon={null} label="N° de cuenta" name="cuenta_numero" value={form.cuenta_numero} onChange={set} placeholder="420-3002650779" />
              <div className="col-span-2">
                <Field icon={null} label="N° CCI / SWIFT / IBAN" name="cuenta_cci" value={form.cuenta_cci} onChange={set} placeholder="003-420-003002650779-75" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end pb-6">
        <button onClick={handleReset} className="btn-secondary flex items-center gap-2">
          <RotateCcw size={15} /> Restablecer
        </button>
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <Save size={15} /> Guardar cambios
        </button>
      </div>

      {/* Modal preview */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-semibold text-gray-800">Vista previa cabecera PDF</span>
              <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            {/* Simulación del header del PDF */}
            <div className="p-5">
              <div className="bg-emerald-600 rounded-xl p-4 flex items-start gap-4">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-14 w-28 object-contain bg-white rounded-lg p-1.5" />
                ) : (
                  <div className="h-14 w-28 bg-white/20 rounded-lg flex items-center justify-center">
                    <Building2 size={28} className="text-white/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base">{form.nombre || 'Cusi Travel'}</p>
                  {form.slogan && <p className="text-white/70 text-xs italic">{form.slogan}</p>}
                  <p className="text-white/60 text-xs mt-1">{form.email}</p>
                  <p className="text-white/60 text-xs">{form.telefono} {form.whatsapp && `· ${form.whatsapp}`}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm">COTIZACIÓN</p>
                  <p className="text-white/70 text-xs">COT-20260612-001</p>
                  <p className="text-white/60 text-xs mt-1">Válida 30 días</p>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-400">
                  {form.direccion && `${form.direccion}, `}{form.ciudad}, {form.pais}
                  {form.ruc && ` · RUC: ${form.ruc}`}
                </p>
                {form.web && <p className="text-xs text-brand-600">{form.web}</p>}
              </div>
            </div>
            <div className="px-5 pb-4 flex justify-end">
              <button onClick={() => setShow(false)} className="btn-secondary text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
