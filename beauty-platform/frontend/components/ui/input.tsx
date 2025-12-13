import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-inner focus:border-primary focus:outline-none ${className}`}
      {...props}
    />
  );
});
