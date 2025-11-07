import React, { useState, useEffect } from "react";
import { FindOptimalRoute } from "../application/FindOptimalRoute";
import { RouteApiRepository } from "../infrastructure/api/RouteApiRepository";
import { getUsername, clearSession } from "../../auth/model/authStore";
import "./TradeDashboard.css";

export const TradeDashboard: React.FC = () => {
    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");
    const [product, setProduct] = useState("Paneles solares");
    const [result, setResult] = useState<{ path: string[]; cost: number } | null>(
        null
    );
    const [loading, setLoading] = useState(false);
    const [nodes, setNodes] = useState<string[]>([]);

    const repo = new RouteApiRepository();
    const username = getUsername() || "Usuario";

    useEffect(() => {
        fetch("/api/nodes")
            .then((res) => res.json())
            .then((data) => setNodes(data.nodes))
            .catch(() => console.error("No se pudieron cargar los nodos"));
    }, []);

    const handleCompute = async () => {
        setLoading(true);
        try {
            const usecase = new FindOptimalRoute(repo);
            const route = await usecase.execute(origin, destination);
            setResult({
                path: route.path,
                cost: route.cost,
            });
        } catch (err: any) {
            alert("Error: " + (err.message || err));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearSession();
        window.location.href = "/login";
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Trade Dashboard - Bienvenido, {username}</h1>
                <nav className="dashboard-nav">
                    <button onClick={() => (window.location.href = "/reports")}>
                        Ver Reportes
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>
                        Cerrar Sesión
                    </button>
                </nav>
            </header>

            <main className="dashboard-main">
                <section className="dashboard-card">
                    <h2>Calcular ruta óptima</h2>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        <div>
                            <label>Origen</label>
                            <br />
                            <input
                                list="nodes"
                                value={origin}
                                onChange={(e) => setOrigin(e.target.value)}
                                placeholder="Escribe o selecciona origen"
                            />
                        </div>
                        <div>
                            <label>Destino</label>
                            <br />
                            <input
                                list="nodes"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                placeholder="Escribe o selecciona destino"
                            />
                        </div>
                        <div>
                            <label>Producto</label>
                            <br />
                            <input
                                value={product}
                                onChange={(e) => setProduct(e.target.value)}
                            />
                        </div>
                        <div style={{ alignSelf: "end" }}>
                            <button onClick={handleCompute} disabled={loading}>
                                {loading ? "Calculando..." : "Calcular"}
                            </button>
                        </div>
                    </div>

                    <datalist id="nodes">
                        {nodes.map((n) => (
                            <option key={n} value={n} />
                        ))}
                    </datalist>

                    {result && (
                        <div style={{ marginTop: "1rem" }}>
                            <h3>Ruta encontrada</h3>
                            <p>{result.path.join(" → ")}</p>
                            <p>
                                <strong>Costo total (estimado):</strong> {result.cost}
                            </p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};
