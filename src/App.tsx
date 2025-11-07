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
import { ProfilePage } from "./domains/profile/ui/ProfilePage"; // tu perfil actual
import { LoginPage } from "./domains/auth/ui/LoginPage";

import { DijkstraPage } from "./domains/routing/ui/DijkstraPage";
import { FloydPage } from "./domains/routing/ui/FloydPage";

import "./domains/trade/ui/TradeDashboard.css";
import "./components/Sidebar.css";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
                                                                   children,
                                                               }) => {
    const token = localStorage.getItem("access_token");
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
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </main>
    </div>
);

export const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
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
