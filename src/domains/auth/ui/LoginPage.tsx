import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css";

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Credenciales inválidas");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);

      setMessage("✅ Login exitoso, redirigiendo...");
      navigate("/", { replace: true }); // ahora sí va al dashboard
    } catch (err: any) {
      setMessage("❌ " + err.message);
    }
  };

  return (
    <div className="login-container">
      <h1>Login</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <label>Usuario</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Iniciar sesión</button>
      </form>

      {message && <p className="login-message">{message}</p>}

      <p className="login-register-link">
        ¿No tienes cuenta?{" "}
        <Link to="/register">Regístrate aquí</Link>
      </p>
    </div>
  );
};
