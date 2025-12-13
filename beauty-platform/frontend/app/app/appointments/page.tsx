"use client";

import { AppointmentScheduler } from "@/components/appointments/appointment-scheduler";
import { Card } from "@/components/ui/card";

export default function AppointmentsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-slate-500">appointments</p>
        <h1 className="text-3xl font-bold text-slate-900">نوبت‌ها</h1>
        <p className="text-sm text-slate-600">
          ایجاد نوبت جدید با API mock و مشاهده به‌روزرسانی فوری cache React Query.
        </p>
      </header>

      <AppointmentScheduler />

      <Card className="p-4 text-xs leading-6 text-slate-600">
        <p>در صورت ارسال بیش از سقف مجاز، پیام محدودیت پلن در همین بخش نمایش داده می‌شود.</p>
        <p>با ثبت موفق، داده cache بدون فراخوانی مجدد سرور به‌روز می‌شود.</p>
      </Card>
    </main>
  );
}
