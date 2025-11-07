import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveSession } from "../model/authStore";
import "./LoginPage.css";

export const OauthSuccessPage: React.FC = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState(
        "Procesando autenticación con Google..."
    );

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const username = params.get("username") || "usuario";

        console.log("[OauthSuccess] params", {
            hasToken: !!token,
            username,
        });

        if (!token) {
            setStatus(
                "No se recibió token en la URL. Verifica la configuración del backend."
            );
            return;
        }

        saveSession(token, username);
        setStatus("Autenticación exitosa. Redirigiendo al panel...");

        setTimeout(() => {
            navigate("/", { replace: true });
        }, 800);
    }, [navigate]);

    return (
        <main className="login-page">
            <div className="bg-grid" aria-hidden="true" />
            <section className="card">
                <p className="login-message success">{status}</p>
            </section>
        </main>
    );
};
