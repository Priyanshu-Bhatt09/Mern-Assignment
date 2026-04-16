import { useEffect, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import RoleBadge from "../components/RoleBadge";
import StatusBadge from "../components/StatusBadge";
import UserModal from "../components/UserModal";
import { getApiErrorMessage } from "../services/api";
import type { AuthUser } from "../services/auth";
import { createUser, deleteUser, getUserById, getUsers, updateUser } from "../services/users";
import type { PaginationMeta, UserDetail, UserRole, UserStatus, UserSummary } from "../types/user";

interface UsersPageProps {
  user: AuthUser;
}

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 8,
  totalItems: 0,
  totalPages: 1,
};

export default function UsersPage({ user }: UsersPageProps) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [confirmUser, setConfirmUser] = useState<UserSummary | null>(null);

  const canCreate = user.role === "Admin";
  const canEditRole = user.role === "Admin";

  async function loadUserDetails(id: string) {
    setDetailLoading(true);

    try {
      const detail = await getUserById(id);
      setSelectedUser(detail);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load user details."));
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadUsers(page = 1) {
    setLoading(true);
    setError("");

    try {
      const response = await getUsers({
        q: query,
        role: roleFilter,
        status: statusFilter,
        page,
        limit: pagination.limit,
      });

      setUsers(response.items);
      setPagination(response.pagination);

      if (response.items.length === 0) {
        setSelectedUser(null);
        return;
      }

      if (!selectedUser || !response.items.some((item) => item.id === selectedUser.id)) {
        await loadUserDetails(response.items[0].id);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load users."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, roleFilter, statusFilter]);

  async function handleSave(payload: {
    name: string;
    username: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    password?: string;
  }) {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, payload);
      } else {
        await createUser({
          ...payload,
          password: payload.password ?? "",
        });
      }

      const editedUserId = editingUser?.id;
      setModalOpen(false);
      setEditingUser(null);
      await loadUsers(editingUser ? pagination.page : 1);

      if (editedUserId) {
        await loadUserDetails(editedUserId);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to save user."));
    }
  }

  async function handleDeactivate() {
    if (!confirmUser) {
      return;
    }

    const userId = confirmUser.id;

    try {
      await deleteUser(userId);
      setConfirmUser(null);
      await loadUsers(pagination.page);

      if (selectedUser?.id === userId) {
        await loadUserDetails(userId);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to deactivate user."));
    }
  }

  const visibleRoles = user.role === "Admin" ? ["", "Admin", "Manager", "User"] : ["", "Manager", "User"];

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Users</p>
          <h1>Manage users</h1>
          <p className="section-copy">Search, filter, and update accounts.</p>
        </div>
        {canCreate ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditingUser(null);
              setModalOpen(true);
            }}
          >
            Add user
          </button>
        ) : null}
      </div>

      <div className="surface-card">
        <form
          className="toolbar"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(searchInput.trim());
          }}
        >
          <label className="search-field">
            <span>Search</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name, email, or username"
            />
          </label>
          <label>
            <span>Role</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | "")}>
              {visibleRoles.map((role) => (
                <option key={role || "all"} value={role}>
                  {role || "All roles"}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as UserStatus | "")}>
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
          <div className="toolbar-actions">
            <button type="submit" className="btn btn-primary">
              Apply
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchInput("");
                setQuery("");
                setRoleFilter("");
                setStatusFilter("");
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="content-grid">
        <div className="surface-card">
          <div className="list-header">
            <div>
              <p className="eyebrow">Results</p>
              <h2>{pagination.totalItems} users</h2>
            </div>
            <p className="section-copy">
              Page {pagination.page} of {pagination.totalPages}
            </p>
          </div>

          {loading ? (
            <div className="empty-state">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">No users found.</div>
          ) : (
            <div className="user-list">
              {users.map((item) => {
                const canEdit =
                  user.role === "Admin" || (user.role === "Manager" && item.role !== "Admin" && item.id !== user.id);

                return (
                  <article key={item.id} className="user-card">
                    <div className="user-card-main">
                      <div>
                        <h3>{item.name}</h3>
                        <p>
                          @{item.username ?? "no-username"} | {item.email}
                        </p>
                      </div>
                      <div className="badge-row">
                        <RoleBadge role={item.role} />
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                    <div className="user-card-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => void loadUserDetails(item.id)}>
                        Details
                      </button>
                      {canEdit ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setEditingUser(item);
                            setModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                      ) : null}
                      {user.role === "Admin" && item.id !== user.id && item.status === "Active" ? (
                        <button type="button" className="btn btn-danger" onClick={() => setConfirmUser(item)}>
                          Deactivate
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="pagination-row">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pagination.page <= 1}
              onClick={() => void loadUsers(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => void loadUsers(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>

        <aside className="surface-card side-panel">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Audit view</p>
              <h2>Details</h2>
            </div>
          </div>

          {detailLoading ? (
            <div className="empty-state">Loading details...</div>
          ) : !selectedUser ? (
            <div className="empty-state">Select a user to see details.</div>
          ) : (
            <div className="detail-stack">
              <div className="detail-head">
                <div>
                  <h3>{selectedUser.name}</h3>
                  <p>
                    @{selectedUser.username ?? "no-username"} | {selectedUser.email}
                  </p>
                </div>
                <div className="badge-row">
                  <RoleBadge role={selectedUser.role} />
                  <StatusBadge status={selectedUser.status} />
                </div>
              </div>
              <dl className="detail-list">
                <div>
                  <dt>Created</dt>
                  <dd>{new Date(selectedUser.createdAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{new Date(selectedUser.updatedAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Created by</dt>
                  <dd>{selectedUser.createdBy ? `${selectedUser.createdBy.name} (${selectedUser.createdBy.email})` : "System / self"}</dd>
                </div>
                <div>
                  <dt>Last updated by</dt>
                  <dd>{selectedUser.updatedBy ? `${selectedUser.updatedBy.name} (${selectedUser.updatedBy.email})` : "Not recorded"}</dd>
                </div>
              </dl>
            </div>
          )}
        </aside>
      </div>

      <UserModal
        key={`${editingUser?.id ?? "create"}-${modalOpen ? "open" : "closed"}`}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
        onSave={(payload) => void handleSave(payload)}
        user={editingUser}
        isEdit={Boolean(editingUser)}
        canEditRole={canEditRole}
      />

      <ConfirmDialog
        open={Boolean(confirmUser)}
        title="Deactivate this user?"
        message="The user will stay in the system, but they will not be able to log in."
        onConfirm={() => void handleDeactivate()}
        onCancel={() => setConfirmUser(null)}
        confirmLabel="Deactivate"
      />
    </section>
  );
}
