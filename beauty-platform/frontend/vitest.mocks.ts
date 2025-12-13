import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { AppointmentRecord, PatientRecord } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

let patients: PatientRecord[] = [];
let appointments: AppointmentRecord[] = [];

const basePatients: PatientRecord[] = [
  { id: 101, name: "مونا زمانی", phone: "09120000000", createdAt: "1403/10/01" },
  { id: 102, name: "سحر مرادی", phone: "09350000000", createdAt: "1403/10/02" },
];

const baseAppointments: AppointmentRecord[] = [
  { id: 1, patient: "مونا زمانی", service: "لیزر پوست", date: "1403-10-10" },
  { id: 2, patient: "سحر مرادی", service: "تزریق بوتاکس", date: "1403-10-11" },
];

export function resetMockData() {
  patients = [...basePatients];
  appointments = [...baseAppointments];
}

resetMockData();

const handlers = [
  http.get("/api/auth/refresh-token", () => HttpResponse.json({ hasRefreshToken: false })),
  http.post("/api/auth/refresh-token", () => HttpResponse.json({ ok: true })),
  http.delete("/api/auth/refresh-token", () => HttpResponse.json({ cleared: true })),
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
    const body = (await request.json()) as { patient: string; service: string; date: string };
    const newAppointment: AppointmentRecord = {
      id: Date.now(),
      patient: body.patient,
      service: body.service,
      date: body.date,
    };
    appointments = [newAppointment, ...appointments];
    return HttpResponse.json(newAppointment);
  }),
];

export const server = setupServer(...handlers);
