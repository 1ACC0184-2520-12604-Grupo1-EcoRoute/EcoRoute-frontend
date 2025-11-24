import React, { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Polyline,
    CircleMarker,
    Tooltip,
} from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../trade/ui/TradeDashboard.css";
import { getSession } from "../../auth/model/authStore";

const API_BASE = "https://ecoroute-backend-production.up.railway.app";

type NodeGeo = {
    id: string;
    lat: number;
    lon: number;
};

type RutaOptimaResponse = {
    ruta: string[]; // lista de IDs de país
    tipo_ruta: "aerea" | "terrestre" | "maritima" | "mixta";
    distancia_total: number;
    tiempo_total: number;
    costo_total: number;
};

const PRODUCTOS = [
    { id: "", nombre: "Sin producto (solo red base)" },
    { id: "SOLAR_PANEL_STD", nombre: "Panel solar 450W" },
    { id: "INVERTER_5KW", nombre: "Inversor 5kW" },
    { id: "LITHIUM_BATTERY_5KWH", nombre: "Batería de litio 5kWh" },
    { id: "COPPER_CATHODE", nombre: "Cátodos de cobre" },
    { id: "TEXTIL_PREMIUM", nombre: "Textil premium" },
];

export const DijkstraPage: React.FC = () => {
    const [nodes, setNodes] = useState<NodeGeo[]>([]);
    const [geo, setGeo] = useState<Record<string, LatLngTuple>>({});
    const [loadingNodes, setLoadingNodes] = useState(false);
    const [errorNodes, setErrorNodes] = useState("");

    const [origen, setOrigen] = useState("");
    const [destino, setDestino] = useState("");
    const [criterio, setCriterio] = useState<"rapidez" | "economia">("economia");
    const [productoId, setProductoId] = useState("");

    const [ruta, setRuta] = useState<RutaOptimaResponse | null>(null);
    const [errorRuta, setErrorRuta] = useState("");
    const [loadingRuta, setLoadingRuta] = useState(false);

    const formatNumber = (n: number) =>
        new Intl.NumberFormat("es-PE", {
            maximumFractionDigits: 2,
        }).format(n);

    // ---- Cargar nodos base del grafo ----
    useEffect(() => {
        const loadNodes = async () => {
            setLoadingNodes(true);
            setErrorNodes("");
            try {
                const res = await fetch(`${API_BASE}/api/nodes`);
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.detail || "No se pudieron cargar los nodos.");
                }
                const data = await res.json();
                const list: string[] = data.nodes || [];
                const g = data.geo || {};

                const parsed: NodeGeo[] = list.map((id) => ({
                    id,
                    lat: g[id]?.[0],
                    lon: g[id]?.[1],
                }));
                setNodes(parsed);
                const geoMap: Record<string, LatLngTuple> = {};
                parsed.forEach((n) => {
                    if (typeof n.lat === "number" && typeof n.lon === "number") {
                        geoMap[n.id] = [n.lat, n.lon];
                    }
                });
                setGeo(geoMap);
            } catch (err: any) {
                console.error(err);
                setErrorNodes(err.message || "Error al cargar nodos.");
            } finally {
                setLoadingNodes(false);
            }
        };

        loadNodes();
    }, []);

    // ---- Guardar reporte en backend ----
    const postReport = async (payload: {
        title: string;
        algorithm: string;
        description: string;
        result_summary: string;
    }) => {
        try {
            const { token } = getSession();
            if (!token) return;
            await fetch(`${API_BASE}/reports`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
        } catch (err) {
            console.error("Error al registrar reporte:", err);
        }
    };

    // ---- Calcular ruta con Dijkstra (/ruta-optima) ----
    const handleCalcular = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorRuta("");
        setRuta(null);

        if (!origen || !destino) {
            setErrorRuta("Selecciona origen y destino.");
            return;
        }
        if (origen === destino) {
            setErrorRuta("Origen y destino no pueden ser iguales.");
            return;
        }

        setLoadingRuta(true);
        try {
            const res = await fetch(`${API_BASE}/ruta-optima`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    algoritmo: "dijkstra",
                    criterio,
                    origen,
                    destino,
                    producto_id: productoId || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "No se pudo calcular ruta óptima.");
            }

            const rutaResp: RutaOptimaResponse = data;
            setRuta(rutaResp);

            const resumen =
                `Ruta: ${rutaResp.ruta.join(" → ")} | ` +
                `Tipo: ${rutaResp.tipo_ruta} | ` +
                `Distancia: ${formatNumber(rutaResp.distancia_total)} km | ` +
                `Tiempo: ${formatNumber(rutaResp.tiempo_total)} h | ` +
                `Costo: ${formatNumber(rutaResp.costo_total)} USD`;

            await postReport({
                title: `Ruta óptima Dijkstra ${origen} → ${destino}`,
                algorithm: "dijkstra",
                description:
                    `Ruta óptima calculada con Dijkstra (${criterio})` +
                    (productoId
                        ? ` para el producto "${productoId}".`
                        : " sin producto específico."),
                result_summary: resumen,
            });
        } catch (err: any) {
            console.error(err);
            setErrorRuta(err.message || "Error al calcular ruta.");
        } finally {
            setLoadingRuta(false);
        }
    };

    // ---- Construir polilínea en base a IDs + geo ----
    const buildPolyline = (): LatLngTuple[] => {
        if (!ruta) return [];
        const line: LatLngTuple[] = [];
        ruta.ruta.forEach((id) => {
            const c = geo[id];
            if (c) line.push(c);
        });
        return line;
    };

    const polyline = buildPolyline();

    return (
        <div className="trade-dashboard-root">
            <section className="td-card">
                <h2>Ruta óptima - Dijkstra</h2>
                <p style={{ marginTop: 4, color: "#9ca3af", fontSize: "0.9rem" }}>
                    Usa el grafo logístico definido en el backend para encontrar la ruta
                    de menor costo o tiempo entre dos países.
                </p>

                {loadingNodes && (
                    <p className="td-msg">Cargando nodos del grafo...</p>
                )}
                {errorNodes && (
                    <p className="td-msg td-msg-error">❌ {errorNodes}</p>
                )}

                <form
                    className="td-filters-grid"
                    onSubmit={handleCalcular}
                    style={{ marginTop: "1rem" }}
                >
                    <div className="td-field">
                        <label>Origen</label>
                        <select
                            value={origen}
                            onChange={(e) => setOrigen(e.target.value)}
                        >
                            <option value="">Selecciona origen</option>
                            {nodes.map((n) => (
                                <option key={n.id} value={n.id}>
                                    {n.id}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="td-field">
                        <label>Destino</label>
                        <select
                            value={destino}
                            onChange={(e) => setDestino(e.target.value)}
                        >
                            <option value="">Selecciona destino</option>
                            {nodes.map((n) => (
                                <option key={n.id} value={n.id}>
                                    {n.id}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="td-field">
                        <label>Criterio</label>
                        <select
                            value={criterio}
                            onChange={(e) =>
                                setCriterio(e.target.value as "rapidez" | "economia")
                            }
                        >
                            <option value="economia">Economía (costo)</option>
                            <option value="rapidez">Rapidez (tiempo)</option>
                        </select>
                    </div>

                    <div className="td-field">
                        <label>Producto (opcional)</label>
                        <select
                            value={productoId}
                            onChange={(e) => setProductoId(e.target.value)}
                        >
                            {PRODUCTOS.map((p) => (
                                <option key={p.id || "none"} value={p.id}>
                                    {p.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div
                        className="td-field"
                        style={{ alignSelf: "flex-end", marginTop: "0.3rem" }}
                    >
                        <button
                            type="submit"
                            className="td-primary-btn"
                            disabled={loadingRuta || loadingNodes}
                        >
                            {loadingRuta ? "Calculando..." : "Calcular ruta"}
                        </button>
                    </div>
                </form>

                {errorRuta && (
                    <p className="td-msg td-msg-error" style={{ marginTop: 8 }}>
                        ❌ {errorRuta}
                    </p>
                )}

                {ruta && !errorRuta && (
                    <div
                        className="td-msg td-msg-ok"
                        style={{ marginTop: "0.75rem" }}
                    >
                        <div>
                            <strong>Ruta:</strong> {ruta.ruta.join(" → ")}
                        </div>
                        <div>
                            <strong>Tipo de ruta:</strong> {ruta.tipo_ruta}
                        </div>
                        <div>
                            <strong>Distancia total:</strong>{" "}
                            {formatNumber(ruta.distancia_total)} km
                        </div>
                        <div>
                            <strong>Tiempo total:</strong>{" "}
                            {formatNumber(ruta.tiempo_total)} h
                        </div>
                        <div>
                            <strong>Costo total:</strong>{" "}
                            {formatNumber(ruta.costo_total)} USD
                        </div>
                    </div>
                )}
            </section>

            <section className="td-card td-map-card">
                <MapContainer
                    className="td-map"
                    center={[0, 0]}
                    zoom={2}
                    minZoom={2}
                    maxZoom={6}
                    scrollWheelZoom
                    worldCopyJump
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />

                    {polyline.length >= 2 && (
                        <>
                            <Polyline
                                positions={polyline}
                                pathOptions={{
                                    color: "#3b82f6",
                                    weight: 3,
                                    opacity: 0.9,
                                }}
                            />
                            {polyline.map((p, i) => (
                                <CircleMarker
                                    key={i}
                                    center={p}
                                    radius={5}
                                    pathOptions={{ color: "#22c55e" }}
                                >
                                    <Tooltip direction="top" offset={[0, -6]}>
                                        {ruta?.ruta[i]}
                                    </Tooltip>
                                </CircleMarker>
                            ))}
                        </>
                    )}
                </MapContainer>
            </section>
        </div>
    );
};
