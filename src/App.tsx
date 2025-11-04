// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage"; // import nombrado (como tu archivo)
import DijkstraPage from "./pages/DijkstraPage";
import FloydWarshallPage from "./pages/FloydWarshallPage";
import ReportsPage from "./pages/ReportsPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
      <BrowserRouter>
        <Routes>
          {/* Públicas (sin sidebar) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Internas (con Sidebar) */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dijkstra" element={<DijkstraPage />} />
            <Route path="/floyd-warshall" element={<FloydWarshallPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
  );
}
