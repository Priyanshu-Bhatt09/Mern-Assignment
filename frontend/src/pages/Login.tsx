import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/auth";
import type { AuthUser } from "../services/auth";
import { getApiErrorMessage } from "../services/api";

interface LoginProps {
  onLogin: (user: AuthUser) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = await login(identifier, password);
      onLogin(user);
      navigate("/dashboard");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Login failed. Please check your credentials."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-hero">
        <p className="eyebrow">Login</p>
        <h1>Welcome back</h1>
        {/* <p>Sign in to continue.</p> */}
      </div>
      <div className="auth-card">
        {/* <h2>Login</h2> */}
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Email or username
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="form-footnote px-1 py-2">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </section>
  );
}
