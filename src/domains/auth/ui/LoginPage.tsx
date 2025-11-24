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
            // Guardamos token y usuario
            saveSession(data.access_token, username);
            
            setMessage("✅ Inicio de sesión exitoso. Redirigiendo...");
            // Esperamos un poco para que el usuario lea el mensaje
            setTimeout(() => navigate("/", { replace: true }), 700);
        } catch (err: any) {
            setMessage("❌ " + (err.message || "Error al iniciar sesión"));
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
                            title={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                            style={{
                                position: "absolute",
                                right: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "1.2rem",
                                zIndex: 10
                            }}
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
                        <button type="button" className="btn btn-google" onClick={handleGoogleLogin}>
                            <span className="google-icon" />
                            Google
                        </button>
                    </div>

                    <p className="register" style={{ marginTop: "1rem", textAlign: "center" }}>
                        ¿No tienes cuenta? <Link to="/register" style={{ fontWeight: "bold" }}>Regístrate aquí</Link>
                    </p>
                </form>
            </section>
        </main>
    );
};