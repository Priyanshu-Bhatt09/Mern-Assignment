export type UserRole = "Admin" | "Manager" | "User";
export type UserStatus = "Active" | "Inactive";

export interface UserSummary {
  id: string;
  name: string;
  username: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserActor {
  id: string;
  name: string;
  username: string | null;
  email: string;
  role: UserRole;
}

export interface UserDetail extends UserSummary {
  createdBy: UserActor | null;
  updatedBy: UserActor | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface UserListResponse {
  items: UserSummary[];
  pagination: PaginationMeta;
}
