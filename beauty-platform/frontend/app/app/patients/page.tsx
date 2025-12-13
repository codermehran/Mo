"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const patients = [
  { id: 101, name: "فاطمه ابراهیمی", phone: "09120000000", visits: 4 },
  { id: 102, name: "مونا زمانی", phone: "09350000000", visits: 2 },
  { id: 103, name: "سحر مرادی", phone: "09130000000", visits: 6 },
];

export default function PatientsPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return patients;
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(lower) ||
        patient.phone.toLowerCase().includes(lower),
    );
  }, [query]);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-slate-500">patients</p>
        <h1 className="text-3xl font-bold text-slate-900">بیماران</h1>
        <p className="text-sm text-slate-600">
          جستجو و مشاهده فهرست بیماران برای دسترسی سریع به پرونده‌ها.
        </p>
      </header>

      <Card className="space-y-4 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-sm font-medium text-slate-800" htmlFor="patient-search">
            جستجو بر اساس نام یا موبایل
          </label>
          <Input
            id="patient-search"
            placeholder="مثلاً فاطمه یا 0912"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full sm:max-w-xs"
          />
        </div>

        <div className="divide-y divide-slate-200">
          {filtered.map((patient) => (
            <Link
              key={patient.id}
              href={`/app/patients/${patient.id}`}
              className="flex items-center justify-between py-4 transition hover:bg-slate-50"
            >
              <div>
                <p className="text-lg font-semibold text-slate-900">{patient.name}</p>
                <p className="text-sm text-slate-600">{patient.phone}</p>
              </div>
              <p className="text-xs text-slate-500">{patient.visits} مراجعه</p>
            </Link>
          ))}
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">
              بیماری با این مشخصات یافت نشد.
            </p>
          ) : null}
        </div>
      </Card>
    </main>
  );
}
