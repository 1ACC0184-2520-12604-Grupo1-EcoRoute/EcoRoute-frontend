import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, clearSession } from "../../auth/model/authStore";
import "./ProfilePage.css";

type User = {
    id: number;
    username: string;
    email: string;
};

export const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { token, username: storedUsername } = getSession();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        const fetchMe = async () => {
            try {
                const res = await fetch("https://ecoroute-backend-production.up.railway.app/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (res.status === 401) {
                    // Token inválido/expirado
                    clearSession();
                    navigate("/login", { replace: true });
                    return;
                }

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.detail || "No se pudo obtener el perfil");
                }

                setUser(data);
            } catch (error: any) {
                setErr(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMe();
    }, [token, navigate]);

    if (loading) {
        return (
            <div className="profile-card">
                <p className="profile-label">Cargando perfil...</p>
            </div>
        );
    }

    if (err) {
        return (
            <div className="profile-card">
                <p className="profile-error">❌ {err}</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-card">
                <p className="profile-error">
                    No hay información de usuario disponible.
                </p>
            </div>
        );
    }

    return (
        <div className="profile-card">
            <h2>Perfil</h2>
            <p className="profile-sub">
                Información de tu cuenta en EcoRoute.
            </p>

            <div className="profile-grid">
                <div>
                    <span className="profile-label">Usuario</span>
                    <p className="profile-value">
                        {user.username}
                        {storedUsername && storedUsername !== user.username
                            ? ` (sesión: ${storedUsername})`
                            : ""}
                    </p>
                </div>
                <div>
                    <span className="profile-label">Correo</span>
                    <p className="profile-value">{user.email}</p>
                </div>
            </div>
        </div>
    );
};
