export function Logo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className={className} aria-hidden="true">
      <path
        d="M5 9.2 L10.2 3.6 L15.4 9.2"
        fill="none"
        stroke="#c45c4a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="9.1" y="8.4" width="2.1" height="12.2" rx="1.05" fill="currentColor" />
      <rect x="12.6" y="14" width="6.2" height="6.6" rx="1.1" fill="#c45c4a" />
    </svg>
  );
}