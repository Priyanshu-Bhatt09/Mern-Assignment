import { Link } from "react-router-dom";
import RoleBadge from "../components/RoleBadge";
import StatusBadge from "../components/StatusBadge";
import type { AuthUser } from "../services/auth";

interface DashboardProps {
  user: AuthUser;
}

const quickActions = {
  Admin: [
    { title: "Users", description: "Add, edit, and deactivate users.", to: "/users" },
    { title: "My profile", description: "Update your own details.", to: "/profile" },
  ],
  Manager: [
    { title: "Users", description: "Review and update users.", to: "/users" },
    { title: "My profile", description: "Update your own details.", to: "/profile" },
  ],
  User: [
    { title: "My profile", description: "View and update your account.", to: "/profile" },
  ],
} as const;

export default function Dashboard({ user }: DashboardProps) {
  const cards = quickActions[user.role];
  const canManageUsers = user.role === "Admin" || user.role === "Manager";

  return (
    <section className="page-stack">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Hello, {user.name}</h1>
          <p className="section-copy">A quick look at your account.</p>
        </div>
        <div className="hero-meta">
          <RoleBadge role={user.role} />
          <StatusBadge status={user.status} />
        </div>
      </div>

      <div className="stats-grid">
        <article className="surface-card">
          <p className="eyebrow">Username</p>
          <h2>@{user.username ?? "no-username"}</h2>
          <p className="section-copy">{user.email}</p>
        </article>
        <article className="surface-card">
          <p className="eyebrow">Access</p>
          <h2>{canManageUsers ? "Can manage users" : "Profile only"}</h2>
          <p className="section-copy">
            {canManageUsers ? "You can work with user accounts." : "You can edit only your own account."}
          </p>
        </article>
        <article className="surface-card">
          <p className="eyebrow">Session</p>
          <h2>Signed in</h2>
          <p className="section-copy">Your login stays active after refresh.</p>
        </article>
      </div>

      <div className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Quick links</p>
            <h2>Open what you need.</h2>
          </div>
        </div>
        <div className="action-grid">
          {cards.map((card) => (
            <Link key={card.title} to={card.to} className="action-card">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <span>Open</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
