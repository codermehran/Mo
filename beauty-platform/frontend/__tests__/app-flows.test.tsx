import { beforeEach, describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { AuthGuard } from "@/components/auth/auth-guard";
import ClinicSettingsPage from "@/app/app/clinic/page";
import StaffPage from "@/app/app/staff/page";
import BillingPage from "@/app/app/billing/page";
import { renderWithProviders } from "./test-utils";
import { server } from "../vitest.mocks";
import { http, HttpResponse } from "msw";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

beforeEach(() => {
  replaceMock.mockReset();
  document.cookie = "";
});

describe("AuthGuard", () => {
  it("redirects unauthenticated user to login", async () => {
    renderWithProviders(
      <AuthGuard>
        <div>protected</div>
      </AuthGuard>,
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"), { timeout: 3000 });
  });

  it("recovers session from refresh cookie", async () => {
    document.cookie = "refresh_token=from-cookie";

    server.use(
      http.get("/api/auth/refresh-token", () => HttpResponse.json({ hasRefreshToken: true })),
      http.post(`${API_BASE_URL}/auth/refresh`, () =>
        HttpResponse.json({ accessToken: "token-new", refreshToken: "refresh-cookie" }),
      ),
      http.get(`${API_BASE_URL}/auth/bootstrap`, () =>
        HttpResponse.json({
          profile: { id: "USR-9", fullName: "مونا تست", phone: "09121111111", role: "OWNER" },
          clinic: { id: "CL-9", name: "کلینیک تست", address: "", timezone: "Asia/Tehran" },
        }),
      ),
    );

    renderWithProviders(
      <AuthGuard>
        <div>protected</div>
      </AuthGuard>,
    );

    await screen.findByText("protected");
    expect(replaceMock).not.toHaveBeenCalled();
  });
});

describe("Clinic and staff flows", () => {
  it("submits clinic form and updates cache", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderWithProviders(<ClinicSettingsPage />);

    await screen.findByText("اطلاعات کلینیک");
    const nameInput = await screen.findByDisplayValue("کلینیک آفتاب");
    await user.clear(nameInput);
    await user.type(nameInput, "کلینیک سیمرغ");
    await user.type(screen.getByPlaceholderText("تهران، خیابان ..."), "اصفهان، میدان نقش جهان");
    await user.click(screen.getByRole("button", { name: "ذخیره تغییرات" }));

    await screen.findByText("تغییرات با موفقیت ذخیره شد.");
    const cached = queryClient.getQueryData(["clinic"]);
    expect(cached).toMatchObject({ name: "کلینیک سیمرغ" });
  });

  it("toggles staff member activation", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderWithProviders(<StaffPage />);

    await screen.findByText("مدیریت کارکنان");
    const toggleButtons = await screen.findAllByRole("button", { name: "غیرفعال‌سازی" });
    await user.click(toggleButtons[0]);

    await waitFor(() => expect(queryClient.getQueryData(["staff"])).toBeTruthy());
    const staffCache = queryClient.getQueryData<unknown[]>(["staff"]);
    expect((staffCache?.[0] as { active: boolean }).active).toBe(false);
  });
});

describe("Billing upgrade", () => {
  it("shows BitPay checkout url and subscription state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BillingPage />);

    await screen.findByText("صورت‌حساب و پرداخت");
    await user.click(screen.getByRole("button", { name: "شروع پرداخت" }));

    await screen.findByText("https://bitpay.ir/checkout/mock");
    await user.click(screen.getByRole("button", { name: "به‌روزرسانی وضعیت" }));
    await screen.findByText("وضعیت اشتراک:");
  });

  it("surfaces PLAN_LIMIT error message", async () => {
    server.use(
      http.post(`${API_BASE_URL}/billing/checkout`, () =>
        HttpResponse.json({ message: "PLAN_LIMIT: blocked" }, { status: 429 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<BillingPage />);

    await user.click(screen.getByRole("button", { name: "شروع پرداخت" }));
    await screen.findByText("سقف پلن فعلی اجازه ارتقا را نمی‌دهد.");
  });
});
