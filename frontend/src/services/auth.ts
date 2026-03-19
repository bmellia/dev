import { apiFetch } from "./api";


export type AdminSession = {
  id: number;
  username: string;
};

type LoginPayload = {
  username: string;
  password: string;
};


export function fetchCurrentSession() {
  return apiFetch<AdminSession>("/auth/me");
}


export function login(payload: LoginPayload) {
  return apiFetch<AdminSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export function logout() {
  return apiFetch<void>("/auth/logout", {
    method: "POST",
  });
}


export function changePassword(current_password: string, new_password: string) {
  return apiFetch<void>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ current_password, new_password }),
  });
}
