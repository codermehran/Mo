export function Alert({
  title,
  message,
  tone = "error",
}: {
  title: string;
  message: string;
  tone?: "error" | "success" | "info";
}) {
  const toneStyles: Record<typeof tone, string> = {
    error: "bg-red-50 text-red-700 border-red-200",
    success: "bg-green-50 text-green-700 border-green-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className={`rounded-xl border px-3 py-2 text-sm ${toneStyles[tone]}`}>
      <p className="font-semibold">{title}</p>
      <p className="text-xs opacity-80">{message}</p>
    </div>
  );
}
