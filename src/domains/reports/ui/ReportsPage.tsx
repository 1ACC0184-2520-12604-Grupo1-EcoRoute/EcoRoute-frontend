import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession } from "../../auth/model/authStore";
import "./ReportsPage.css";

const API_BASE = "http://127.0.0.1:8000";

type Report = {
    id: number;
    title: string;
    algorithm: string; // "dijkstra" | "kruskal" | "tsp" | "flow" | etc
    description: string;
    result_summary: string;
    created_at: string;
};

export const ReportsPage: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const navigate = useNavigate();

    const loadReports = async () => {
        setLoading(true);
        setError("");

        try {
            const { token } = getSession();
            if (!token) {
                setError("No hay sesión activa.");
                setReports([]);
                return;
            }

            const res = await fetch(`${API_BASE}/reports/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || "No se pudieron cargar los reportes.");
            }

            const data = await res.json();
            setReports(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al cargar reportes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const handleHide = async (id: number) => {
        try {
            const { token } = getSession();
            if (!token) return;

            const res = await fetch(`${API_BASE}/reports/${id}/hide`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || "No se pudo ocultar el reporte.");
            }

            setReports((prev) => prev.filter((r) => r.id !== id));
        } catch (err) {
            console.error(err);
            alert("Error al ocultar el reporte.");
        }
    };

    const handleViewOnDashboard = (report: Report) => {
        const algo = (report.algorithm || "").toLowerCase();

        // Guardamos SOLO este contexto, es lo que el Dashboard va a leer
        const ctx = {
            algorithm: algo, // "flow" | "dijkstra" | "kruskal" | "tsp"
            title: report.title,
            summary: report.result_summary,
        };

        localStorage.setItem(
            "selectedReportContext",
            JSON.stringify(ctx)
        );

        // No usamos más selectedAlgorithm aquí.
        navigate("/");
    };

    return (
        <div className="td-card reports-wrapper">
            <h2>Reportes</h2>

            {loading && <p className="td-msg">Cargando reportes...</p>}
            {error && <p className="td-msg td-msg-error">❌ {error}</p>}

            {!loading && !error && reports.length === 0 && (
                <p className="td-msg">Aún no tienes reportes generados.</p>
            )}

            <div className="reports-grid">
                {reports.map((r) => {
                    const expanded = expandedId === r.id;
                    const algo = (r.algorithm || "").toLowerCase();

                    return (
                        <article
                            key={r.id}
                            className={`report-card ${expanded ? "expanded" : ""}`}
                            onClick={() =>
                                setExpandedId((prev) => (prev === r.id ? null : r.id))
                            }
                        >
                            <header className="report-header">
                                <div>
                                    <h3>{r.title}</h3>
                                    <span className={`algo-tag algo-${algo}`}>
                    {algo.toUpperCase()}
                  </span>
                                </div>
                                <time>
                                    {new Date(r.created_at).toLocaleString("es-PE", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                    })}
                                </time>
                            </header>

                            <p className="report-summary">{r.result_summary}</p>

                            {expanded && (
                                <div className="report-details">
                                    <p>{r.description}</p>
                                    <div
                                        className="report-actions"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            className="td-primary-btn"
                                            onClick={() => handleViewOnDashboard(r)}
                                        >
                                            Ver en dashboard
                                        </button>
                                        <button
                                            className="td-secondary-btn"
                                            onClick={() => handleHide(r.id)}
                                        >
                                            Ocultar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </div>
    );
};
