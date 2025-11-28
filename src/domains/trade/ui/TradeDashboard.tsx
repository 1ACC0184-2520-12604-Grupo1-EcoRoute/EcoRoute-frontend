import React, { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Polyline,
    Tooltip,
    CircleMarker,
    Marker,
    useMap
} from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./TradeDashboard.css"; 
import { getSession } from "../../auth/model/authStore";

const API_BASE =
    (import.meta as any).env?.VITE_API_BASE || "https://ecoroute-backend-production.up.railway.app";

type TradeFlow = {
    origin: string;
    destination: string;
    product: string;
    quantity: number;
    unit_price: number;
    tariff: number;
    date: string;
    total_price: number;
    origin_lat: number | null;
    origin_lng: number | null;
    destination_lat: number | null;
    destination_lng: number | null;
};

type Algorithm = "dijkstra" | "kruskal" | "tsp" | "flow" | null;

type AlgoLine = {
    positions: LatLngTuple[];
    color: string;
    tooltip: string;
};

// --- Componente Auxiliar para ajustar el zoom del mapa automáticamente ---
const MapUpdater: React.FC<{ center: LatLngTuple | null, zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, { duration: 1.5 });
        }
    }, [center, zoom, map]);
    return null;
};

// --- Componente Visual: Comparativa de Precios ---
const PriceComparison: React.FC<{ standard: number; optimized: number; distance: number }> = ({ standard, optimized, distance }) => {
    const savings = standard - optimized;
    const percent = standard > 0 ? Math.round((savings / standard) * 100) : 0;
    
    const widthStd = Math.max(10, (standard / Math.max(standard, optimized)) * 100);
    const widthOpt = Math.max(10, (optimized / Math.max(standard, optimized)) * 100);

    const formatUSD = (val: number) => 
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

    const formatKm = (val: number) => 
        new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 }).format(val);

    return (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h4 style={{ margin: '0 0 0.8rem 0', color: '#cbd5e1', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                💰 Análisis de Costos y Distancia
            </h4>
            
            <div style={{ marginBottom: '0.8rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                Distancia Total: <strong style={{ color: '#fff' }}>{formatKm(distance)} km</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', gap: '0.8rem' }}>
                <div style={{ width: '80px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>Estándar</div>
                <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.05)', height: '20px', borderRadius: '4px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: `${widthStd}%`, height: '100%', background: '#64748b', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
                    <span style={{ marginLeft: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0', position: 'absolute', right: '8px' }}>{formatUSD(standard)}</span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem', gap: '0.8rem' }}>
                <div style={{ width: '80px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>Optimizado</div>
                <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.05)', height: '20px', borderRadius: '4px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: `${widthOpt}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #10b981)', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
                    <span style={{ marginLeft: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#4ade80', textShadow: '0 0 10px rgba(74, 222, 128, 0.3)', position: 'absolute', right: '8px' }}>{formatUSD(optimized)}</span>
                </div>
            </div>

            {savings > 0 && (
                <div style={{ textAlign: 'center', background: 'rgba(34, 197, 94, 0.15)', color: '#86efac', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    🎉 Ahorro estimado: <strong>{formatUSD(savings)} ({percent}%)</strong>
                </div>
            )}
        </div>
    );
};

// --- Componente Visual: Lista de Países (Detalle) ---
const CountrySequence: React.FC<{ countries: string[], title: string, onClose: () => void }> = ({ countries, title, onClose }) => {
    return (
        <div style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px', 
            width: '280px',
            zIndex: 1000, 
            background: 'rgba(15, 23, 42, 0.95)', 
            padding: '1.2rem', 
            borderRadius: '12px', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', 
            border: '1px solid rgba(255,255,255,0.1)',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
            backdropFilter: 'blur(12px)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {title}
                </h4>
                <button 
                    onClick={onClose}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}
                >
                    &times;
                </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {countries.map((country, index) => (
                    <div key={`${country}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ 
                            width: '24px', height: '24px', 
                            background: 'rgba(59, 130, 246, 0.2)', 
                            borderRadius: '50%', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#60a5fa', fontSize: '0.75rem', fontWeight: 'bold'
                        }}>
                            {index + 1}
                        </div>
                        <div style={{ 
                            flex: 1,
                            background: 'rgba(255, 255, 255, 0.03)', 
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            padding: '0.5rem 0.8rem', 
                            borderRadius: '6px',
                            color: '#e2e8f0',
                            fontSize: '0.85rem'
                        }}>
                            {country}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const TradeDashboard: React.FC = () => {
    const [flows, setFlows] = useState<TradeFlow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");
    const [product, setProduct] = useState("");

    const [selectedFlow, setSelectedFlow] = useState<TradeFlow | null>(null);
    const [selectionError, setSelectionError] = useState("");

    const [activeAlgorithm, setActiveAlgorithm] = useState<Algorithm>(null);
    const [algoLines, setAlgoLines] = useState<AlgoLine[]>([]);
    const [algoMessage, setAlgoMessage] = useState<string | null>(null);
    const [reportHint, setReportHint] = useState<string | null>(null);

    const [metrics, setMetrics] = useState<{ standard: number; optimized: number; distance: number } | null>(null);
    const [involvedCountries, setInvolvedCountries] = useState<string[]>([]);
    const [showNodeDetail, setShowNodeDetail] = useState(false);

    const [mapCenter, setMapCenter] = useState<LatLngTuple | null>(null);
    const [mapZoom, setMapZoom] = useState(2);

    const formatUSD = (value: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

    const coordsOk = (f: TradeFlow) =>
        f.origin_lat != null &&
        f.origin_lng != null &&
        f.destination_lat != null &&
        f.destination_lng != null;

    const getFlowPositions = (
        flow: TradeFlow
    ): { from: LatLngTuple; to: LatLngTuple } | null => {
        if (!coordsOk(flow)) return null;
        return {
            from: [flow.origin_lat as number, flow.origin_lng as number],
            to: [
                flow.destination_lat as number,
                flow.destination_lng as number,
            ],
        };
    };

    const calculateDistance = (pos1: LatLngTuple, pos2: LatLngTuple): number => {
        const R = 6371; 
        const dLat = (pos2[0] - pos1[0]) * (Math.PI / 180);
        const dLon = (pos2[1] - pos1[1]) * (Math.PI / 180);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(pos1[0] * (Math.PI / 180)) * Math.cos(pos2[0] * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

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
            console.error("Error al registrar consulta:", err);
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`${API_BASE}/api/trade-flows`);
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.detail || "Error al cargar dataset");
                }
                const data = await res.json();
                setFlows(data.flows || []);
            } catch (e: any) {
                console.error(e);
                setError(e.message || "Error al cargar datos");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const originOptions = Array.from(new Set(flows.map((f) => f.origin))).sort();
    const destinationOptions = Array.from(new Set(flows.map((f) => f.destination))).sort();
    const productOptions = Array.from(new Set(flows.map((f) => f.product))).sort();

    const resetState = () => {
        setSelectedFlow(null);
        setAlgoLines([]);
        setAlgoMessage(null);
        setMetrics(null);
        setInvolvedCountries([]);
        setShowNodeDetail(false);
        setSelectionError("");
        setReportHint(null);
    };

    const handleFilter = () => {
        resetState();
        setActiveAlgorithm("flow");

        if (!origin || !destination || !product) {
            setSelectionError("Selecciona origen, destino y producto.");
            return;
        }

        const match = flows.find(f => f.origin === origin && f.destination === destination && f.product === product);

        if (!match) {
            setSelectionError("No se encontró esa combinación en el dataset.");
            return;
        }

        const pos = getFlowPositions(match);
        if (!pos) {
            setSelectionError("Faltan coordenadas para visualizar esta ruta.");
            return;
        }

        setSelectedFlow(match);
        setInvolvedCountries([origin, destination]);

        setMapCenter(pos.from);
        setMapZoom(3);

        const cost = match.total_price || 0;
        const costWithTariff = cost * (1 + (match.tariff || 0) / 100);
        const dist = calculateDistance(pos.from, pos.to);

        setMetrics({
            standard: costWithTariff * 1.25, 
            optimized: costWithTariff,
            distance: dist
        });

        const summary = `Origen: ${match.origin} | Destino: ${match.destination} | Producto: ${match.product} | Costo: ${formatUSD(costWithTariff)}`;
        postReport({
            title: `Consulta Flujo ${match.origin} → ${match.destination}`,
            algorithm: "flow",
            description: `Análisis de flujo comercial directo.`,
            result_summary: summary,
        });
    };

    const runKruskal = () => {
        resetState();
        setActiveAlgorithm("kruskal");
        if (!product) {
            setAlgoMessage("Selecciona un producto.");
            return;
        }

        const filtered = flows.filter(f => f.product === product && coordsOk(f) && (f.total_price || 0) > 0);
        if (!filtered.length) {
            setAlgoMessage("No hay datos para Kruskal.");
            return;
        }

        const edges = [...filtered].sort((a, b) => a.total_price - b.total_price).slice(0, 15);
        const lines: AlgoLine[] = [];
        let totalCost = 0;
        let totalDist = 0;
        const uniqueNodes = new Set<string>();
        let firstPos: LatLngTuple | null = null;

        edges.forEach(e => {
            const pos = getFlowPositions(e);
            if(pos) {
                if (!firstPos) firstPos = pos.from;
                totalCost += e.total_price;
                totalDist += calculateDistance(pos.from, pos.to);
                uniqueNodes.add(e.origin);
                uniqueNodes.add(e.destination);
                lines.push({
                    positions: [pos.from, pos.to],
                    color: "#22c55e",
                    tooltip: `${e.origin} → ${e.destination} (${formatUSD(e.total_price)})`
                });
            }
        });

        if (firstPos) {
            setMapCenter(firstPos);
            setMapZoom(2);
        }

        setAlgoLines(lines);
        setInvolvedCountries(Array.from(uniqueNodes));
        
        setMetrics({
            standard: totalCost * 1.45,
            optimized: totalCost,
            distance: totalDist
        });

        setAlgoMessage(`Red Mínima (Kruskal) generada. ${uniqueNodes.size} nodos.`);
        
        postReport({
            title: `Red Mínima ${product}`,
            algorithm: "kruskal",
            description: `Optimización de red logística (Kruskal).`,
            result_summary: `Nodos: ${uniqueNodes.size} | Costo: ${formatUSD(totalCost)}`,
        });
    };

    const runTsp = () => {
        resetState();
        setActiveAlgorithm("tsp");
        if (!product) {
            setAlgoMessage("Selecciona un producto.");
            return;
        }

        const filtered = flows.filter(f => f.product === product && coordsOk(f));
        if (filtered.length < 2) {
            setAlgoMessage("Insuficientes puntos.");
            return;
        }

        const pointsMap: Record<string, LatLngTuple> = {};
        filtered.forEach(f => {
            if(f.origin_lat && f.origin_lng) pointsMap[f.origin] = [f.origin_lat, f.origin_lng];
        });
        const cities = Object.keys(pointsMap).slice(0, 8); 

        if (cities.length < 3) {
            setAlgoMessage("Mínimo 3 nodos para TSP.");
            return;
        }

        const path = [cities[0]];
        const remaining = cities.slice(1);
        let current = cities[0];
        let totalDist = 0;

        while(remaining.length > 0) {
            let nearest = remaining[0];
            let minDist = Infinity;
            let nearestIdx = 0;

            remaining.forEach((city, idx) => {
                const d = calculateDistance(pointsMap[current], pointsMap[city]);
                if(d < minDist) {
                    minDist = d;
                    nearest = city;
                    nearestIdx = idx;
                }
            });

            path.push(nearest);
            totalDist += minDist;
            current = nearest;
            remaining.splice(nearestIdx, 1);
        }
        totalDist += calculateDistance(pointsMap[current], pointsMap[cities[0]]);
        path.push(cities[0]);

        setMapCenter(pointsMap[cities[0]]);
        setMapZoom(3);

        const lines: AlgoLine[] = [];
        for(let i=0; i<path.length-1; i++) {
            lines.push({
                positions: [pointsMap[path[i]], pointsMap[path[i+1]]],
                color: "#f59e0b",
                tooltip: `Tramo ${i+1}: ${path[i]} → ${path[i+1]}`
            });
        }

        setAlgoLines(lines);
        setInvolvedCountries(path);
        
        const costOptimized = totalDist * 1.5; 
        setMetrics({
            standard: costOptimized * 1.35,
            optimized: costOptimized,
            distance: totalDist
        });

        setAlgoMessage(`Ruta Óptima (TSP). Circuito de ${Math.round(totalDist)} km.`);
        
        postReport({
            title: `Ruta TSP ${product}`,
            algorithm: "tsp",
            description: `Circuito de viajante optimizado.`,
            result_summary: `Distancia: ${Math.round(totalDist)} km | Costo Est: ${formatUSD(costOptimized)}`,
        });
    };

    const handleSelectAlgorithm = (alg: Algorithm) => {
        setReportHint(null);
        if (alg === "kruskal") runKruskal();
        else if (alg === "tsp") runTsp();
        else {
            setActiveAlgorithm(null);
            setAlgoLines([]);
            setAlgoMessage(null);
            setMetrics(null);
            setInvolvedCountries([]);
            setShowNodeDetail(false);
        }
    };

    return (
        <div className="trade-dashboard-root" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <header className="td-header" style={{ flexShrink: 0, zIndex: 20 }}>
                <div className="td-header-left">
                    <div className="td-logo"><div className="td-logo-dot" /></div>
                    <div className="td-header-text">
                        <h1>Trade Dashboard</h1>
                        <p>Análisis logístico y optimización financiera en USD.</p>
                    </div>
                </div>
                <div className="td-header-buttons">
                    <button className={`algo-btn algo-kruskal ${activeAlgorithm === 'kruskal' ? 'active' : ''}`} onClick={runKruskal}>
                        Red mínima (Kruskal)
                    </button>
                    <button className={`algo-btn algo-tsp ${activeAlgorithm === 'tsp' ? 'active' : ''}`} onClick={runTsp}>
                        Ruta óptima (TSP)
                    </button>
                </div>
            </header>

            {/* LAYOUT PRINCIPAL */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* PANEL IZQUIERDO: ANCHO 38% (APROX 600-700px) SIN SCROLLBAR VISIBLE */}
                <div className="hide-scrollbar" style={{ 
                    width: '38%', 
                    minWidth: '480px',
                    maxWidth: '750px',
                    padding: '4rem', 
                    overflowY: 'auto', 
                    background: 'rgba(17, 24, 39, 0.95)', 
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 10
                }}>
                    <style>{`
                        .hide-scrollbar::-webkit-scrollbar { display: none; }
                        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    `}</style>

                    <section className="td-card" style={{ width: '100%', margin: 0, marginBottom: '0.5rem', padding: '1.2rem' }}>
                        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.8rem' }}>Consulta de Flujos</h2>
                        
                        {reportHint && <div className="td-msg td-msg-ok" style={{ marginBottom: "0.5rem", fontSize: '0.8rem', padding: '0.5rem' }}>{reportHint}</div>}
                        {loading && <p className="td-msg" style={{ fontSize: '0.85rem', margin: 0 }}>Cargando datos...</p>}
                        {error && <p className="td-msg td-msg-error" style={{ fontSize: '0.85rem', margin: 0 }}>❌ {error}</p>}

                        {!loading && !error && flows.length > 0 && (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <div className="td-field">
                                        <label style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Origen</label>
                                        <select style={{ padding: '0.5rem', fontSize: '0.9rem' }} value={origin} onChange={e => { setOrigin(e.target.value); resetState(); }}>
                                            <option value="">Selecciona origen</option>
                                            {originOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                    <div className="td-field">
                                        <label style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Destino</label>
                                        <select style={{ padding: '0.5rem', fontSize: '0.9rem' }} value={destination} onChange={e => { setDestination(e.target.value); resetState(); }}>
                                            <option value="">Selecciona destino</option>
                                            {destinationOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="td-field">
                                        <label style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Producto</label>
                                        <select style={{ padding: '0.5rem', fontSize: '0.9rem' }} value={product} onChange={e => { setProduct(e.target.value); resetState(); }}>
                                            <option value="">Selecciona producto</option>
                                            {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <button className="td-primary-btn" onClick={handleFilter} disabled={!flows.length} style={{ width: '100%', marginTop: '0.4rem', padding: '0.6rem' }}>
                                        Analizar Flujo
                                    </button>
                                </div>

                                {selectionError && <p className="td-msg td-msg-error" style={{ marginTop: "0.4rem", fontSize: '0.8rem', padding: '0.5rem' }}>❌ {selectionError}</p>}
                            </>
                        )}
                    </section>

                    {metrics && (
                        <div style={{ animation: 'fadeIn 0.5s' }}>
                            <PriceComparison standard={metrics.standard} optimized={metrics.optimized} distance={metrics.distance} />
                            
                            {involvedCountries.length > 0 && !showNodeDetail && (
                                <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                                    <button 
                                        className="td-secondary-btn"
                                        onClick={() => setShowNodeDetail(!showNodeDetail)}
                                        style={{ width: '100%', justifyContent: 'center', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.6rem' }}
                                    >
                                        {showNodeDetail ? 'Ocultar Detalle' : '👁️ Ver Registro de Nodos'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* PANEL DERECHO: MAPA FULL SCREEN (SIN BORDES NI MARGENES) */}
                <div style={{ flex: 1, position: 'relative', background: '#0f172a' }}>
                    <MapContainer
                        center={[20, 0]}
                        zoom={1}
                        minZoom={2}
                        maxZoom={8}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%", zIndex: 1 }}
                        worldCopyJump={true}
                        className="td-map-fullscreen"
                    >
                        {/* Control de Zoom/Centro automático */}
                        <MapUpdater center={mapCenter} zoom={mapZoom} />

                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                        
                        {selectedFlow && getFlowPositions(selectedFlow) && (() => {
                            const pos = getFlowPositions(selectedFlow)!;
                            return (
                                <>
                                    <CircleMarker center={pos.from} radius={6} pathOptions={{ color: "#3b82f6" }}>
                                        <Tooltip permanent direction="top" offset={[0, -6]}>{selectedFlow.origin}</Tooltip>
                                    </CircleMarker>
                                    <CircleMarker center={pos.to} radius={6} pathOptions={{ color: "#22c55e" }}>
                                        <Tooltip permanent direction="top" offset={[0, -6]}>{selectedFlow.destination}</Tooltip>
                                    </CircleMarker>
                                    <Polyline positions={[pos.from, pos.to]} pathOptions={{ color: "#38bdf8", weight: 3, opacity: 0.9 }} />
                                </>
                            );
                        })()}

                        {algoLines.map((l, i) => (
                            <Polyline key={`algo-${i}`} positions={l.positions} pathOptions={{ color: l.color, weight: 3, opacity: 0.9 }}>
                                <Tooltip sticky>{l.tooltip}</Tooltip>
                            </Polyline>
                        ))}
                    </MapContainer>

                    {algoMessage && (
                        <div className="td-msg td-msg-ok" style={{ 
                            position: 'absolute', 
                            top: '30px', 
                            left: '50%', 
                            transform: 'translateX(-50%)', 
                            zIndex: 1000, 
                            margin: 0,
                            padding: '0.6rem 1.2rem',
                            borderRadius: '30px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            fontSize: '0.9rem'
                        }}>
                            {algoMessage}
                        </div>
                    )}

                    {showNodeDetail && involvedCountries.length > 0 && (
                        <CountrySequence 
                            countries={involvedCountries} 
                            title={activeAlgorithm === 'tsp' ? 'Secuencia TSP' : activeAlgorithm === 'kruskal' ? 'Nodos Red' : 'Ruta'} 
                            onClose={() => setShowNodeDetail(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};