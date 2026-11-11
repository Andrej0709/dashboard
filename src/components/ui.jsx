import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { colorOf, initials } from '../lib/format';

// ---------- motion presets ----------
// Entrance: cards rise, sharpen and settle, one after another.
export const item = {
  hidden: { opacity: 0, y: 22, scale: 0.965, filter: 'blur(10px)' },
  show: {
    opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 240, damping: 26, mass: 0.9 },
  },
  exit: { opacity: 0, y: -10, scale: 0.985, filter: 'blur(8px)', transition: { duration: 0.16, ease: 'easeIn' } },
};

export const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.03 } },
  exit: { transition: { staggerChildren: 0.012 } },
};

const trackPointer = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

// ---------- surfaces ----------
export function Glass({ className = '', children, lift = false, ...rest }) {
  return (
    <motion.div
      variants={item}
      onPointerMove={trackPointer}
      whileHover={lift ? { y: -4, transition: { type: 'spring', stiffness: 320, damping: 22 } } : undefined}
      className={`glass ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="relative z-10 mb-5 flex min-h-[44px] items-center justify-between gap-4 max-md:mb-4 max-md:flex-col max-md:items-stretch max-md:gap-3">
      <motion.div variants={item} className="min-w-0">
        <h1 className="truncate text-[23px] font-semibold leading-7 tracking-[-0.01em] text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 truncate text-[12px] text-white/55 max-md:whitespace-normal">{subtitle}</p>}
      </motion.div>
      {/* no filter here: a leftover filter on this wrapper would switch off the blur of the glass controls inside */}
      {children && <motion.div variants={rise} className="flex shrink-0 items-center gap-3 max-md:flex-wrap max-md:gap-2">{children}</motion.div>}
    </div>
  );
}

export function CardTitle({ title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-[15px] font-semibold leading-5 text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 truncate text-[11px] text-white/50">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ---------- buttons ----------
export function IconButton({ icon: Icon, label, size = 36, className = '', badge, dot, plain = false, iconSize, ...rest }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      whileHover={{ scale: 1.07 }}
      whileTap={{ scale: 0.93 }}
      onPointerMove={plain ? undefined : trackPointer}
      style={{ width: size, height: size }}
      className={`no-drag grid shrink-0 place-items-center rounded-full text-white/85 hover:text-white ${
        plain ? 'bg-white/[0.07] hover:bg-white/[0.14] transition-colors' : 'glass'
      } ${className}`}
      {...rest}
    >
      <Icon size={iconSize ?? Math.round(size * 0.44)} strokeWidth={1.9} />
      {badge > 0 && (
        <span className="absolute -right-0.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-semibold leading-none text-white shadow-[0_0_0_2px_rgba(30,24,20,0.6)]">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      {dot && <span className="absolute right-[7px] top-[7px] size-[7px] rounded-full bg-red-500 shadow-[0_0_0_2px_rgba(30,24,20,0.6)]" />}
    </motion.button>
  );
}

export function Button({ icon: Icon, children, variant = 'glass', className = '', ...rest }) {
  const base = 'no-drag inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-medium text-white';
  const look =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'danger'
        ? 'border border-red-400/30 bg-red-500/20 text-red-100 hover:bg-red-500/30 transition-colors'
        : variant === 'soft'
          ? 'border border-white/10 bg-white/[0.08] hover:bg-white/[0.14] transition-colors'
          : 'glass';
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.035 }}
      whileTap={{ scale: 0.96 }}
      onPointerMove={variant === 'glass' ? trackPointer : undefined}
      className={`${base} ${look} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={15} strokeWidth={2} />}
      <span>{children}</span>
    </motion.button>
  );
}

/** Pill-shaped switch; the white thumb slides between options. */
export function Segmented({ options, value, onChange, className = '', size = 'md', glass = true }) {
  const id = useId();
  const h = size === 'sm' ? 'h-7 px-3 text-[11px]' : 'h-8 px-3.5 text-[12px]';
  return (
    <div className={`no-drag inline-flex shrink-0 rounded-full p-1 ${glass ? 'glass' : 'border border-white/10 bg-white/[0.06]'} ${className}`}>
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative flex-1 whitespace-nowrap rounded-full font-medium transition-colors ${h} ${
              active ? 'text-neutral-900' : 'text-white/60 hover:text-white'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full bg-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.5)]"
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Chip({ color = 'green', children, className = '' }) {
  const c = colorOf(color);
  return (
    <span
      className={`inline-flex h-[18px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 text-[10px] font-medium ${className}`}
      style={{ background: c.soft, color: c.hex }}
    >
      {children}
    </span>
  );
}

// ---------- data display ----------
export function Avatar({ name, color = 'blue', size = 36, status, icon: Icon }) {
  const c = colorOf(color);
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <span
        className="grid size-full place-items-center rounded-full font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
        style={{ background: `linear-gradient(145deg, ${c.hex}, ${c.solid})`, fontSize: Math.round(size * 0.34) }}
      >
        {Icon ? <Icon size={Math.round(size * 0.46)} strokeWidth={2} /> : initials(name)}
      </span>
      {status && (
        <span
          className="absolute -bottom-px -right-px rounded-full shadow-[0_0_0_2px_rgba(40,33,28,0.9)]"
          style={{ width: size * 0.28, height: size * 0.28, background: status === 'on' ? '#34d399' : 'rgba(255,255,255,0.35)' }}
        />
      )}
    </span>
  );
}

export function Ring({ value, size = 48, stroke = 5, color = 'amber', children }) {
  const c = colorOf(color);
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.hex} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={len}
          initial={{ strokeDashoffset: len }}
          animate={{ strokeDashoffset: len * (1 - v / 100) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          style={{ filter: `drop-shadow(0 0 5px ${c.soft})` }}
        />
      </svg>
      <span className="absolute text-center font-semibold text-white" style={{ fontSize: Math.max(10, size * 0.22) }}>
        {children ?? `${Math.round(v)}%`}
      </span>
    </span>
  );
}

export function Sparkline({ data, color = '#60a5fa', width = 96, height = 34 }) {
  const pts = data.length > 1 ? data : [0, 0];
  const min = Math.min(...pts);
  const span = Math.max(...pts) - min || 1;
  const step = width / (pts.length - 1);
  const xy = pts.map((v, i) => [i * step, height - 3 - ((v - min) / span) * (height - 6)]);
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden="true">
      <motion.path
        d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.35 }}
        style={{ filter: `drop-shadow(0 2px 5px ${color}88)` }}
      />
    </svg>
  );
}

/** Tall glass pills on a baseline; the `active` bar glows blue. */
export function BarChart({ data, format = (v) => v, height = 250 }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const dense = data.length > 14;
  const ticks = max >= 2 ? [max, max / 2, 0] : [max, 0];
  return (
    <div className="flex gap-3" style={{ height }}>
      <div className="flex w-9 shrink-0 flex-col justify-between pb-6 text-right text-[10px] text-white/35">
        {ticks.map((t, i) => (
          <span key={i}>{format(Math.round(t))}</span>
        ))}
      </div>
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-1.5 bottom-6 flex flex-col justify-between">
          {ticks.map((_, i) => (
            <span key={i} className="h-px w-full bg-white/[0.07]" />
          ))}
        </div>
        <div className={`absolute inset-0 flex items-end justify-between ${dense ? 'gap-1' : 'gap-2 px-[4%]'}`}>
          {data.map((d, i) => {
            const h = Math.max(d.value > 0 ? 9 : 3.5, (d.value / max) * 100);
            return (
              <div key={d.key ?? i} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                <div className="relative flex w-full flex-1 items-end justify-center pt-1.5">
                  <motion.div
                    initial={{ height: '0%' }}
                    animate={{ height: `${h}%` }}
                    transition={{ type: 'spring', stiffness: 110, damping: 19, delay: 0.18 + i * (dense ? 0.012 : 0.05) }}
                    className={`relative w-full rounded-full ${dense ? 'max-w-[14px]' : 'max-w-[40px]'}`}
                    style={
                      d.active
                        ? {
                            background: 'linear-gradient(180deg, #6fb0ff 0%, #3b82f6 100%)',
                            boxShadow: '0 0 28px rgba(59,130,246,0.65), inset 0 1px 0 rgba(255,255,255,0.5)',
                          }
                        : {
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.12) 100%)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 0 0 1px rgba(255,255,255,0.1)',
                          }
                    }
                  >
                    <span className="glass-dark pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {format(d.value)}
                    </span>
                  </motion.div>
                </div>
                <span className={`mt-2 h-4 truncate text-[10px] ${d.active ? 'font-medium text-white' : 'text-white/45'}`}>
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Empty({ icon: Icon, title, hint }) {
  return (
    <div className="grid place-items-center gap-1.5 px-4 py-8 text-center">
      {Icon && (
        <span className="mb-1 grid size-10 place-items-center rounded-full bg-white/[0.08] text-white/60">
          <Icon size={18} strokeWidth={1.8} />
        </span>
      )}
      <p className="text-[13px] font-medium text-white/85">{title}</p>
      {hint && <p className="max-w-[240px] text-[11px] leading-4 text-white/45">{hint}</p>}
    </div>
  );
}

// ---------- forms ----------
export function Label({ children, className = '', ...rest }) {
  return (
    <label className={`block ${className}`} {...rest}>
      {children}
    </label>
  );
}

export function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-medium text-white/55">{label}</span>
      {children}
    </label>
  );
}

export function Swatches({ value, onChange, options }) {
  return (
    <div className="flex gap-2">
      {options.map((k) => {
        const c = colorOf(k);
        return (
          <button
            key={k}
            type="button"
            aria-label={k}
            onClick={() => onChange(k)}
            className="size-7 rounded-full transition-transform hover:scale-110"
            style={{
              background: `linear-gradient(145deg, ${c.hex}, ${c.solid})`,
              boxShadow: value === k ? '0 0 0 2px rgba(30,24,20,0.9), 0 0 0 4px #fff' : 'inset 0 1px 0 rgba(255,255,255,0.4)',
            }}
          />
        );
      })}
    </div>
  );
}

// ---------- overlays ----------
export function Modal({ open, onClose, title, subtitle, children, width = 420 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Portalled to <body>: a fixed element inside a blurred or transformed card would be trapped in it.
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="no-drag fixed inset-0 z-50 grid place-items-center p-6">
          {/* scrim is a sibling of the panel so the panel's blur still sees the wallpaper */}
          <motion.div
            className="absolute inset-0 bg-black/45"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="glass w-full p-5"
            style={{ maxWidth: width, '--glass-tint': 0.62, '--glass-blur': '34px' }}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.14 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold text-white">{title}</h2>
                {subtitle && <p className="mt-0.5 text-[11px] text-white/50">{subtitle}</p>}
              </div>
              <IconButton icon={X} label="Close" size={30} plain onClick={onClose} />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
