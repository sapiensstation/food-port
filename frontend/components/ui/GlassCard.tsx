interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`glass rounded-2xl p-4 ${className}`}
    >
      {children}
    </div>
  );
}
