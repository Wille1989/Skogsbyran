import { useAuth } from '../data/auth.hooks.ts';
import "./Form.css";

export function AuthPage() {
  const {
    loading,
    form,
    successMessage,
    errorMessage,
    onLogin,
    onChange,
  } = useAuth();

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
