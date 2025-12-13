import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AppointmentScheduler } from "@/components/appointments/appointment-scheduler";
import { PatientCrudPanel } from "@/components/patients/patient-crud-panel";
import type { AppointmentRecord, PatientRecord } from "@/lib/types";
import { renderWithProviders } from "./test-utils";
import { server } from "../vitest.mocks";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

describe("PatientCrudPanel", () => {
  it("adds patient and updates React Query cache", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderWithProviders(<PatientCrudPanel />);

    await screen.findByText("مونا زمانی");

    await user.type(screen.getByPlaceholderText("مثلاً سارا محمدی"), "نگین راد");
    await user.type(screen.getByPlaceholderText("0912xxxxxxx"), "09127774444");
    await user.click(screen.getByRole("button", { name: "افزودن بیمار" }));

    await screen.findByText("نگین راد");

    const cached = queryClient.getQueryData<PatientRecord[]>(["patients"]);
    expect(cached?.some((patient) => patient.name === "نگین راد")).toBe(true);
  });

  it("shows PLAN_LIMIT error when backend rejects creation", async () => {
    server.use(
      http.post(`${API_BASE_URL}/patients`, () =>
        HttpResponse.json({ message: "PLAN_LIMIT: patient quota reached" }, { status: 429 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<PatientCrudPanel />);

    await screen.findByText("مونا زمانی");
    await user.type(screen.getByPlaceholderText("مثلاً سارا محمدی"), "نگین راد");
    await user.type(screen.getByPlaceholderText("0912xxxxxxx"), "09127774444");
    await user.click(screen.getByRole("button", { name: "افزودن بیمار" }));

    await screen.findByText("سقف پلن شما پر شده است و امکان افزودن بیمار جدید وجود ندارد.");
  });
});

describe("AppointmentScheduler", () => {
  it("creates appointment and reflects it in cache", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderWithProviders(<AppointmentScheduler />);

    await screen.findByText("مونا زمانی");

    await user.type(screen.getByPlaceholderText("مثلاً نرگس"), "نگار میرزایی");
    await user.type(screen.getByPlaceholderText("لیزر، تزریق و..."), "پاکسازی پوست");
    const dateInput = screen.getByLabelText("تاریخ");
    await user.type(dateInput, "1403-11-01");
    await user.type(screen.getByLabelText("ساعت"), "11:00");
    await user.click(screen.getByRole("button", { name: "ذخیره نوبت" }));

    await screen.findByText("نگار میرزایی");

    const cached = queryClient.getQueryData<AppointmentRecord[]>(["appointments"]);
    expect(cached?.some((appointment) => appointment.patient === "نگار میرزایی")).toBe(true);
  });

  it("surfaces PLAN_LIMIT for appointments", async () => {
    server.use(
      http.post(`${API_BASE_URL}/appointments`, () =>
        HttpResponse.json({ message: "PLAN_LIMIT: appointment quota exceeded" }, { status: 429 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<AppointmentScheduler />);

    await screen.findByText("مونا زمانی");
    await user.type(screen.getByPlaceholderText("مثلاً نرگس"), "مریم");
    await user.type(screen.getByPlaceholderText("لیزر، تزریق و..."), "لیزر");
    await user.type(screen.getByLabelText("تاریخ"), "1403-11-02");
    await user.type(screen.getByLabelText("ساعت"), "08:30");
    await user.click(screen.getByRole("button", { name: "ذخیره نوبت" }));

    await screen.findByText("سقف پلن فعلی اجازه ثبت نوبت جدید را نمی‌دهد.");
  });

  it("updates appointment status and shows toast", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderWithProviders(<AppointmentScheduler />);

    await screen.findByText("مونا زمانی");
    const checkInButtons = await screen.findAllByRole("button", { name: "ثبت حضور" });
    await user.click(checkInButtons[0]);

    await screen.findByText("وضعیت نوبت به‌روزرسانی شد.");
    await waitFor(() => {
      const cached = queryClient.getQueryData<AppointmentRecord[]>(["appointments"]);
      expect(cached?.find((item) => item.patient === "مونا زمانی")?.status).toBe("CHECKED_IN");
    });
  });

  it("surfaces time conflict toast from API mock", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppointmentScheduler />);

    await screen.findByText("مونا زمانی");
    await user.clear(screen.getByLabelText("ساعت"));
    await user.type(screen.getByPlaceholderText("مثلاً نرگس"), "هما");
    await user.type(screen.getByPlaceholderText("لیزر، تزریق و..."), "ویزیت");
    await user.type(screen.getByLabelText("تاریخ"), "1403-10-10");
    await user.type(screen.getByLabelText("ساعت"), "10:00");
    await user.click(screen.getByRole("button", { name: "ذخیره نوبت" }));

    await screen.findByText("زمان انتخابی با نوبت دیگری تداخل دارد.");
  });
});
