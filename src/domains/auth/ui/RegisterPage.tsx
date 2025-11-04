import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./RegisterPage.css";

export const RegisterPage: React.FC = () => {
  const [username, setUsername]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [message, setMessage]     = useState("");
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Error en el registro");
      }

      const data = await response.json();
      setMessage(`✅ Usuario ${data.username} registrado con éxito. Redirigiendo al login...`);
      setTimeout(() => navigate("/login", { replace: true }), 1000);
    } catch (err: any) {
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <main className="register-page">
        <div className="bg-grid" aria-hidden="true" />

        <section className="card">
          <header className="brand">
            <div className="brand__logo" aria-hidden="true">
              <svg viewBox="0 0 48 48" width="28" height="28">
                <defs>
                  <linearGradient id="gr2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#2563eb" />
                    <stop offset="1" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                <rect x="4" y="6" width="40" height="28" rx="6" fill="none" stroke="url(#gr2)" strokeWidth="2"/>
                <path d="M8 26h32" stroke="url(#gr2)" strokeWidth="2" />
                <circle cx="16" cy="16" r="3" fill="#22c55e"/>
                <circle cx="32" cy="22" r="3" fill="#2563eb"/>
              </svg>
            </div>
            <div>
              <h1 className="title">Crear cuenta</h1>
              <p className="subtitle">Únete a EcoRoute para optimizar tus rutas</p>
            </div>
          </header>

          {message && (
              <div className={`alert ${message.startsWith("✅") ? "alert--success" : "alert--error"}`}>
                <span className="alert__icon">{message.startsWith("✅") ? "✔" : "✖"}</span>
                <span className="alert__text">{message}</span>
              </div>
          )}

          <form className="form" onSubmit={handleSubmit}>
            {/* Usuario */}
            <div className="field">
            <span className="field__icon">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5Z" fill="currentColor"/>
              </svg>
            </span>
              <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder=" "
              />
              <label>Usuario</label>
              <span className="field__ring" />
            </div>

            {/* Email */}
            <div className="field">
            <span className="field__icon">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M20 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Zm0 2-8 5L4 8" fill="currentColor"/>
              </svg>
            </span>
              <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder=" "
              />
              <label>Email</label>
              <span className="field__ring" />
            </div>

            {/* Contraseña */}
            <div className="field">
            <span className="field__icon">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Zm-6 0V7a2 2 0 0 1 4 0v2Z" fill="currentColor"/>
              </svg>
            </span>
              <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder=" "
              />
              <label>Contraseña</label>
              <button
                  type="button"
                  className="toggle-pwd"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label="Mostrar u ocultar contraseña"
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
              <span className="field__ring" />
            </div>
            {/* hint FUERA del .field para no deformar el recuadro */}
            <p className="hint">Mínimo 8 caracteres</p>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? <span className="spinner" /> : "Registrarse"}
            </button>

            <p className="login-link">
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
            </p>
          </form>
        </section>
      </main>
  );
};
