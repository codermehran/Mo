"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";

const patients = {
  101: {
    name: "فاطمه ابراهیمی",
    phone: "09120000000",
    birthDate: "۱۳۷۵/۰۲/۱۲",
    procedures: [
      { title: "لیزر پوست", date: "۱۴۰۳/۰۴/۱۰", status: "انجام شد" },
      { title: "تزریق بوتاکس", date: "۱۴۰۳/۰۵/۲۸", status: "رزروشده" },
    ],
  },
  102: {
    name: "مونا زمانی",
    phone: "09350000000",
    birthDate: "۱۳۷۰/۰۹/۰۵",
    procedures: [
      { title: "میکرونیدلینگ", date: "۱۴۰۳/۰۱/۲۲", status: "انجام شد" },
    ],
  },
  103: {
    name: "سحر مرادی",
    phone: "09130000000",
    birthDate: "۱۳۶۹/۰۶/۲۹",
    procedures: [
      { title: "لیزر موهای زائد", date: "۱۴۰۳/۰۳/۱۴", status: "لغو شد" },
      { title: "پاکسازی پوست", date: "۱۴۰۳/۰۶/۰۳", status: "رزروشده" },
    ],
  },
};

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;

  const patient = useMemo(() => patients[Number(patientId) as 101 | 102 | 103], [patientId]);

  if (!patient) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">بیمار یافت نشد</h1>
        <p className="text-sm text-slate-600">شناسه وارد شده در لیست بیماران موجود نیست.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="text-xs uppercase tracking-widest text-slate-500">patient details</p>
        <h1 className="text-3xl font-bold text-slate-900">{patient.name}</h1>
        <p className="text-sm text-slate-600">موبایل: {patient.phone}</p>
        <p className="text-sm text-slate-600">تاریخ تولد: {patient.birthDate}</p>
      </header>

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-slate-900">پروسیجرها</h2>
        <div className="mt-4 divide-y divide-slate-200">
          {patient.procedures.map((procedure) => (
            <div
              key={`${procedure.title}-${procedure.date}`}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{procedure.title}</p>
                <p className="text-xs text-slate-500">{procedure.date}</p>
              </div>
              <span className="text-xs font-medium text-slate-700">{procedure.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
