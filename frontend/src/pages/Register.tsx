import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/auth";
import type { AuthUser } from "../services/auth";
import { getApiErrorMessage } from "../services/api";

interface RegisterProps {
  onRegister: (user: AuthUser) => void;
}

export default function Register({ onRegister }: RegisterProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const user = await register({ name, username, email, password });
      onRegister(user);
      navigate("/dashboard");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Registration failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-hero">
        <p className="eyebrow">Register</p>
        <h1>Create your account</h1>
        <p>Fill in the details below.</p>
      </div>
      <div className="auth-card">
        <h2>Create your account</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Full name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
            {submitting ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="form-footnote">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
}
