// app/icon.svg draws the same mark
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" data-icon="inline-start" className={className}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <g className="fill-primary-foreground">
        <rect x="8" y="9" width="16" height="3.5" rx="1.75" />
        <rect x="8" y="14.25" width="11" height="3.5" rx="1.75" />
        <rect x="8" y="19.5" width="6.5" height="3.5" rx="1.75" />
      </g>
    </svg>
  );
}
