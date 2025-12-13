import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, vi } from "vitest";
import { OtpFlow } from "@/components/auth/otp-flow";
import { renderWithProviders } from "./test-utils";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

beforeEach(() => {
  replaceMock.mockReset();
});

describe("OtpFlow", () => {
  it("moves through OTP steps with mocked API", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <OtpFlow
        mode="login"
        title="ورود با کد یک‌بارمصرف"
        subtitle="شماره موبایل خود را وارد کنید"
      />,
    );

    const phoneInput = screen.getByPlaceholderText("0912xxxxxxx");
    await user.type(phoneInput, "09120000000");
    await user.click(screen.getByRole("button", { name: "ارسال کد یک‌بارمصرف" }));

    const codeInput = await screen.findByPlaceholderText("123456");
    await user.type(codeInput, "654321");
    await user.click(screen.getByRole("button", { name: "تایید و ورود" }));

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));
  });
});
