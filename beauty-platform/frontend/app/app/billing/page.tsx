"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchBillingStatus, requestBillingCheckout } from "@/lib/api";

export default function BillingPage() {
  const [error, setError] = useState<string | null>(null);
  const billingQuery = useQuery({
    queryKey: ["billing-status"],
    queryFn: fetchBillingStatus,
  });

  const checkoutMutation = useMutation({
    mutationFn: requestBillingCheckout,
    onSuccess: (payload) => {
      setError(null);
      billingQuery.refetch();
      const link = document.getElementById("checkout-link");
      if (link) {
        link.textContent = payload.checkout_url;
      }
    },
    onError: (err) => setError((err as Error).message),
  });

  const subscriptionLabel = useMemo(() => {
    if (!billingQuery.data) return "";
    if (billingQuery.data.subscriptionState === "pending") return "در انتظار تایید";
    if (billingQuery.data.subscriptionState === "expired") return "منقضی شده";
    return "فعال";
  }, [billingQuery.data]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="text-xs uppercase tracking-widest text-slate-500">billing</p>
        <h1 className="text-3xl font-bold text-slate-900">صورت‌حساب و پرداخت</h1>
        <p className="text-sm text-slate-600">وضعیت پلن و شروع پرداخت جدید برای تمدید یا ارتقا.</p>
      </header>

      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">پلن جاری</p>
            <p className="text-xl font-semibold text-slate-900">{billingQuery.data?.plan}</p>
          </div>
          <Button onClick={() => checkoutMutation.mutate()} disabled={checkoutMutation.isPending}>
            {checkoutMutation.isPending ? "در حال اتصال..." : "شروع پرداخت"}
          </Button>
        </div>
        <p className="text-sm text-slate-700">
          وضعیت پرداخت اخیر: <span className="font-semibold">{billingQuery.data?.paymentStatus}</span>
        </p>
        <p className="text-sm text-slate-700">
          مبلغ تمدید: <span className="font-semibold">{billingQuery.data?.amount}</span>
        </p>
        <p className="text-sm text-slate-700">
          تاریخ تمدید بعدی: <span className="font-semibold">{billingQuery.data?.renewalDate}</span>
        </p>
        <p className="text-sm text-slate-700">
          وضعیت اشتراک: <span className="font-semibold">{subscriptionLabel}</span>
        </p>
        {billingQuery.data?.lastCheckoutUrl ? (
          <p className="text-xs text-slate-500" id="checkout-link">
            {billingQuery.data.lastCheckoutUrl}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {error.includes("PLAN_LIMIT")
              ? "سقف پلن فعلی اجازه ارتقا را نمی‌دهد."
              : error}
          </p>
        ) : null}
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          برای فعال ماندن خدمات نوبت‌دهی و پرونده‌های بیماران، فرایند پرداخت را پیش از تاریخ تمدید بعدی تکمیل کنید.
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => billingQuery.refetch()}>
            به‌روزرسانی وضعیت
          </Button>
          {checkoutMutation.data ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(checkoutMutation.data?.checkout_url, "_blank")}
            >
              مشاهده لینک پرداخت
            </Button>
          ) : null}
        </div>
      </Card>
    </main>
  );
}
