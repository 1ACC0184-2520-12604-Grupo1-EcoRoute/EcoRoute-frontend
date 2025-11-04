import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardPage } from "../../pages/DashboardPage";
import { LoginPage } from "../../pages/LoginPage";
import { RegisterPage } from "../../pages/RegisterPage";
import { ReportsPage } from "@domains/reports/ui/ReportsPage";
import { JSX } from "react";
import { Sidebar } from "../../components/Sidebar";

// Layout con Sidebar visible en todas las vistas internas
const AppLayout = ({ children }: { children: JSX.Element }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-content">{children}</main>
        </div>
    );
};

// Ruta protegida: revisa si existe sesión activa
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const isLoggedIn = sessionStorage.getItem("loggedIn") === "true";
    return isLoggedIn ? children : <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => (
    <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rutas internas con Sidebar */}
        <Route
            path="/"
            element={
                <ProtectedRoute>
                    <AppLayout>
                        <DashboardPage />
                    </AppLayout>
                </ProtectedRoute>
            }
        />
        <Route
            path="/reports"
            element={
                <ProtectedRoute>
                    <AppLayout>
                        <ReportsPage />
                    </AppLayout>
                </ProtectedRoute>
            }
        />

        {/* Ruta desconocida → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
);
