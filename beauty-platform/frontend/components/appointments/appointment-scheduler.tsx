"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAppointment, fetchAppointments, updateAppointmentStatus } from "@/lib/api";
import type { AppointmentRecord } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function usePlanLimitMessage(error?: unknown) {
  return useMemo(() => {
    if (!error) return undefined;
    const message = (error as Error).message || "خطای ناشناخته رخ داده است.";
    if (message.includes("PLAN_LIMIT")) {
      return "سقف پلن فعلی اجازه ثبت نوبت جدید را نمی‌دهد.";
    }
    return message;
  }, [error]);
}

export function AppointmentScheduler() {
  const queryClient = useQueryClient();
  const [patient, setPatient] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [toast, setToast] = useState<string | null>(null);

  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: fetchAppointments,
  });
  const createMutation = useMutation({
    mutationFn: () => createAppointment({ patient, service, date, time }),
    onSuccess: (created) => {
      queryClient.setQueryData<AppointmentRecord[]>(["appointments"], (current = []) => [
        created,
        ...current,
      ]);
      setPatient("");
      setService("");
      setDate("");
      setTime("10:00");
      setToast("نوبت با موفقیت ثبت شد.");
    },
    onError: (error) => {
      const message = (error as Error).message || "خطا در ثبت نوبت";
      if (message.includes("TIME_CONFLICT")) {
        setToast("زمان انتخابی با نوبت دیگری تداخل دارد.");
      } else if (!message.includes("PLAN_LIMIT")) {
        setToast(message);
      }
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AppointmentRecord["status"] }) =>
      updateAppointmentStatus(id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData<AppointmentRecord[]>(["appointments"], (current = []) =>
        current.map((appt) => (appt.id === updated.id ? updated : appt)),
      );
      setToast("وضعیت نوبت به‌روزرسانی شد.");
    },
    onError: (error) => {
      const message = (error as Error).message || "تغییر وضعیت نوبت انجام نشد.";
      setToast(message);
    },
  });

  const planLimitMessage = usePlanLimitMessage(createMutation.error || appointmentsQuery.error);
  const isSubmitting = createMutation.isPending;

  return (
    <Card className="space-y-4 p-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-widest text-slate-500">appointments</p>
        <h2 className="text-2xl font-bold text-slate-900">ثبت نوبت سریع</h2>
        <p className="text-sm text-slate-600">
          پس از ثبت، لیست نوبت‌ها بلافاصله از cache به‌روزرسانی می‌شود.
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
          <span>بیمار</span>
          <Input
            value={patient}
            onChange={(event) => setPatient(event.target.value)}
            placeholder="مثلاً نرگس"
            required
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-800">
          <span>خدمت</span>
          <Input
            value={service}
            onChange={(event) => setService(event.target.value)}
            placeholder="لیزر، تزریق و..."
            required
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-800">
          <span>تاریخ</span>
          <Input value={date} onChange={(event) => setDate(event.target.value)} type="date" required />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-800">
          <span>ساعت</span>
          <Input value={time} onChange={(event) => setTime(event.target.value)} type="time" required />
        </label>
        <div className="md:col-span-3 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "در حال ثبت..." : "ذخیره نوبت"}
          </Button>
        </div>
      </form>

      {toast ? (
        <div
          role="alert"
          className="rounded-lg bg-slate-900/80 px-4 py-2 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {appointmentsQuery.data?.map((item) => (
          <Card key={item.id} className="space-y-1 p-3 text-sm">
            <p className="font-semibold text-slate-900">{item.patient}</p>
            <p className="text-slate-700">{item.service}</p>
            <p className="text-xs text-slate-500">
              در تاریخ {item.date} ساعت {item.time}
            </p>
            <p className="text-xs font-semibold text-slate-600">
              وضعیت فعلی: {item.status}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => statusMutation.mutate({ id: item.id, status: "CHECKED_IN" })}
              >
                ثبت حضور
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => statusMutation.mutate({ id: item.id, status: "CANCELED" })}
              >
                لغو نوبت
              </Button>
            </div>
          </Card>
        ))}
        {appointmentsQuery.isLoading ? (
          <p className="px-3 py-4 text-sm text-slate-500">در حال بارگذاری...</p>
        ) : null}
        {appointmentsQuery.data?.length === 0 ? (
          <p className="px-3 py-4 text-sm text-slate-500">نوبتی ثبت نشده است.</p>
        ) : null}
      </div>
    </Card>
  );
}
