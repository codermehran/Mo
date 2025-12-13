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
