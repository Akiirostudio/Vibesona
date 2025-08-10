"use client";
import { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "glass" | "outline";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#06B6D4] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:opacity-95 focus-visible:ring-[#7C3AED]",
    glass:
      "backdrop-blur bg-white/10 dark:bg-white/5 text-white border border-white/15 hover:bg-white/15",
    outline:
      "border border-white/20 text-white/90 hover:bg-white/10",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}


