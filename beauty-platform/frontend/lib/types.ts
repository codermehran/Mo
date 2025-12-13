export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  role: "OWNER" | "STAFF" | "DOCTOR";
}

export interface ClinicProfile {
  id: string;
  name: string;
  address?: string;
  timezone?: string;
}

export interface BootstrapResponse {
  profile: UserProfile;
  clinic: ClinicProfile;
}

export interface PatientRecord {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
}

export interface AppointmentRecord {
  id: number;
  patient: string;
  service: string;
  date: string;
}
