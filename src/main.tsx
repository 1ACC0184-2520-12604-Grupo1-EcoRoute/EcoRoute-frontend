import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./domains/trade/ui/TradeDashboard.css";
import "./components/Sidebar.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
