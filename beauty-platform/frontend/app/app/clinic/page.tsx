"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plans = [
  {
    name: "پلن حرفه‌ای",
    expiry: "۱۴۰۳/۱۰/۱۵",
    features: ["۵ کاربر هم‌زمان", "۳ شعبه فعال", "پشتیبانی ۲۴/۷"],
    status: "active",
  },
  {
    name: "پلن پایه",
    expiry: "منقضی شده",
    features: ["۲ کاربر", "۱ شعبه", "پشتیبانی ایمیلی"],
    status: "expired",
  },
];

export default function ClinicSettingsPage() {
  const activePlan = useMemo(
    () => plans.find((plan) => plan.status === "active") ?? plans[0],
    [],
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">clinic</p>
          <h1 className="text-3xl font-bold text-slate-900">تنظیمات کلینیک</h1>
          <p className="mt-1 text-sm text-slate-600">
            مدیریت پلن فعلی، تاریخ انقضا و گزینه‌های ارتقا برای کلینیک.
          </p>
        </div>
        <Button variant="default">ارتقا</Button>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">پلن فعال</h2>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              فعال
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activePlan.name}</p>
          <p className="text-sm text-slate-700">
            تاریخ انقضا: <span className="font-semibold">{activePlan.expiry}</span>
          </p>
          <ul className="space-y-2 text-sm text-slate-700">
            {activePlan.features.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            پس از انقضا، دسترسی کاربران محدود می‌شود. ارتقا یا تمدید پلن باعث حفظ
            داده‌های بیماران و نوبت‌ها خواهد شد.
          </div>
          <div className="flex gap-3">
            <Button>تمدید پلن</Button>
            <Button variant="outline">نمایش پلن‌ها</Button>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-semibold text-slate-900">پلن‌های دیگر</h2>
          <div className="space-y-3">
            {plans
              .filter((plan) => plan.status !== "active")
              .map((plan) => (
                <div
                  key={plan.name}
                  className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{plan.name}</p>
                    {plan.status === "expired" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                        منقضی شده
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">تاریخ انقضا: {plan.expiry}</p>
                  <ul className="mt-2 list-disc space-y-1 pr-5">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <Button className="mt-3" variant="outline" size="sm">
                    ارتقا به این پلن
                  </Button>
                </div>
              ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
