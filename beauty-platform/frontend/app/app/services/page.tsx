"use client";

import { Card } from "@/components/ui/card";

const services = [
  { name: "لیزر پوست", duration: "۴۵ دقیقه", price: "۲،۵۰۰،۰۰۰ تومان" },
  { name: "میکرونیدلینگ", duration: "۶۰ دقیقه", price: "۳،۰۰۰،۰۰۰ تومان" },
  { name: "تزریق بوتاکس", duration: "۳۰ دقیقه", price: "۴،۲۰۰،۰۰۰ تومان" },
];

export default function ServicesPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="text-xs uppercase tracking-widest text-slate-500">services</p>
        <h1 className="text-3xl font-bold text-slate-900">خدمات کلینیک</h1>
        <p className="text-sm text-slate-600">
          فهرست خدمات و قیمت‌ها برای استفاده در نوبت‌گیری و معرفی به بیماران.
        </p>
      </header>

      <Card className="divide-y divide-slate-200 p-4">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-lg font-semibold text-slate-900">{service.name}</p>
              <p className="text-xs text-slate-500">مدت زمان: {service.duration}</p>
            </div>
            <p className="text-sm font-medium text-slate-800">{service.price}</p>
          </div>
        ))}
      </Card>
    </main>
  );
}
