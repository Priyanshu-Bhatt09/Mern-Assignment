import { useEffect, useState } from "react";
import { BrowserRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import type { AuthUser } from "./services/auth";
import { clearToken, fetchCurrentUser, loadToken } from "./services/auth";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ProfilePage from "./pages/ProfilePage";
import Register from "./pages/Register";
import UsersPage from "./pages/UsersPage";

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const token = loadToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch {
        clearToken();
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, []);

  const handleLogout = () => {
    clearToken();
    setUser(null);
  };

  const canManageUsers = user?.role === "Admin" || user?.role === "Manager";

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-card">Loading workspace...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-frame">
        <header className="app-header">
          <div className="brand">
            <p className="eyebrow">Purple Merit</p>
            <h1>MERN User Management</h1>
          </div>
          <nav className="header-actions">
            {user ? (
              <>
                <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                  Dashboard
                </NavLink>
                {canManageUsers ? (
                  <NavLink to="/users" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                    Users
                  </NavLink>
                ) : null}
                <NavLink to="/profile" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                  My Profile
                </NavLink>
                <button type="button" className="btn btn-secondary" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                  Login
                </NavLink>
                <NavLink to="/register" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
            <Route
              path="/login"
              element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={setUser} />}
            />
            <Route
              path="/register"
              element={user ? <Navigate to="/dashboard" replace /> : <Register onRegister={setUser} />}
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute user={user}>
                  <Dashboard user={user!} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute user={user} allowedRoles={["Admin", "Manager"]}>
                  <UsersPage user={user!} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute user={user}>
                  <ProfilePage user={user!} onProfileUpdated={setUser} />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
