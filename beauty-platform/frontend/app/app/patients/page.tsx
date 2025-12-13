"use client";

import { PatientCrudPanel } from "@/components/patients/patient-crud-panel";
import { Card } from "@/components/ui/card";

export default function PatientsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-slate-500">patients</p>
        <h1 className="text-3xl font-bold text-slate-900">بیماران</h1>
        <p className="text-sm text-slate-600">
          جریان ثبت بیمار جدید و نمایش خطاهای محدودیت پلن با React Query و API mock تست شده است.
        </p>
      </header>

      <PatientCrudPanel />

      <Card className="p-4 text-xs leading-6 text-slate-600">
        <p>لیست بیماران و فرم ثبت از cache React Query تغذیه می‌شود و پس از موفقیت ثبت، بدون رفرش دوباره به‌روزرسانی می‌گردد.</p>
        <p>در صورت بازگشت PLAN_LIMIT از سرور، پیام مناسب در همین صفحه نمایش داده می‌شود.</p>
      </Card>
    </main>
  );
}
