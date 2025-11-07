import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerRequest } from "../api/authApi";
import "./LoginPage.css";

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await registerRequest(username, email, password);
      setMessage("✅ Registro exitoso. Redirigiendo a login...");
      setTimeout(() => navigate("/login"), 900);
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
            <div className="brand__logo" aria-hidden="true" />
            <div>
              <h1 className="title">Crear cuenta</h1>
              <p className="subtitle">Únete a EcoRoute</p>
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

            <div className="field">
              <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder=" "
              />
              <label>Contraseña</label>
              <span className="field__ring" />
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? <span className="spinner" /> : "Registrarme"}
            </button>
          </form>
        </section>
      </main>
  );
};
