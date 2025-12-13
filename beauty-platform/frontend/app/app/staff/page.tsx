"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const seedStaff = [
  { id: 1, name: "مینا تهرانی", role: "پزشک", active: true },
  { id: 2, name: "آیدا مرادی", role: "مسئول پذیرش", active: true },
  { id: 3, name: "سارا محسنی", role: "پرستار", active: false },
];

export default function StaffPage() {
  const [staff, setStaff] = useState(seedStaff);

  const handleToggle = (id: number) => {
    setStaff((list) =>
      list.map((member) =>
        member.id === id ? { ...member, active: !member.active } : member,
      ),
    );
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="text-xs uppercase tracking-widest text-slate-500">owner</p>
        <h1 className="text-3xl font-bold text-slate-900">مدیریت کارکنان</h1>
        <p className="mt-1 text-sm text-slate-600">
          مالک می‌تواند دسترسی کارکنان را فعال یا غیرفعال کند و وضعیت جاری هر نقش را
          ببیند.
        </p>
      </header>

      <Card className="divide-y divide-slate-200 p-4">
        {staff.map((member) => (
          <div
            key={member.id}
            className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-lg font-semibold text-slate-900">{member.name}</p>
              <p className="text-sm text-slate-600">{member.role}</p>
              <p className="text-xs text-slate-500">
                وضعیت: {member.active ? "فعال" : "غیرفعال"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${member.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
              >
                {member.active ? "Active" : "Inactive"}
              </span>
              <Button
                variant={member.active ? "outline" : "default"}
                onClick={() => handleToggle(member.id)}
              >
                {member.active ? "غیرفعال‌سازی" : "فعال‌سازی"}
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </main>
  );
}
