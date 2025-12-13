import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "default" | "outline";
type ButtonSize = "sm" | "md";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement>
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  children,
  className = "",
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "outline"
      ? "bg-transparent border border-slate-200 text-slate-900 hover:bg-slate-50"
      : "bg-primary text-primary-foreground";

  const sizeClass =
    size === "sm"
      ? "px-3 py-1.5 text-xs rounded-lg"
      : "px-4 py-2 text-sm rounded-xl";

  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
