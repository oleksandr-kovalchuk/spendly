// The surface needs `isolate`, or the -z-10 layer goes under its background
export function MoodLayer({ mood }: { mood: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 -z-10 bg-aurora-warm transition-opacity duration-1000 ease-out"
      style={{ opacity: mood }}
    />
  );
}
