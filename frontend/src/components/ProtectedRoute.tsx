import { Navigate } from "react-router-dom";
import type { AuthUser } from "../services/auth";
import type { ReactNode } from "react";
import type { UserRole } from "../types/user";

interface ProtectedRouteProps {
  user: AuthUser | null;
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ user, children, allowedRoles }: ProtectedRouteProps) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
