"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { requestOtp, verifyOtp } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

interface OtpFlowProps {
  mode: "login" | "recovery";
  title: string;
  subtitle: string;
}

export function OtpFlow({ mode, title, subtitle }: OtpFlowProps) {
  const router = useRouter();
  const { setTokens } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");

  const requestMutation = useMutation({
    mutationFn: () => requestOtp({ phone, purpose: mode }),
    onSuccess: () => setStep("verify"),
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyOtp({ phone, code, purpose: mode }),
    onSuccess: (tokens) => {
      setTokens(tokens);
      router.replace("/app");
    },
  });

  const hasError = requestMutation.isError || verifyMutation.isError;
  const errorMessage =
    (requestMutation.error as Error)?.message || (verifyMutation.error as Error)?.message;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-slate-500">BeautyClinic</p>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>

      {hasError && errorMessage && <Alert title="خطا" message={errorMessage} />}

      <div className="space-y-4">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>شماره موبایل</span>
          <Input
            placeholder="0912xxxxxxx"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={requestMutation.isPending || verifyMutation.isPending || step === "verify"}
          />
        </label>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            onClick={() => requestMutation.mutate()}
            disabled={!phone || requestMutation.isPending || step === "verify"}
          >
            {requestMutation.isPending ? "در حال ارسال..." : "ارسال کد یک‌بارمصرف"}
          </Button>
          {step === "verify" && (
            <div className="space-y-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>کد دریافتی</span>
                <Input
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={verifyMutation.isPending}
                />
              </label>
              <Button
                type="button"
                onClick={() => verifyMutation.mutate()}
                disabled={!code || verifyMutation.isPending}
              >
                {verifyMutation.isPending ? "در حال ورود..." : "تایید و ورود"}
              </Button>
              <button
                type="button"
                className="text-xs text-slate-500 underline"
                onClick={() => {
                  setStep("request");
                  setCode("");
                }}
              >
                ویرایش شماره موبایل
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600">
        <p>کد تا ۱۰ دقیقه معتبر است و برای امنیت در حافظه مرورگر ذخیره نمی‌شود.</p>
        <p>توکن دسترسی در حافظه موقت نگه‌داری می‌شود و رفرش توکن در cookie ذخیره خواهد شد.</p>
      </div>
    </div>
  );
}
