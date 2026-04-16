import { api } from "./api";
import type { UserDetail, UserListResponse, UserRole, UserStatus, UserSummary } from "../types/user";

export interface UserFilters {
  q?: string;
  role?: UserRole | "";
  status?: UserStatus | "";
  page?: number;
  limit?: number;
}

export interface UserUpsertPayload {
  name: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
}

export async function getUsers(filters: UserFilters) {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.role) params.set("role", filters.role);
  if (filters.status) params.set("status", filters.status);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  const res = await api.get<UserListResponse>(query ? `/api/users?${query}` : "/api/users");
  return res.data;
}

export async function getUserById(id: string) {
  const res = await api.get<UserDetail>(`/api/users/${id}`);
  return res.data;
}

export async function getMyProfile() {
  const res = await api.get<UserDetail>("/api/users/me");
  return res.data;
}

export async function createUser(data: UserUpsertPayload & { password: string }) {
  const res = await api.post<UserSummary>("/api/users", data);
  return res.data;
}

export async function updateUser(id: string, data: Partial<UserUpsertPayload> & { password?: string }) {
  const res = await api.put<UserSummary>(`/api/users/${id}`, data);
  return res.data;
}

export async function deleteUser(id: string) {
  const res = await api.delete<{ message: string; user: UserSummary }>(`/api/users/${id}`);
  return res.data;
}
