import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearSession } from "../domains/auth/model/authStore";
import "./Sidebar.css";

const Sidebar: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        clearSession();
        navigate("/login", { replace: true });
    };

    return (
        <aside className="sidebar">
            <h2 className="sidebar-title">EcoRoute</h2>
            <nav className="sidebar-nav">
                <NavLink to="/" end className="nav-item">
                    Dashboard
                </NavLink>
                <NavLink to="/dijkstra" className="nav-item">
                    Dijkstra
                </NavLink>
                <NavLink to="/floyd-warshall" className="nav-item">
                    Floyd-Warshall
                </NavLink>
                <NavLink to="/reportes" className="nav-item">
                    Reportes
                </NavLink>
                <NavLink to="/perfil" className="nav-item">
                    Perfil
                </NavLink>
            </nav>

            <button onClick={handleLogout} className="logout-btn">
                Cerrar sesión
            </button>
        </aside>
    );
};

export default Sidebar;
