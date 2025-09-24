import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./RegisterPage.css";

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Error en el registro");
      }

      const data = await response.json();
      setMessage(`✅ Usuario ${data.username} registrado con éxito. Redirigiendo al login...`);

      // Redirigir después de 1 segundo al login
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1000);
    } catch (err: any) {
      setMessage("❌ " + err.message);
    }
  };

  return (
    <div className="register-container">
      <h1>Registro</h1>
      <form className="register-form" onSubmit={handleSubmit}>
        <label>Usuario</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Registrarse</button>
      </form>

      {message && <p className="register-message">{message}</p>}

      <p className="register-login-link">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login">Inicia sesión aquí</Link>
      </p>
    </div>
  );
};
