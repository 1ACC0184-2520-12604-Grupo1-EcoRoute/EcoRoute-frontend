import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem("loggedIn");
        navigate("/login");
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <svg viewBox="0 0 48 48" width="32" height="32">
                    <defs>
                        <linearGradient id="sbgr" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="#22c55e" />
                            <stop offset="1" stopColor="#3b82f6" />
                        </linearGradient>
                    </defs>
                    <rect x="4" y="6" width="40" height="28" rx="6" fill="none" stroke="url(#sbgr)" strokeWidth="2"/>
                    <circle cx="12" cy="16" r="3" fill="#22c55e"/>
                    <circle cx="30" cy="22" r="3" fill="#3b82f6"/>
                    <path d="M12 16 C18 16, 20 20, 22 28 S30 22, 36 20" fill="none" stroke="url(#sbgr)" strokeWidth="2"/>
                </svg>
                <h2>EcoRoute</h2>
            </div>

            <nav className="sidebar-nav">
                <Link
                    to="/"
                    className={location.pathname === "/" ? "active" : ""}
                >
                    🏠 Dashboard
                </Link>
                <Link
                    to="/dijkstra"
                    className={location.pathname === "/dijkstra" ? "active" : ""}
                >
                    🧭 Dijkstra
                </Link>
                <Link
                    to="/floyd"
                    className={location.pathname === "/floyd" ? "active" : ""}
                >
                    🌐 Floyd-Warshall
                </Link>
                <Link
                    to="/reports"
                    className={location.pathname === "/reports" ? "active" : ""}
                >
                    📊 Reportes
                </Link>
                <Link
                    to="/profile"
                    className={location.pathname === "/profile" ? "active" : ""}
                >
                    👤 Perfil
                </Link>
            </nav>

            <div className="sidebar-footer">
                <button onClick={handleLogout}>Cerrar sesión</button>
            </div>
        </aside>
    );
};
