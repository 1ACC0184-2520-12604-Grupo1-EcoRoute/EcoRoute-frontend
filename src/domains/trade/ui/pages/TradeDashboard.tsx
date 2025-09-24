import React, { useState } from "react";
import { FindOptimalRoute } from "../../application/FindOptimalRoute";
import { RouteApiRepository } from "../../infrastructure/api/RouteApiRepository";
import "./TradeDashboard.css";

export const TradeDashboard: React.FC = () => {
  const [origin, setOrigin] = useState("Germany");
  const [destination, setDestination] = useState("Brazil");
  const [product, setProduct] = useState("Paneles solares");
  const [result, setResult] = useState<{ path: string; cost: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const repo = new RouteApiRepository();

  // Lista fija de países (puedes reemplazar con datos del backend después)
  const countries = ["Germany", "Portugal", "Netherlands", "Brazil"];

  const handleCompute = async () => {
    setLoading(true);
    try {
      const usecase = new FindOptimalRoute(repo);
      const route = await usecase.execute(origin, destination); // devuelve Route

      // RouteApiRepository construye un objeto Route con origin, destination y cost
      setResult({
        path: `${route.origin} → ${route.destination}`,
        cost: route.cost,
      });
    } catch (err: any) {
      alert("Error: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Trade Dashboard</h1>
        <nav className="dashboard-nav">
          <button onClick={() => (window.location.href = "/reports")}>
            Ver Reportes
          </button>
          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
          >
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
              <select value={origin} onChange={(e) => setOrigin(e.target.value)}>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Destino</label>
              <br />
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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

          {result && (
            <div style={{ marginTop: "1rem" }}>
              <h3>Ruta encontrada</h3>
              <p>{result.path}</p>
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
