import type {
  AppointmentRecord,
  AuthTokens,
  BillingStatus,
  BootstrapResponse,
  ClinicProfile,
  ClinicSettingsInput,
  PatientRecord,
  StaffMember,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    const message = payload?.message || payload?.detail || "خطا در برقراری ارتباط با سرور";
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function requestOtp(payload: { phone: string; purpose: "login" | "recovery" }) {
  const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string }>(response);
}

export async function verifyOtp(payload: {
  phone: string;
  code: string;
  purpose: "login" | "recovery";
}): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthTokens>(response);
}

export async function refreshSession(refreshToken?: string): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return handleResponse<AuthTokens>(response);
}

export async function fetchBootstrap(accessToken?: string): Promise<BootstrapResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/bootstrap`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
  return handleResponse<BootstrapResponse>(response);
}

export async function fetchPatients(): Promise<PatientRecord[]> {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<PatientRecord[]>(response);
}

export async function createPatient(payload: { name: string; phone: string }): Promise<PatientRecord> {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<PatientRecord>(response);
}

export async function fetchAppointments(): Promise<AppointmentRecord[]> {
  const response = await fetch(`${API_BASE_URL}/appointments`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<AppointmentRecord[]>(response);
}

export async function createAppointment(payload: {
  patient: string;
  service: string;
  date: string;
  time: string;
}): Promise<AppointmentRecord> {
  const response = await fetch(`${API_BASE_URL}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse<AppointmentRecord>(response);
}

export async function updateAppointmentStatus(
  id: number,
  status: AppointmentRecord["status"],
): Promise<AppointmentRecord> {
  const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  return handleResponse<AppointmentRecord>(response);
}

export async function fetchClinicProfile(): Promise<ClinicProfile> {
  const response = await fetch(`${API_BASE_URL}/clinic`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<ClinicProfile>(response);
}

export async function updateClinicProfile(payload: ClinicSettingsInput): Promise<ClinicProfile> {
  const response = await fetch(`${API_BASE_URL}/clinic`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<ClinicProfile>(response);
}

export async function fetchStaffMembers(): Promise<StaffMember[]> {
  const response = await fetch(`${API_BASE_URL}/staff`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<StaffMember[]>(response);
}

export async function toggleStaffMember(
  id: number,
  payload: { active: boolean },
): Promise<StaffMember> {
  const response = await fetch(`${API_BASE_URL}/staff/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<StaffMember>(response);
}

export async function requestBillingCheckout(): Promise<{ checkout_url: string }> {
  const response = await fetch(`${API_BASE_URL}/billing/checkout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<{ checkout_url: string }>(response);
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
  const response = await fetch(`${API_BASE_URL}/billing/status`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<BillingStatus>(response);
}
