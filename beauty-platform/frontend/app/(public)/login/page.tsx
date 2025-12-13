import { Card } from "@/components/ui/card";
import { OtpFlow } from "@/components/auth/otp-flow";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card>
        <OtpFlow
          mode="login"
          title="ورود با کد یک‌بارمصرف"
          subtitle="شماره موبایل خود را وارد کنید تا کد ورود برایتان ارسال شود."
        />
      </Card>
    </main>
  );
}
