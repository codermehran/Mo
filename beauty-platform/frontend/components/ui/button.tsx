import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

export function Button({
  children,
  className = "",
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
