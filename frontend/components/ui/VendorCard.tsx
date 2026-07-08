interface VendorCardProps {
  name: string;
  cuisine: string;
  isOpen: boolean;
  boothColor: string;
  onClick?: () => void;
  className?: string;
  footer?: React.ReactNode;
}

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const SHOW_OPEN_BADGE = false;

export default function VendorCard({
  name,
  cuisine,
  isOpen,
  boothColor,
  onClick,
  className = '',
  footer,
}: VendorCardProps) {
  const cardStyle = {
    '--vc-border': hexToRgba(boothColor, 0.4),
    '--vc-shadow': hexToRgba(boothColor, 0.22),
  } as React.CSSProperties;

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
          style={{ backgroundColor: hexToRgba(boothColor, 0.14) }}
        >
          🍴
        </div>
        {SHOW_OPEN_BADGE && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isOpen ? 'bg-brand-primary-light text-emerald-700' : 'bg-brand-danger-light text-red-600'
            }`}
          >
            {isOpen ? 'OPEN' : 'CLOSED'}
          </span>
        )}
      </div>

      <div className="mt-5 min-h-[76px]">
        <p
          className="font-body text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: boothColor }}
        >
          {cuisine}
        </p>
        <h3 className="font-heading text-2xl font-semibold text-brand-white leading-[1.15] mt-1 line-clamp-2">
          {name}
        </h3>
      </div>

      <div className="flex items-center justify-between mt-5">
        <span className="h-1 w-8 rounded-full" style={{ backgroundColor: boothColor }} />
        {onClick && (
          <span
            className="flex items-center gap-1 text-sm font-semibold opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
            style={{ color: boothColor }}
          >
            View
            <ArrowIcon />
          </span>
        )}
      </div>

      {footer}
    </>
  );

  const classes = `card-interactive group bg-brand-card rounded-xl p-6 text-left flex flex-col h-full ${className}`;

  if (onClick) {
    return (
      <button onClick={onClick} style={cardStyle} className={classes}>
        {content}
      </button>
    );
  }

  return (
    <article style={cardStyle} className={classes}>
      {content}
    </article>
  );
}
