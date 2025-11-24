import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getSession } from "../../auth/model/authStore";
import "./ReportsPage.css";

const API_BASE =
    (import.meta as any).env?.VITE_API_BASE || "https://ecoroute-backend-production.up.railway.app";

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
    
    // --- ESTADOS PARA FILTROS ---
    const [dateOrder, setDateOrder] = useState<"desc" | "asc">("desc");
    const [moduleFilter, setModuleFilter] = useState<string>("all");

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

    // --- LÓGICA DE FILTRADO Y ORDENAMIENTO (useMemo) ---
    const filteredReports = useMemo(() => {
        let processed = [...reports];

        // 1. Filtrar por Módulo (Algoritmo)
        if (moduleFilter !== "all") {
            processed = processed.filter(
                (r) => (r.algorithm || "").toLowerCase() === moduleFilter.toLowerCase()
            );
        }

        // 2. Ordenar por Fecha
        processed.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            
            if (dateOrder === "asc") {
                return dateA - dateB; // Más antiguo primero
            } else {
                return dateB - dateA; // Más reciente primero
            }
        });

        return processed;
    }, [reports, dateOrder, moduleFilter]);

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

        const ctx = {
            algorithm: algo,
            title: report.title,
            summary: report.result_summary,
        };

        localStorage.setItem(
            "selectedReportContext",
            JSON.stringify(ctx)
        );

        navigate("/");
    };

    return (
        <div className="td-card reports-wrapper">
            <div className="reports-top-bar">
                <h2>Historial de Reportes</h2>
                
                {/* --- BARRA DE FILTROS --- */}
                <div className="filters-container">
                    <div className="filter-group">
                        <label>Fecha</label>
                        <div className="select-wrapper">
                            <select 
                                value={dateOrder} 
                                onChange={(e) => setDateOrder(e.target.value as "asc" | "desc")}
                            >
                                <option value="desc">Más recientes</option>
                                <option value="asc">Más antiguos</option>
                            </select>
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>Módulo</label>
                        <div className="select-wrapper">
                            <select 
                                value={moduleFilter} 
                                onChange={(e) => setModuleFilter(e.target.value)}
                            >
                                <option value="all">Todos</option>
                                <option value="dijkstra">Dijkstra</option>
                                <option value="floyd-warshall">Floyd-Warshall</option>
                                <option value="kruskal">Kruskal</option>
                                <option value="bellman-ford">Bellman-Ford</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {loading && <p className="td-msg">Cargando reportes...</p>}
            {error && <p className="td-msg td-msg-error">❌ {error}</p>}

            {!loading && !error && filteredReports.length === 0 && (
                <div className="empty-state">
                    <p className="td-msg">
                        {reports.length === 0 
                            ? "Aún no tienes reportes generados." 
                            : "No hay reportes que coincidan con los filtros."}
                    </p>
                </div>
            )}

            <div className="reports-grid">
                {filteredReports.map((r) => {
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
                                        {algo.toUpperCase().replace("-", " ")}
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