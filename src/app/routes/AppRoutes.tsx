import React, {JSX} from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../../domains/auth/ui/LoginPage";
import { RegisterPage } from "../../domains/auth/ui/RegisterPage";
import { OauthSuccessPage } from "../../domains/auth/ui/OauthSuccessPage";
import { isLoggedIn } from "../../domains/auth/model/authStore";
import { TradeDashboard } from "../../domains/trade/ui/TradeDashboard";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    return isLoggedIn() ? children : <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => (
    <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/oauth-success" element={<OauthSuccessPage />} />

        <Route
            path="/"
            element={
                <PrivateRoute>
                    <TradeDashboard />
                </PrivateRoute>
            }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);
