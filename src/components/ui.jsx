import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export function cx(...values) {
  return values.filter(Boolean).join(' ');
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  const variants = {
    primary:
      'bg-white text-[#0a0a0f] shadow-[0_10px_30px_-12px_rgba(255,255,255,.5)] hover:bg-white/90',
    gradient:
      'text-white shadow-[0_16px_40px_-16px_rgba(244,114,182,.8)] bg-[linear-gradient(110deg,#ff7a59_0%,#ff4d9d_48%,#7c6cff_100%)] hover:brightness-110',
    secondary:
      'border border-white/12 bg-white/[0.06] text-white hover:border-white/20 hover:bg-white/[0.1]',
    ghost: 'text-white/78 hover:bg-white/[0.07] hover:text-white',
    danger:
      'border border-red-400/20 bg-red-400/10 text-red-200 hover:border-red-400/35 hover:bg-red-400/15',
  };
  const sizes = {
    sm: 'h-10 px-3 text-xs gap-1.5 rounded-xl',
    md: 'h-10 px-4 text-sm gap-2 rounded-xl',
    lg: 'h-10 px-5 text-sm gap-2.5 rounded-xl',
    icon: 'h-10 w-10 rounded-xl',
  };

  return (
    <button
      type={type}
      className={cx(
        'inline-flex select-none items-center justify-center font-semibold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090d]',
        'disabled:pointer-events-none disabled:opacity-35',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) {
  const variants = {
    ghost: 'text-white/78 hover:bg-white/[0.09] hover:text-white',
    glass: 'border border-white/12 bg-black/15 text-current backdrop-blur-md hover:bg-black/25',
    solid: 'border border-white/12 bg-white/[0.07] text-white hover:bg-white/[0.12]',
    danger: 'text-red-300/80 hover:bg-red-400/15 hover:text-red-200',
  };
  const sizes = {
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-10 w-10 rounded-xl',
    lg: 'h-10 w-10 rounded-xl',
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex shrink-0 items-center justify-center transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        'disabled:pointer-events-none disabled:opacity-30',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Kbd({ children }) {
  return (
    <kbd className="rounded-md border border-white/12 bg-white/[0.06] px-1.5 py-0.5 font-sans text-[11px] font-semibold text-white/60">
      {children}
    </kbd>
  );
}

export function FilterChip({ active, children, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'inline-flex h-10 items-center rounded-xl border px-3 text-xs font-semibold transition-all duration-200',
        active
          ? 'border-white/80 bg-white text-[#0a0a0f]'
          : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white',
        className,
      )}
    >
      {children}
    </button>
  );
}

function useOverlayBehavior(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  useOverlayBehavior(open, onClose);
  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/72 backdrop-blur-md"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden border border-white/10 bg-[#0d0d13]/95 shadow-[0_30px_100px_-20px_rgba(0,0,0,.9)] backdrop-blur-2xl',
          'rounded-t-[2rem] sm:rounded-[2rem]',
          'animate-modal-in',
          sizes[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-white">{title}</h2>
            {description ? (
              <p className="mt-1 max-w-lg text-sm leading-6 text-white/60">{description}</p>
            ) : null}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? (
          <div className="border-t border-white/[0.07] bg-white/[0.02] px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </section>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, description, children, footer, width = 'max-w-md' }) {
  useOverlayBehavior(open, onClose);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-black/68 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'relative flex h-full w-full flex-col border-l border-white/10 bg-[#0c0c11]/97 shadow-[-30px_0_80px_-30px_rgba(0,0,0,.9)] backdrop-blur-2xl',
          'animate-drawer-in',
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-5">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-white">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-5 text-white/60">{description}</p> : null}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <div className="border-t border-white/[0.07] px-5 py-4">{footer}</div> : null}
      </aside>
    </div>,
    document.body,
  );
}

export function ToastViewport({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  const icons = {
    success: <CheckCircle2 size={16} className="text-emerald-300" />,
    error: <AlertCircle size={16} className="text-red-300" />,
    info: <Info size={16} className="text-sky-300" />,
  };

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[130] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-auto max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-2xl border border-white/12 bg-[#17171f]/95 px-3.5 py-2.5 text-sm font-medium text-white shadow-2xl backdrop-blur-xl animate-toast-in"
        >
          {icons[toast.tone] || icons.info}
          <span className="min-w-0 flex-1">{toast.message}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
            className="ml-1 text-white/45 transition-colors hover:text-white"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-white/50">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-semibold tracking-[-0.045em] text-white sm:text-3xl">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white/55">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 max-w-xs text-xs leading-5 text-white/55">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
