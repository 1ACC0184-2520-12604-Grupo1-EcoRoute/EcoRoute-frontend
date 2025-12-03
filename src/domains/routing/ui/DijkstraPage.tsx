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
import "./DijkstraPage.css";
import { getSession } from "../../auth/model/authStore";

const API_BASE = "https://ecoroute-backend-production.up.railway.app";

type NodeGeo = {
    id: string;
    lat: number;
    lon: number;
};

type RutaOptimaResponse = {
    ruta: string[];
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
        new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(n);

    /* =======================
       Cargar nodos del backend
    ======================= */
    useEffect(() => {
        const load = async () => {
            setLoadingNodes(true);
            try {
                const res = await fetch(`${API_BASE}/api/nodes`);
                const data = await res.json();

                const list: string[] = data.nodes || [];
                const g = data.geo || {};

                const parsed = list.map((id) => ({
                    id,
                    lat: g[id]?.[0],
                    lon: g[id]?.[1],
                }));

                setNodes(parsed);

                const geoMap: Record<string, LatLngTuple> = {};
                parsed.forEach((n) => {
                    if (n.lat && n.lon) geoMap[n.id] = [n.lat, n.lon];
                });
                setGeo(geoMap);

            } catch (err: any) {
                setErrorNodes("No se pudieron cargar los nodos.");
            } finally {
                setLoadingNodes(false);
            }
        };

        load();
    }, []);

    /* =======================
       Registrar reporte
    ======================= */
    const postReport = async (p: any) => {
        try {
            const { token } = getSession();
            if (!token) return;

            await fetch(`${API_BASE}/reports`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(p),
            });
        } catch {}
    };

    /* =======================
       Calcular ruta óptima
    ======================= */
    const handleCalcular = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorRuta("");
        setRuta(null);

        if (!origen || !destino) {
            setErrorRuta("Selecciona origen y destino.");
            return;
        }

        setLoadingRuta(true);
        try {
            const res = await fetch(`${API_BASE}/ruta-optima`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    algoritmo: "dijkstra",
                    criterio,
                    origen,
                    destino,
                    producto_id: productoId || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail);

            setRuta(data);

            await postReport({
                title: `Ruta óptima Dijkstra ${origen} → ${destino}`,
                algorithm: "dijkstra",
                description: `Ruta óptima calculada (${criterio})`,
                result_summary: `Ruta: ${data.ruta.join(" → ")}`,
            });

        } catch (err: any) {
            setErrorRuta(err.message);
        } finally {
            setLoadingRuta(false);
        }
    };

    /* =======================
       Construir polilínea
    ======================= */
    const polyline: LatLngTuple[] =
        ruta?.ruta
            .map((id) => geo[id])
            .filter(Boolean) as LatLngTuple[] || [];

    /* =======================
       RENDER COMPLETO
    ======================= */
    return (
        <div className="dijkstra-root">

            {/* HEADER IGUAL AL DASHBOARD */}
            <div className="dijkstra-header">
                <div className="dijkstra-header-icon">●</div>

                <div className="dijkstra-header-title">
                    <h1>Dijkstra Dashboard</h1>
                    <span>Análisis logístico y financiero</span>
                </div>
            </div>

            <div className="dijkstra-layout">

                {/* PANEL IZQUIERDO */}
                <div className="dijkstra-card">
                    <h2>Ruta Óptima – Dijkstra</h2>
                    <p className="sub">Calcula la mejor ruta según el grafo logístico del backend.</p>

                    {errorNodes && <div className="dijkstra-error">{errorNodes}</div>}

                    <form className="dijkstra-grid" onSubmit={handleCalcular}>

                        <div className="dijkstra-field">
                            <label>Origen</label>
                            <select
                                className="dijkstra-select"
                                value={origen}
                                onChange={(e) => setOrigen(e.target.value)}
                            >
                                <option value="">Seleccione</option>
                                {nodes.map((n) => (
                                    <option key={n.id} value={n.id}>{n.id}</option>
                                ))}
                            </select>
                        </div>

                        <div className="dijkstra-field">
                            <label>Destino</label>
                            <select
                                className="dijkstra-select"
                                value={destino}
                                onChange={(e) => setDestino(e.target.value)}
                            >
                                <option value="">Seleccione</option>
                                {nodes.map((n) => (
                                    <option key={n.id} value={n.id}>{n.id}</option>
                                ))}
                            </select>
                        </div>

                        <div className="dijkstra-field">
                            <label>Criterio</label>
                            <select
                                className="dijkstra-select"
                                value={criterio}
                                onChange={(e) =>
                                    setCriterio(e.target.value as any)
                                }
                            >
                                <option value="economia">Economía</option>
                                <option value="rapidez">Rapidez</option>
                            </select>
                        </div>
                        <button className="dijkstra-btn" disabled={loadingRuta}>
                            {loadingRuta ? "Calculando…" : "Calcular ruta"}
                        </button>

                    </form>

                    {errorRuta && <div className="dijkstra-error">{errorRuta}</div>}

                    {ruta && (
                        <div className="dijkstra-ok">
                            <div><strong>Ruta:</strong> {ruta.ruta.join(" → ")}</div>
                            <div><strong>Tipo:</strong> {ruta.tipo_ruta}</div>
                            <div><strong>Distancia:</strong> {formatNumber(ruta.distancia_total)} km</div>
                            <div><strong>Tiempo:</strong> {formatNumber(ruta.tiempo_total)} h</div>
                            <div><strong>Costo:</strong> {formatNumber(ruta.costo_total)} USD</div>
                        </div>
                    )}

                </div>

                {/* MAPA DERECHA */}
                <div className="dijkstra-map">
                    <MapContainer
                        className="dijkstra-map-container"
                        center={[0, 0]}
                        zoom={2}
                        worldCopyJump
                        scrollWheelZoom
                    >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

                        {polyline.length >= 2 && (
                            <>
                                <Polyline
                                    positions={polyline}
                                    pathOptions={{
                                        color: "#3b82f6",
                                        weight: 4,
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
                                        <Tooltip direction="top">{ruta?.ruta[i]}</Tooltip>
                                    </CircleMarker>
                                ))}
                            </>
                        )}
                    </MapContainer>
                </div>

            </div>
        </div>
    );
};
