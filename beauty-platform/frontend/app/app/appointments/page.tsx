"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const formatDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const initialAppointments = [
  {
    id: 1,
    patient: "فاطمه ابراهیمی",
    service: "لیزر پوست",
    date: formatDate(3),
    status: "رزرو شده",
  },
  {
    id: 2,
    patient: "مونا زمانی",
    service: "تزریق بوتاکس",
    date: formatDate(-2),
    status: "انجام شد",
  },
  {
    id: 3,
    patient: "سحر مرادی",
    service: "میکرونیدلینگ",
    date: formatDate(-20),
    status: "لغو شد",
  },
];

const statuses = ["رزرو شده", "انجام شد", "لغو شد"];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filtered = useMemo(() => {
    return appointments.filter((appointment) => {
      if (startDate && appointment.date < startDate) return false;
      if (endDate && appointment.date > endDate) return false;
      return true;
    });
  }, [appointments, startDate, endDate]);

  const calendarSummary = useMemo(() => {
    const groups: Record<string, number> = {};
    filtered.forEach((item) => {
      groups[item.date] = (groups[item.date] ?? 0) + 1;
    });
    return Object.entries(groups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const handleStatusChange = (id: number, nextStatus: string) => {
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)),
    );
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="text-xs uppercase tracking-widest text-slate-500">appointments</p>
        <h1 className="text-3xl font-bold text-slate-900">نوبت‌ها</h1>
        <p className="text-sm text-slate-600">
          بازه تاریخ را انتخاب کنید و وضعیت هر نوبت را به‌روزرسانی نمایید.
        </p>
      </header>

      <Card className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-1">
            <label htmlFor="start-date" className="text-sm font-medium text-slate-800">
              تاریخ شروع
            </label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="end-date" className="text-sm font-medium text-slate-800">
              تاریخ پایان
            </label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
            >
              پاک کردن بازه
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((appointment) => (
            <Card key={appointment.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{appointment.patient}</p>
                  <p className="text-sm text-slate-600">{appointment.service}</p>
                </div>
                <span className="text-xs text-slate-500">{appointment.date}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {statuses.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={appointment.status === status ? "default" : "outline"}
                    onClick={() => handleStatusChange(appointment.id, status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              در این بازه زمانی نوبتی ثبت نشده است.
            </p>
          ) : null}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">نمای تقویمی ساده</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {calendarSummary.map((item) => (
              <div
                key={item.date}
                className="rounded-lg border border-dashed border-slate-200 p-3 text-sm"
              >
                <p className="font-semibold text-slate-900">{item.date}</p>
                <p className="text-xs text-slate-600">{item.count} نوبت در این روز</p>
              </div>
            ))}
            {calendarSummary.length === 0 ? (
              <p className="text-xs text-slate-500">هیچ روزی در بازه انتخابی نیست.</p>
            ) : null}
          </div>
        </div>
      </Card>
    </main>
  );
}
