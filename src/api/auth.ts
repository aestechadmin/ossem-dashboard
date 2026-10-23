import api from "./client";

export type LoginStartResponse = {
  message: string;
  token: string;
};

export type LoginVerifyResponse = {
  jwt: string;
  user: {
    id: number;
    email?: string;
    username?: string;
    type?: string;
    mobileNo?: string;
  };
  permissions?: string[];
  branches?: Array<{ id: number; name: string; branchType?: string }>;
  branchId?: number | null;
};

export async function loginWithPassword(identifier: string, password: string) {
  const { data } = await api.post<LoginStartResponse | LoginVerifyResponse>("/auth/local", {
    identifier,
    password,
  });
  return data;
}

/** Phone login — 10-digit mobile, password omitted (same as ossem-frontend). */
export async function loginWithPhone(mobile: string) {
  const { data } = await api.post<LoginStartResponse>("/auth/local", {
    identifier: mobile,
    password: null,
  });
  return data;
}

export async function verifyOtp(token: string, code: string) {
  const { data } = await api.post<LoginVerifyResponse>("/auth/local", {
    token,
    // Backend compares lastOtp (number) with !== — send numeric code
    code: Number(code),
  });
  return data;
}
