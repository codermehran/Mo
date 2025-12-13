"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPatient, fetchPatients } from "@/lib/api";
import type { PatientRecord } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function usePlanLimitMessage(error?: unknown) {
  return useMemo(() => {
    if (!error) return undefined;
    const message = (error as Error).message || "خطای ناشناخته رخ داده است.";
    if (message.includes("PLAN_LIMIT")) {
      return "سقف پلن شما پر شده است و امکان افزودن بیمار جدید وجود ندارد.";
    }
    return message;
  }, [error]);
}

export function PatientCrudPanel() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const patientsQuery = useQuery({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });

  const createMutation = useMutation({
    mutationFn: () => createPatient({ name, phone }),
    onSuccess: (created) => {
      queryClient.setQueryData<PatientRecord[]>(["patients"], (current = []) => [
        created,
        ...current,
      ]);
      setName("");
      setPhone("");
    },
  });

  const isSubmitting = createMutation.isPending;
  const planLimitMessage = usePlanLimitMessage(createMutation.error || patientsQuery.error);

  return (
    <Card className="space-y-4 p-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-widest text-slate-500">patients</p>
        <h2 className="text-2xl font-bold text-slate-900">ایجاد و مدیریت بیمار</h2>
        <p className="text-sm text-slate-600">
          بیمار جدید ثبت کنید و لیست به‌روز شده را بدون رفرش دوباره داده مشاهده کنید.
        </p>
      </div>

      {planLimitMessage ? <Alert title="محدودیت پلن" message={planLimitMessage} /> : null}

      <form
        className="grid gap-3 md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate();
        }}
      >
        <label className="space-y-2 text-sm font-medium text-slate-800">
          <span>نام بیمار</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="مثلاً سارا محمدی"
            required
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-800">
          <span>شماره موبایل</span>
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="0912xxxxxxx"
            inputMode="tel"
            required
          />
        </label>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "در حال ثبت..." : "افزودن بیمار"}
          </Button>
        </div>
      </form>

      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
        {patientsQuery.data?.map((patient) => (
          <div key={patient.id} className="flex items-center justify-between px-3 py-2 text-sm">
            <div>
              <p className="font-semibold text-slate-900">{patient.name}</p>
              <p className="text-xs text-slate-500">{patient.phone}</p>
            </div>
            <span className="text-xs text-slate-500">ثبت شده در {patient.createdAt}</span>
          </div>
        ))}
        {patientsQuery.isLoading ? (
          <p className="px-3 py-4 text-sm text-slate-500">در حال بارگذاری...</p>
        ) : null}
        {patientsQuery.data?.length === 0 ? (
          <p className="px-3 py-4 text-sm text-slate-500">هیچ بیماری ثبت نشده است.</p>
        ) : null}
      </div>
    </Card>
  );
}
