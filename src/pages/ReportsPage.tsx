// src/domains/reports/ui/ReportsPage.tsx
import { useMemo, useState } from "react";
import "./TradeDashboard.css";

const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export default function ReportsPage() {
    const token = useMemo(() => localStorage.getItem("token") ?? "", []);
    const [msg, setMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const download = async (path: string, filename: string) => {
        setLoading(true);
        setMsg(null);
        try {
            const res = await fetch(`${API}${path}`, {
                headers: { Authorization: token ? `Bearer ${token}` : "" },
            });
            if (!res.ok) throw new Error("No se pudo generar el reporte");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            setMsg("Reporte descargado correctamente.");
        } catch (e: any) {
            setMsg(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="page">
            <h1 className="page__title">Reportes</h1>
            <p className="page__subtitle">Exporta resultados y evidencia del análisis.</p>

            <div className="grid grid--2">
                <div className="card">
                    <div className="panel">
                        <div className="panel__title">Descargas rápidas</div>
                    </div>
                    <div className="grid">
                        <button
                            className="btn"
                            onClick={() => download("/api/v1/report/daily-csv", "ecoroute_daily.csv")}
                            disabled={loading}
                        >
                            {loading ? <span className="loader" /> : "CSV diario (dataset procesado)"}
                        </button>

                        <button
                            className="btn btn--ghost"
                            onClick={() => download("/api/v1/report/summary-pdf", "ecoroute_summary.pdf")}
                            disabled={loading}
                        >
                            {loading ? <span className="loader" /> : "Resumen PDF (métricas clave)"}
                        </button>

                        <div className="chips">
                            <span className="chip">Formato CSV/PDF</span>
                            <span className="chip">Incluye costos y rutas</span>
                        </div>

                        {msg && (
                            <div className={`msg ${msg.startsWith("Error") ? "msg--err" : "msg--ok"}`}>
                                {msg}
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="panel">
                        <div className="panel__title">Métricas sugeridas</div>
                    </div>
                    <div className="kpis">
                        <div className="kpi">
                            <div className="kpi__val">Tarifas ponderadas</div>
                            <div className="kpi__lab">Promedio por origen/destino</div>
                        </div>
                        <div className="kpi">
                            <div className="kpi__val">Top 5 rutas</div>
                            <div className="kpi__lab">Menor costo efectivo</div>
                        </div>
                        <div className="kpi">
                            <div className="kpi__val">Productos críticos</div>
                            <div className="kpi__lab">Por volumen y valor</div>
                        </div>
                        <div className="kpi">
                            <div className="kpi__val">Mes pico</div>
                            <div className="kpi__lab">Actividad por fecha</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
