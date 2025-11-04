import { useMemo, useState } from "react";
import "./TradeDashboard.css";

const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

type RouteItem = { destination: string; cost: number };

export default function DijkstraPage(){
    const [origin, setOrigin] = useState("");
    const [loading, setLoading] = useState(false);
    const [routes, setRoutes] = useState<RouteItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const token = useMemo(() => localStorage.getItem("token") ?? "", []);

    const analyze = async () => {
        setLoading(true);
        setError(null);
        setRoutes([]);

        try{
            const res = await fetch(`${API}/api/v1/analyze-route/${encodeURIComponent(origin)}`, {
                headers: { "Authorization": token ? `Bearer ${token}` : "" }
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data?.error || "No se pudo analizar la ruta");
            setRoutes(data.routes ?? []);
        }catch(e:any){
            setError(e.message);
        }finally{
            setLoading(false);
        }
    };

    return (
        <section className="page">
            <h1 className="page__title">Dijkstra</h1>
            <p className="page__subtitle">Camino de costo mínimo desde un origen según tu dataset (precio total + arancel).</p>

            <div className="grid grid--2">
                <div className="card">
                    <div className="panel">
                        <div className="panel__title">Parámetros</div>
                    </div>

                    <div className="form">
                        <div className="row">
                            <input
                                className="input"
                                placeholder="Origen (ej. China, Alemania...)"
                                value={origin}
                                onChange={(e)=>setOrigin(e.target.value)}
                            />
                            <button className="btn" onClick={analyze} disabled={!origin || loading}>
                                {loading ? <span className="loader" /> : "Analizar"}
                            </button>
                        </div>
                        <div className="chips">
                            <span className="chip">Costo = total_price × (1 + tariff/100)</span>
                            <span className="chip">Algoritmo: Dijkstra</span>
                        </div>
                        {error && <div className="msg msg--err">{error}</div>}
                        {(!loading && !error && routes.length === 0) && (
                            <div className="msg">Ingresa un origen y ejecuta el análisis.</div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="panel">
                        <div className="panel__title">Resultados</div>
                        <div className="panel__actions">
                            <button
                                className="btn btn--ghost"
                                onClick={()=>{
                                    if(routes.length===0) return;
                                    const csv = "destination,cost\n" + routes.map(r=>`${r.destination},${r.cost}`).join("\n");
                                    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url; a.download = "dijkstra_results.csv"; a.click();
                                    URL.revokeObjectURL(url);
                                }}
                                disabled={routes.length===0}
                            >Exportar CSV</button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="msg">Procesando…</div>
                    ) : (
                        <table className="table">
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Destino</th>
                                <th>Costo total (USD)</th>
                            </tr>
                            </thead>
                            <tbody>
                            {routes.map((r,idx)=>(
                                <tr key={idx}>
                                    <td>{idx+1}</td>
                                    <td>{r.destination}</td>
                                    <td>{r.cost?.toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                                </tr>
                            ))}
                            {routes.length===0 && (
                                <tr>
                                    <td colSpan={3}>Sin datos aún</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </section>
    );
}
