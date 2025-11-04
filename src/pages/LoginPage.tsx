import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css";

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error("Credenciales inválidas");

      // Simula login correcto sin tokens
      await response.json();
      sessionStorage.setItem("loggedIn", "true");
      sessionStorage.setItem("username", username);

      setMessage("✅ Inicio de sesión exitoso. Redirigiendo...");
      setTimeout(() => navigate("/", { replace: true }), 900);
    } catch (err: any) {
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <main className="login-page">
        <div className="bg-grid" aria-hidden="true" />

        <section className="card">
          <header className="brand">
            <div className="brand__logo" aria-hidden="true">
              <svg viewBox="0 0 48 48" width="28" height="28">
                <defs>
                  <linearGradient id="gr" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#2563eb" />
                    <stop offset="1" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                <rect
                    x="4"
                    y="6"
                    width="40"
                    height="28"
                    rx="6"
                    fill="none"
                    stroke="url(#gr)"
                    strokeWidth="2"
                />
                <circle cx="12" cy="16" r="3" fill="#22c55e" />
                <circle cx="30" cy="22" r="3" fill="#2563eb" />
                <path
                    d="M12 16 C18 16, 20 20, 22 28 S30 22, 36 20"
                    fill="none"
                    stroke="url(#gr)"
                    strokeWidth="2"
                />
              </svg>
            </div>
            <div>
              <h1 className="title">EcoRoute</h1>
              <p className="subtitle">Rutas óptimas, menor costo logístico</p>
            </div>
          </header>

          {message && (
              <p
                  className={`login-message ${
                      message.startsWith("✅") ? "success" : "error"
                  }`}
              >
                {message}
              </p>
          )}

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
            <span className="field__icon">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                    d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5Z"
                    fill="currentColor"
                />
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

            <div className="field">
            <span className="field__icon">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                    d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Zm-6 0V7a2 2 0 0 1 4 0v2Z"
                    fill="currentColor"
                />
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

            <div className="form__row">
              <label className="check">
                <input type="checkbox" />
                <span className="check__ctrl" />
                Recuérdame
              </label>
              <a href="#" className="link-muted">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? <span className="spinner" /> : "Iniciar sesión"}
            </button>

            <div className="divider">
              <span>o continúa con</span>
            </div>

            <div className="alt-actions">
              <button type="button" className="alt-btn">
                ↪ Google
              </button>
              <button type="button" className="alt-btn">
                🐙 GitHub
              </button>
            </div>

            <p className="register">
              ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
            </p>
          </form>
        </section>
      </main>
  );
};
