import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginRequest, getGoogleAuthUrl } from "../api/authApi";
import { saveSession } from "../model/authStore";
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
            const data = await loginRequest(username, password);
            saveSession(data.access_token, username);
            setMessage("✅ Inicio de sesión exitoso. Redirigiendo...");
            setTimeout(() => navigate("/", { replace: true }), 700);
        } catch (err: any) {
            setMessage("❌ " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const url = getGoogleAuthUrl();
        window.location.href = url;
    };

    return (
        <main className="login-page">
            <div className="bg-grid" aria-hidden="true" />
            <section className="card">
                <header className="brand">
                    <div className="brand__logo" aria-hidden="true" />
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
                        <button type="button" className="alt-btn" onClick={handleGoogleLogin}>
                            ↪ Google
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
