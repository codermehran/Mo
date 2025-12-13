"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchClinicProfile, updateClinicProfile } from "@/lib/api";
import type { ClinicProfile, ClinicSettingsInput } from "@/lib/types";

export default function ClinicSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ClinicSettingsInput>({ name: "", address: "", timezone: "" });
  const [status, setStatus] = useState<string | null>(null);

  const clinicQuery = useQuery({
    queryKey: ["clinic"],
    queryFn: fetchClinicProfile,
  });

  useEffect(() => {
    if (clinicQuery.data) {
      setForm((prev) =>
        prev.name
          ? prev
          : {
              name: clinicQuery.data.name,
              address: clinicQuery.data.address,
              timezone: clinicQuery.data.timezone,
            },
      );
    }
  }, [clinicQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (payload: ClinicSettingsInput) => updateClinicProfile(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<ClinicProfile>(["clinic"], updated);
      setStatus("تغییرات با موفقیت ذخیره شد.");
    },
    onError: (error) => setStatus((error as Error).message),
  });

  const handleChange = (field: keyof ClinicSettingsInput, value: string) => {
    setStatus(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">clinic</p>
          <h1 className="text-3xl font-bold text-slate-900">تنظیمات کلینیک</h1>
          <p className="mt-1 text-sm text-slate-600">اطلاعات تماس و منطقه زمانی را به‌روز کنید.</p>
        </div>
        <Button variant="default">ارتقا</Button>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">اطلاعات کلینیک</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">ویرایش</span>
          </div>

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              updateMutation.mutate(form);
            }}
          >
            <label className="space-y-1 text-sm font-medium text-slate-700">
              <span>نام کلینیک</span>
              <Input
                placeholder="مثلاً کلینیک آفتاب"
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
                required
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">
              <span>آدرس</span>
              <Input
                placeholder="تهران، خیابان ..."
                value={form.address || ""}
                onChange={(event) => handleChange("address", event.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">
              <span>منطقه زمانی</span>
              <Input
                placeholder="Asia/Tehran"
                value={form.timezone || ""}
                onChange={(event) => handleChange("timezone", event.target.value)}
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
            </div>
          </form>

          {status ? <p className="text-sm text-emerald-700" role="alert">{status}</p> : null}
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-semibold text-slate-900">پیش‌نمایش عمومی</h2>
          {clinicQuery.isLoading ? (
            <p className="text-sm text-slate-600">در حال بارگذاری...</p>
          ) : null}
          {clinicQuery.data ? (
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold">نام:</span> {clinicQuery.data.name}
              </p>
              <p>
                <span className="font-semibold">آدرس:</span> {clinicQuery.data.address}
              </p>
              <p>
                <span className="font-semibold">منطقه زمانی:</span> {clinicQuery.data.timezone}
              </p>
            </div>
          ) : null}
        </Card>
      </section>
    </main>
  );
}
