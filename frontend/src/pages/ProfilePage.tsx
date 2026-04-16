import { useEffect, useState } from "react";
import RoleBadge from "../components/RoleBadge";
import StatusBadge from "../components/StatusBadge";
import { getApiErrorMessage } from "../services/api";
import type { AuthUser } from "../services/auth";
import { updateProfile } from "../services/auth";
import { getMyProfile } from "../services/users";
import type { UserDetail } from "../types/user";

interface ProfilePageProps {
  user: AuthUser;
  onProfileUpdated: (user: AuthUser) => void;
}

export default function ProfilePage({ user, onProfileUpdated }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserDetail | null>(null);
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const response = await getMyProfile();
      setProfile(response);
      setName(response.name);
      setUsername(response.username ?? "");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load your profile."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatedUser = await updateProfile({
        name,
        username,
        ...(password ? { password } : {}),
      });

      onProfileUpdated(updatedUser);
      setSuccess("Profile updated successfully.");
      setPassword("");
      await loadProfile();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to update your profile."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">My profile</p>
          <h1>Your account</h1>
          <p className="section-copy">Update your basic details here.</p>
        </div>
      </div>

      <div className="content-grid">
        <div className="surface-card">
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
                <input value={user.email} disabled />
              </label>
              <label>
                New password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Leave blank to keep your current password"
                />
              </label>
            </div>
            <div className="badge-row">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
            </div>
            {error ? <p className="form-error">{error}</p> : null}
            {success ? <p className="form-success">{success}</p> : null}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </div>

        <aside className="surface-card side-panel">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Account history</p>
              <h2>Activity</h2>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading profile...</div>
          ) : !profile ? (
            <div className="empty-state">Profile details are not available.</div>
          ) : (
            <dl className="detail-list">
              <div>
                <dt>Created</dt>
                <dd>{new Date(profile.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{new Date(profile.updatedAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Created by</dt>
                <dd>{profile.createdBy ? `${profile.createdBy.name} (${profile.createdBy.email})` : "Self-registered"}</dd>
              </div>
              <div>
                <dt>Last updated by</dt>
                <dd>{profile.updatedBy ? `${profile.updatedBy.name} (${profile.updatedBy.email})` : "Not recorded"}</dd>
              </div>
            </dl>
          )}
        </aside>
      </div>
    </section>
  );
}
