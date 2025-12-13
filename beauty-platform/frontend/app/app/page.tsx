"use client";

import { useBootstrap } from "@/components/auth/bootstrap-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function AppHome() {
  const { profile, clinic } = useBootstrap();
  const { clearTokens } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    clearTokens();
    router.replace("/login");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <Card className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">BeautyClinic</p>
            <h1 className="text-2xl font-bold text-slate-900">داشبورد</h1>
          </div>
          <Button onClick={handleLogout}>خروج</Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-800">پروفایل کاربر</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <span className="font-semibold">نام:</span> {profile.fullName}
              </li>
              <li>
                <span className="font-semibold">موبایل:</span> {profile.phone}
              </li>
              <li>
                <span className="font-semibold">نقش:</span> {profile.role}
              </li>
            </ul>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-800">کلینیک فعال</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <span className="font-semibold">نام:</span> {clinic.name}
              </li>
              <li>
                <span className="font-semibold">شناسه:</span> {clinic.id}
              </li>
              {clinic.address && (
                <li>
                  <span className="font-semibold">آدرس:</span> {clinic.address}
                </li>
              )}
              {clinic.timezone && (
                <li>
                  <span className="font-semibold">منطقه زمانی:</span> {clinic.timezone}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="rounded-xl bg-primary text-primary-foreground p-4 text-sm leading-6">
          <p>اطلاعات پروفایل و کلینیک در بارگذاری اولیه با React Query دریافت شده است.</p>
          <p>در صورت انقضای توکن، رفرش توکن از cookie خوانده می‌شود و احراز هویت تکرار می‌گردد.</p>
        </div>
      </Card>
    </main>
  );
}
