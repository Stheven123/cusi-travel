import { X } from 'lucide-react';
import { useEffect } from 'react';

const WIDTHS = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };

export default function Modal({ open, onClose, title, children, size = 'lg' }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      style={{ animation: 'fadeIn 150ms ease-out' }}
    >
      {/* Scrim — UX Pro Max: modal scrim 40-60% black */}
      <div
        className="fixed inset-0 backdrop-blur-[2px]"
        style={{ background: 'rgba(14,12,26,0.55)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`relative w-full ${WIDTHS[size]} max-h-[93vh] md:max-h-[90vh] flex flex-col rounded-t-3xl md:rounded-2xl overflow-hidden`}
        style={{
          background: 'var(--bg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
          animation: 'slideUp 200ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Handle — mobile only */}
        <div className="md:hidden w-9 h-1 rounded-full mx-auto mt-3 mb-1 flex-shrink-0"
          style={{ background: 'var(--border-2)' }} />

        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between px-5 md:px-6 py-4 flex-shrink-0"
            style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
          >
            <h2 id="modal-title" className="font-black"
              style={{ color: 'var(--text)', fontSize: '1rem', letterSpacing: '-0.02em' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="flex items-center justify-center rounded-xl transition-all cursor-pointer"
              style={{
                width: 36, height: 36,
                color: 'var(--text-2)',
                background: 'var(--card-2)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-2)'; e.currentTarget.style.color = 'var(--text-2)'; }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 md:p-5">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
}
