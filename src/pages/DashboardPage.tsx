import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./TradeDashboard.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { LatLngExpression, LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

/* =======================
   Tipos devueltos por tu backend
   ======================= */
type NodesResponse = {
  nodes: string[];
  geo: Record<string, [number, number]>;
};

type RouteGeoResponse = {
  path: string[];
  cost: number;
  geoPath: { name: string; lat: number; lng: number }[];
};

const PRODUCTS = [
  "Paneles solares",
  "Cobre",
  "Baterías",
  "Acero",
  "Litio",
];

/* Ajustar mapa a ruta */
const FitToRoute: React.FC<{ points: LatLngTuple[] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      const lats = points.map((p) => p[0]);
      const lngs = points.map((p) => p[1]);
      map.fitBounds(
          [
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)],
          ],
          { padding: [50, 50] }
      );
    }
  }, [points, map]);
  return null;
};

export const DashboardPage: React.FC = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [product, setProduct] = useState("");

  const [nodeNames, setNodeNames] = useState<string[]>([]);
  const [points, setPoints] = useState<LatLngTuple[]>([]);
  const [path, setPath] = useState<string[]>([]);
  const [totalCost, setTotalCost] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/nodes");
        const data: NodesResponse = await res.json();
        setNodeNames(data.nodes || []);
      } catch {
        setNodeNames([]);
      }
    })();
  }, []);

  const midPoint = useMemo<LatLngExpression | null>(() => {
    if (points.length < 2) return null;
    const i = Math.floor((points.length - 1) / 2);
    const a = points[i];
    const b = points[i + 1] ?? points[i];
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as LatLngTuple;
  }, [points]);

  const handleCompute = useCallback(async () => {
    setErr("");
    setPath([]);
    setPoints([]);
    setTotalCost(0);

    if (!origin || !destination) {
      setErr("Completa origen y destino.");
      return;
    }
    if (!product) {
      setErr("Selecciona un producto.");
      return;
    }
    setLoading(true);
    try {
      // 🚀 Ahora usamos el endpoint POST que guarda automáticamente en Reportes
      const res = await fetch("/api/route/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, product }),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({} as any));
        throw new Error(msg?.detail || "No se pudo calcular la ruta");
      }
      const data: RouteGeoResponse = await res.json();

      setPath(data.path || []);
      setTotalCost(data.cost || 0);
      const pts: LatLngTuple[] = (data.geoPath || []).map((g) => [g.lat, g.lng]);
      setPoints(pts);
    } catch (e: any) {
      setErr(e?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, [origin, destination, product]);

  return (
      <div className="dashboard">
        <div className="dash-head">
          <div className="dash-head__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <defs>
                <linearGradient id="hd" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#60a5fa" />
                  <stop offset="1" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <rect x="3" y="4" rx="6" width="18" height="14" fill="url(#hd)" />
            </svg>
          </div>
          <h1>Trade Dashboard</h1>
        </div>

        <section className="card fullwidth">
          <h2>Calcular ruta óptima</h2>

          <div className="controls-grid">
            <div className="field">
              <label htmlFor="origin"></label>
              <select
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
              >
                <option value="" disabled hidden>Origen</option>
                {nodeNames.map((n) => (
                    <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="destination"></label>
              <select
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
              >
                <option value="" disabled hidden>Destino</option>
                {nodeNames.map((n) => (
                    <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="product"></label>
              <select
                  id="product"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
              >
                <option value="" disabled hidden>Producto</option>
                {PRODUCTS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <button className="btn-calc" onClick={handleCompute} disabled={loading}>
              {loading ? "Calculando..." : "Calcular"}
            </button>
          </div>

          {!!err && <p className="msg error">❌ {err}</p>}
          {path.length > 0 && (
              <div className="msg ok">
                <div><strong>Ruta encontrada:</strong> {path.join(" → ")}</div>
                <div><strong>Costo total (estimado):</strong> {new Intl.NumberFormat("es-PE").format(totalCost)}</div>
              </div>
          )}
        </section>

        <section className="map-card">
          <MapContainer
              className="map-wrap"
              center={[10, 0]}
              zoom={2}
              minZoom={2}
              maxZoom={8}
              scrollWheelZoom
              worldCopyJump
          >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a> contributors'
            />

            {points.length >= 2 && (
                <>
                  <FitToRoute points={points} />
                  <Polyline positions={points} weight={4} opacity={0.9} />
                  <Marker position={points[0]}>
                    <Tooltip direction="top" offset={[0, -8]} permanent>
                      {path[0]}
                    </Tooltip>
                  </Marker>
                  <Marker position={points[points.length - 1]}>
                    <Tooltip direction="top" offset={[0, -8]} permanent>
                      {path[path.length - 1]}
                    </Tooltip>
                  </Marker>
                  {midPoint && (
                      <Marker position={midPoint} opacity={0}>
                        <Tooltip direction="top" offset={[0, -6]} permanent>
                          Costo: {new Intl.NumberFormat("es-PE").format(totalCost)}
                        </Tooltip>
                      </Marker>
                  )}
                </>
            )}
          </MapContainer>
        </section>
      </div>
  );
};

export default DashboardPage;
