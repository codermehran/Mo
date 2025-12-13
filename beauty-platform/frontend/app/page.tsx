export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-xl space-y-4 text-center">
        <p className="text-xs uppercase tracking-wider text-slate-500">BeautyClinic</p>
        <h1 className="text-3xl font-bold text-slate-900">ورود به داشبورد چندکلینیکی</h1>
        <p className="text-slate-600">
          برای مدیریت کلینیک‌ها وارد شوید یا حساب خود را با کد یک‌بارمصرف بازیابی کنید.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-primary">
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-xl space-y-4 text-center">
        <p className="text-xs uppercase tracking-wider text-slate-500">BeautyClinic</p>
        <h1 className="text-3xl font-bold text-slate-900">ورود به داشبورد چندکلینیکی</h1>
        <p className="text-slate-600">
          برای مدیریت کلینیک‌ها وارد شوید یا حساب خود را با کد یک‌بارمصرف بازیابی کنید.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-primary">
          <Link className="rounded-full bg-white px-4 py-2 shadow" href="/login">
            ورود با OTP
          </Link>
          <Link className="rounded-full bg-white px-4 py-2 shadow" href="/recovery">
            بازیابی دسترسی
          </Link>
        </div>
      </div>
    </main>
  );
}
        </div>
      </div>
    </main>
  );
}
