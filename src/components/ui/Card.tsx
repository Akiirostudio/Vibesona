import { PropsWithChildren } from "react";

export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <div className={`px-5 pt-5 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <div className={`px-5 pb-5 ${className}`}>{children}</div>;
}


