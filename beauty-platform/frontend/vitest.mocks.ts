import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type {
  AppointmentRecord,
  BillingStatus,
  ClinicProfile,
  PatientRecord,
  StaffMember,
  UserProfile,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

let patients: PatientRecord[] = [];
let appointments: AppointmentRecord[] = [];
let clinicProfile: ClinicProfile;
let staffMembers: StaffMember[] = [];
let billingStatus: BillingStatus;
let profile: UserProfile;

const basePatients: PatientRecord[] = [
  { id: 101, name: "مونا زمانی", phone: "09120000000", createdAt: "1403/10/01" },
  { id: 102, name: "سحر مرادی", phone: "09350000000", createdAt: "1403/10/02" },
];

const baseAppointments: AppointmentRecord[] = [
  {
    id: 1,
    patient: "مونا زمانی",
    service: "لیزر پوست",
    date: "1403-10-10",
    time: "10:00",
    status: "SCHEDULED",
  },
  {
    id: 2,
    patient: "سحر مرادی",
    service: "تزریق بوتاکس",
    date: "1403-10-11",
    time: "09:00",
    status: "SCHEDULED",
  },
];

const baseClinic: ClinicProfile = {
  id: "CL-20",
  name: "کلینیک آفتاب",
  address: "تهران، خیابان ولیعصر",
  timezone: "Asia/Tehran",
};

const baseStaff: StaffMember[] = [
  { id: 1, name: "مینا تهرانی", role: "پزشک", active: true },
  { id: 2, name: "آیدا مرادی", role: "مسئول پذیرش", active: true },
  { id: 3, name: "سارا محسنی", role: "پرستار", active: false },
];

const baseBilling: BillingStatus = {
  plan: "پلن حرفه‌ای",
  renewalDate: "1403/12/20",
  paymentStatus: "موفق",
  amount: "۱۲،۰۰۰،۰۰۰ تومان",
  subscriptionState: "active",
};

const baseProfile: UserProfile = {
  id: "USR-1",
  fullName: "فاطمه رهبر",
  phone: "09120000000",
  role: "OWNER",
};

export function resetMockData() {
  patients = [...basePatients];
  appointments = [...baseAppointments];
  clinicProfile = { ...baseClinic };
  staffMembers = [...baseStaff];
  billingStatus = { ...baseBilling };
  profile = { ...baseProfile };
}

resetMockData();

const handlers = [
  http.get("/api/auth/refresh-token", () => HttpResponse.json({ hasRefreshToken: false })),
  http.post("/api/auth/refresh-token", () => HttpResponse.json({ ok: true })),
  http.delete("/api/auth/refresh-token", () => HttpResponse.json({ cleared: true })),
  http.post(`${API_BASE_URL}/auth/refresh`, async () =>
    HttpResponse.json({ accessToken: "token-abc", refreshToken: "refresh-xyz" }),
  ),
  http.get(`${API_BASE_URL}/auth/bootstrap`, async () =>
    HttpResponse.json({ profile, clinic: clinicProfile }),
  ),
  http.post(`${API_BASE_URL}/auth/request-otp`, async () => {
    return HttpResponse.json({ message: "کد ارسال شد" });
  }),
  http.post(`${API_BASE_URL}/auth/verify-otp`, async () => {
    return HttpResponse.json({ accessToken: "token-abc", refreshToken: "refresh-xyz" });
  }),
  http.get(`${API_BASE_URL}/patients`, () => {
    return HttpResponse.json(patients);
  }),
  http.post(`${API_BASE_URL}/patients`, async ({ request }) => {
    const body = (await request.json()) as { name: string; phone: string };
    const newPatient: PatientRecord = {
      id: Date.now(),
      name: body.name,
      phone: body.phone,
      createdAt: "1403/10/12",
    };
    patients = [newPatient, ...patients];
    return HttpResponse.json(newPatient);
  }),
  http.get(`${API_BASE_URL}/appointments`, () => {
    return HttpResponse.json(appointments);
  }),
  http.post(`${API_BASE_URL}/appointments`, async ({ request }) => {
    const body = (await request.json()) as { patient: string; service: string; date: string; time: string };
    const hasConflict = appointments.some(
      (appt) => appt.date === body.date && appt.time === body.time && appt.status !== "CANCELED",
    );
    if (hasConflict) {
      return HttpResponse.json({ message: "TIME_CONFLICT: overlap" }, { status: 409 });
    }
    const newAppointment: AppointmentRecord = {
      id: Date.now(),
      patient: body.patient,
      service: body.service,
      date: body.date,
      time: body.time,
      status: "SCHEDULED",
    };
    appointments = [newAppointment, ...appointments];
    return HttpResponse.json(newAppointment);
  }),
  http.patch(`${API_BASE_URL}/appointments/:id`, async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as { status: AppointmentRecord["status"] };
    const existing = appointments.find((appt) => appt.id === id);
    if (!existing) {
      return HttpResponse.json({ message: "NOT_FOUND" }, { status: 404 });
    }
    const updated = { ...existing, status: body.status } as AppointmentRecord;
    appointments = appointments.map((appt) => (appt.id === id ? updated : appt));
    return HttpResponse.json(updated);
  }),
  http.get(`${API_BASE_URL}/clinic`, () => HttpResponse.json(clinicProfile)),
  http.put(`${API_BASE_URL}/clinic`, async ({ request }) => {
    const body = (await request.json()) as Partial<ClinicProfile>;
    clinicProfile = { ...clinicProfile, ...body };
    return HttpResponse.json(clinicProfile);
  }),
  http.get(`${API_BASE_URL}/staff`, () => HttpResponse.json(staffMembers)),
  http.patch(`${API_BASE_URL}/staff/:id`, async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as { active: boolean };
    const member = staffMembers.find((item) => item.id === id);
    if (!member) {
      return HttpResponse.json({ message: "NOT_FOUND" }, { status: 404 });
    }
    const updated = { ...member, active: body.active };
    staffMembers = staffMembers.map((item) => (item.id === id ? updated : item));
    return HttpResponse.json(updated);
  }),
  http.get(`${API_BASE_URL}/billing/status`, () => HttpResponse.json(billingStatus)),
  http.post(`${API_BASE_URL}/billing/checkout`, () => {
    const checkoutUrl = "https://bitpay.ir/checkout/mock";
    billingStatus = { ...billingStatus, lastCheckoutUrl: checkoutUrl };
    return HttpResponse.json({ checkout_url: checkoutUrl });
  }),
];

export const server = setupServer(...handlers);
