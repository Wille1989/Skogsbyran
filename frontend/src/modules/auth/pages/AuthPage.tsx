import { useAuth } from '../hooks/auth.hooks.ts';
import "./AuthPage.css";
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { Navigate } from 'react-router-dom';

export function AuthPage() {
  const {
    loading,
    isAdmin,
    isAuthPending,
    form,
    successMessage,
    errorMessage,
    onLogin,
    onChange,
  } = useAuth();

  if (isAuthPending) return <LoadingSpinner />;
  if (isAdmin) return <Navigate to="/admin" replace />;

  return (
    <div className="auth-page">
      <form onSubmit={onLogin} className="form auth-form">
        <h1 className="auth-title">Logga in</h1>

        <div className="form-field">
          <label htmlFor="email">E-post</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="namn@exempel.se"
            value={form.email}
            onChange={onChange}
            autoComplete="email"
            aria-describedby={errorMessage ? "auth-form-error" : undefined}
          />
        </div>

        <div className="form-field">
          <label htmlFor="password">Lösenord</label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="********"
            value={form.password}
            onChange={onChange}
            autoComplete="current-password"
            aria-describedby={errorMessage ? "auth-form-error" : undefined}
          />
        </div>

        {errorMessage ? (
          <p id="auth-form-error" className="form-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="form-success" role="status">
            {successMessage}
          </p>
        ) : null}

        <div className="form-actions">
          <button type="submit" className="form-submit" disabled={loading}>
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </div>
      </form>
    </div>
  );
}
