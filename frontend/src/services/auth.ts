import { api, setAuthToken } from "./api";
import type { UserSummary } from "../types/user";

const TOKEN_KEY = "mern_assignment_token";

export type AuthUser = UserSummary;

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface ProfileUpdatePayload {
  name: string;
  username: string;
  password?: string;
}

export function loadToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    setAuthToken(token);
  }
  return token;
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  setAuthToken(token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  setAuthToken();
}

export async function login(identifier: string, password: string) {
  const response = await api.post("/api/auth/login", { identifier, password });
  saveToken(response.data.token);
  return response.data.user as AuthUser;
}

export async function register(data: RegisterPayload) {
  const response = await api.post("/api/auth/register", data);
  saveToken(response.data.token);
  return response.data.user as AuthUser;
}

export async function fetchCurrentUser() {
  const response = await api.get("/api/auth/me");
  return response.data as AuthUser;
}

export async function updateProfile(data: ProfileUpdatePayload) {
  const response = await api.put("/api/users/me", data);
  return response.data as AuthUser;
}
