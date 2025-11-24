import React from "react";
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
// Ajusta la ruta de importación según tu estructura real
import { RegisterPage } from "./domains/auth/ui/RegisterPage"; 

import { DijkstraPage } from "./domains/routing/ui/DijkstraPage";
import { FloydPage } from "./domains/routing/ui/FloydPage";

import "./domains/trade/ui/TradeDashboard.css";
import "./components/Sidebar.css";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
                                                                   children,
                                                               }) => {
    // Nota: Es mejor usar useAuthStore si puedes, pero localStorage funciona
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    const location = useLocation();

    if (!token) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname }}
            />
        );
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
                {/* ERROR CORREGIDO: RegisterPage eliminado de aquí (zona privada) */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </main>
    </div>
);

// Cambiamos a export default para que coincida con main.tsx
const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* === ZONA PÚBLICA === */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} /> {/* <-- AGREGADO AQUÍ */}

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