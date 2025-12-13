"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const formatPersianDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const billingStatus = {
  plan: "پلن حرفه‌ای",
  renewalDate: formatPersianDate(30),
  paymentStatus: "موفق",
  amount: "۱۲،۰۰۰،۰۰۰ تومان",
};

export default function BillingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="text-xs uppercase tracking-widest text-slate-500">billing</p>
        <h1 className="text-3xl font-bold text-slate-900">صورت‌حساب و پرداخت</h1>
        <p className="text-sm text-slate-600">
          وضعیت پلن و شروع پرداخت جدید برای تمدید یا ارتقا.
        </p>
      </header>

      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">پلن جاری</p>
            <p className="text-xl font-semibold text-slate-900">{billingStatus.plan}</p>
          </div>
          <Button>شروع پرداخت</Button>
        </div>
        <p className="text-sm text-slate-700">
          وضعیت پرداخت اخیر: <span className="font-semibold">{billingStatus.paymentStatus}</span>
        </p>
        <p className="text-sm text-slate-700">
          مبلغ تمدید: <span className="font-semibold">{billingStatus.amount}</span>
        </p>
        <p className="text-sm text-slate-700">
          تاریخ تمدید بعدی: <span className="font-semibold">{billingStatus.renewalDate}</span>
        </p>
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          برای فعال ماندن خدمات نوبت‌دهی و پرونده‌های بیماران، فرایند پرداخت را پیش از
          تاریخ تمدید بعدی تکمیل کنید.
        </div>
      </Card>
    </main>
  );
}
