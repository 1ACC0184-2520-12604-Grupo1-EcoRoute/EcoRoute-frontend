import { Routes, Route, Navigate } from "react-router-dom";
import { TradeDashboard } from "@domains/trade/ui/pages/TradeDashboard";
import { LoginPage } from "@domains/auth/ui/LoginPage";
import { RegisterPage } from "@domains/auth/ui/RegisterPage";
import { ReportsPage } from "@domains/reports/ui/ReportsPage";
import { JSX } from "react";

// Ruta protegida: revisa si existe token en localStorage
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const AppRoutes: React.FC = () => (
  <Routes>
    {/* Rutas públicas */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    {/* Rutas protegidas (solo accesibles si hay token) */}
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <TradeDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <ProtectedRoute>
          <ReportsPage />
        </ProtectedRoute>
      }
    />

    {/* Si el usuario entra a una ruta desconocida → login */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);
