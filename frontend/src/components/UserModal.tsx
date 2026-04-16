import { useState } from "react";
import type { UserRole, UserStatus } from "../types/user";

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (user: {
    name: string;
    username: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    password?: string;
  }) => void;
  user?: {
    name: string;
    username: string | null;
    email: string;
    role: UserRole;
    status: UserStatus;
  } | null;
  isEdit?: boolean;
  canEditRole?: boolean;
  canEditStatus?: boolean;
}

const roles: UserRole[] = ["Admin", "Manager", "User"];
const statuses: UserStatus[] = ["Active", "Inactive"];

export default function UserModal({
  open,
  onClose,
  onSave,
  user,
  isEdit,
  canEditRole = true,
  canEditStatus = true,
}: UserModalProps) {
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState<UserRole>(user?.role || "User");
  const [status, setStatus] = useState<UserStatus>(user?.status || "Active");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !username.trim() || !email.trim()) {
      setError("Name, username, and email are required.");
      return;
    }

    if (!isEdit && !password.trim()) {
      setError("Password is required when creating a user.");
      return;
    }

    onSave({
      name: name.trim(),
      username: username.trim(),
      email: email.trim(),
      role,
      status,
      ...(password ? { password } : {}),
    });
  };

  return (
    <div className="dialog-backdrop">
      <div className="dialog-panel dialog-wide">
        <div className="dialog-copy">
          <p className="eyebrow">{isEdit ? "Edit user" : "New user"}</p>
          <h3>{isEdit ? "Edit account" : "Create account"}</h3>
          <p>Update the details below.</p>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Full name
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label>
              Username
              <input value={username} onChange={(event) => setUsername(event.target.value)} required />
            </label>
          </div>
          <div className="form-row">
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isEdit ? "Leave blank to keep the current password" : "Set a temporary password"}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Role
              <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} disabled={!canEditRole}>
                {roles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as UserStatus)}
                disabled={!canEditStatus}
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? "Save changes" : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
