interface RoleBadgeProps {
  role: string;
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const roleClass =
    role === "Admin" ? "badge badge-admin" : role === "Manager" ? "badge badge-manager" : "badge badge-user";

  return <span className={roleClass}>{role}</span>;
}
