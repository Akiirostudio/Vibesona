export function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -inset-[20%] bg-[radial-gradient(60%_60%_at_50%_50%,rgba(124,58,237,0.25),rgba(37,99,235,0.2)_40%,rgba(6,182,212,0.1)_70%,transparent)] blur-3xl animate-[pulse_12s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-[conic-gradient(from_220deg_at_50%_50%,rgba(255,255,255,0.05),transparent_30%)]" />
    </div>
  );
}


