import React, { JSX } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../../domains/auth/ui/LoginPage";
import { RegisterPage } from "../../domains/auth/ui/RegisterPage";
import { OauthSuccessPage } from "../../domains/auth/ui/OauthSuccessPage";
import { isLoggedIn } from "../../domains/auth/model/authStore";
import { TradeDashboard } from "../../domains/trade/ui/TradeDashboard";

// Componente para proteger rutas (si no está logueado, manda al login)
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    return isLoggedIn() ? children : <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => (
    <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/oauth-success" element={<OauthSuccessPage />} />

        {/* Ruta Privada (Dashboard) */}
        <Route
            path="/"
            element={
                <PrivateRoute>
                    <TradeDashboard />
                </PrivateRoute>
            }
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);