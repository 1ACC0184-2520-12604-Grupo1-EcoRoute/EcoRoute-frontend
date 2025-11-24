import React, { useEffect } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import { TradeDashboard } from "./domains/trade/ui/TradeDashboard";
import { ReportsPage } from "./domains/reports/ui/ReportsPage";
import { ProfilePage } from "./domains/profile/ui/ProfilePage";
import { LoginPage } from "./domains/auth/ui/LoginPage";
import { RegisterPage } from "./domains/auth/ui/RegisterPage"; 

import { DijkstraPage } from "./domains/routing/ui/DijkstraPage";
import { FloydPage } from "./domains/routing/ui/FloydPage";

import "./domains/trade/ui/TradeDashboard.css";
import "./components/Sidebar.css";

// Componente para proteger rutas
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    const location = useLocation();

    if (!token) {
        console.warn("⛔ Acceso denegado a ruta privada:", location.pathname);
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return <>{children}</>;
};

const AppShell: React.FC = () => (
    <div className="app-shell">
        <Sidebar />
        <main className="app-main">
            <Routes>
                <Route path="/" element={<TradeDashboard />} />
                <Route path="/dijkstra" element={<DijkstraPage />} />
                <Route path="/floyd-warshall" element={<FloydPage />} />
                <Route path="/reportes" element={<ReportsPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </main>
    </div>
);

const App: React.FC = () => {
    // Este efecto nos confirmará si estás cargando la versión nueva
    useEffect(() => {
        console.log("🚀 APLICACIÓN INICIADA - VERSIÓN DEBUG V3");
        console.log("Ruta actual:", window.location.pathname);
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                {/* === ZONA PÚBLICA === */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* CAMBIO TEMPORAL: Usamos /registro-nuevo para evitar caché */}
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/registro-nuevo" element={<RegisterPage />} />

                {/* === ZONA PRIVADA === */}
                <Route
                    path="/*"
                    element={
                        <PrivateRoute>
                            <AppShell />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
};

export default App;