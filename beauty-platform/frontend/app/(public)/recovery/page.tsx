import { Card } from "@/components/ui/card";
import { OtpFlow } from "@/components/auth/otp-flow";

export default function RecoveryPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card>
        <OtpFlow
          mode="recovery"
          title="بازیابی دسترسی"
          subtitle="برای دریافت لینک ورود و بازنشانی کلینیک، شماره موبایل ثبت‌شده را وارد کنید."
        />
      </Card>
    </main>
  );
}
