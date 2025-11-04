// src/layouts/AppLayout.tsx
import { Outlet } from "react-router-dom";
import {Sidebar} from "../components/Sidebar";
import "./AppLayout.css";

export default function AppLayout() {
    return (
        <div className="eco-shell">
            {/* Bandera temporal para ver si el layout monta */}
            <div className="eco-debug">Layout ON</div>

            <div className="bg-grid" aria-hidden="true" />
            <Sidebar />
            <main className="eco-main">
                <Outlet />
            </main>
        </div>
    );
}
