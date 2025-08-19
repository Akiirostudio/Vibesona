import { ComponentProps, forwardRef } from "react";

type InputProps = ComponentProps<"input">;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-md border border-white/15 bg-white/10 text-white placeholder:text-white/40 px-3 py-2 outline-none focus:ring-2 focus:ring-[#7C3AED]/40 ${className}`}
      {...props}
    />
  );
});


