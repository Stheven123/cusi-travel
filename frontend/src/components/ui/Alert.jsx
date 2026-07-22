import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const TYPES = {
  error:   { bg: 'var(--danger-bg)',  border: 'var(--danger)',  color: 'var(--danger)',  icon: AlertCircle },
  success: { bg: 'var(--success-bg)', border: 'var(--success)', color: 'var(--success)', icon: CheckCircle },
  info:    { bg: 'var(--brand-bg)',   border: 'var(--brand)',   color: 'var(--brand)',   icon: Info },
  warning: { bg: 'var(--warning-bg)', border: 'var(--warning)', color: 'var(--warning)', icon: AlertCircle },
};

export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;
  const { bg, border, color, icon: Icon } = TYPES[type] || TYPES.info;
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl text-sm"
      style={{ background: bg, border: `1px solid ${border}22`, color }}>
      <Icon size={16} className="mt-0.5 flex-shrink-0" />
      <p className="flex-1 font-medium">{message}</p>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer" aria-label="Cerrar">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
