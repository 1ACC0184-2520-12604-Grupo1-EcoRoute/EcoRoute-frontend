import React, { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Polyline,
    Tooltip,
    CircleMarker,
    useMap,
} from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./TradeDashboard.css";
import { getSession } from "../../auth/model/authStore";

const API_BASE =
    (import.meta as any).env?.VITE_API_BASE ||
    "https://ecoroute-backend-production.up.railway.app";

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

/* ================================
      UTILS
================================ */

const normalize = (str: string) => (str || "").trim();

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
        to: [flow.destination_lat as number, flow.destination_lng as number],
    };
};

const calculateDistance = (pos1: LatLngTuple, pos2: LatLngTuple): number => {
    const R = 6371;
    const dLat = ((pos2[0] - pos1[0]) * Math.PI) / 180;
    const dLon = ((pos2[1] - pos1[1]) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((pos1[0] * Math.PI) / 180) *
            Math.cos((pos2[0] * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ================================
      KRUSKAL REAL
================================ */

class UnionFind {
    parent: Map<string, string>;
    rank: Map<string, number>;
    constructor(nodes: string[]) {
        this.parent = new Map();
        this.rank = new Map();
        nodes.forEach((n) => {
            this.parent.set(n, n);
            this.rank.set(n, 0);
        });
    }
    find(x: string): string {
        if (this.parent.get(x) !== x) {
            this.parent.set(x, this.find(this.parent.get(x)!));
        }
        return this.parent.get(x)!;
    }
    union(a: string, b: string): boolean {
        const ra = this.find(a);
        const rb = this.find(b);
        if (ra === rb) return false;
        const raRank = this.rank.get(ra)!;
        const rbRank = this.rank.get(rb)!;
        if (raRank < rbRank) this.parent.set(ra, rb);
        else if (raRank > rbRank) this.parent.set(rb, ra);
        else {
            this.parent.set(rb, ra);
            this.rank.set(ra, raRank + 1);
        }
        return true;
    }
}

const runKruskalAlgorithm = (
    flows: TradeFlow[],
    formatUSD: (n: number) => string
) => {
    const valid = flows.filter((f) => coordsOk(f));
    if (!valid.length) return null;

    const nodes = new Set<string>();
    const edges: any[] = [];

    valid.forEach((f) => {
        const pos = getFlowPositions(f);
        if (!pos) return;

        const dist = calculateDistance(pos.from, pos.to);
        edges.push({
            origin: f.origin,
            destination: f.destination,
            distance: dist,
            cost: f.total_price || 0,
            from: pos.from,
            to: pos.to,
        });

        nodes.add(f.origin);
        nodes.add(f.destination);
    });

    edges.sort((a, b) => a.distance - b.distance);

    const uf = new UnionFind(Array.from(nodes));
    const lines: AlgoLine[] = [];
    let totalDistance = 0;
    let totalCost = 0;
    let firstPos = null;

    edges.forEach((e) => {
        if (uf.union(e.origin, e.destination)) {
            totalDistance += e.distance;
            totalCost += e.cost;
            if (!firstPos) firstPos = e.from;

            lines.push({
                positions: [e.from, e.to],
                color: "#22c55e",
                tooltip: `${e.origin} → ${e.destination} | ${Math.round(
                    e.distance
                )} km | ${formatUSD(e.cost)}`,
            });
        }
    });

    return {
        lines,
        totalDistance,
        totalCost,
        nodes,
        firstPos,
    };
};

/* ================================
      TSP (Nearest Neighbor + 2-OPT)
================================ */

const twoOptSwap = (path: string[], i: number, k: number) => {
    return [...path.slice(0, i), ...path.slice(i, k + 1).reverse(), ...path.slice(k + 1)];
};

const runTspAlgorithm = (flows: TradeFlow[], product: string) => {
    const filtered = flows.filter((f) => f.product === product && coordsOk(f));
    if (filtered.length < 3) return null;

    const points: Record<string, LatLngTuple> = {};
    filtered.forEach((f) => {
        if (f.origin_lat) points[f.origin] = [f.origin_lat, f.origin_lng!];
        if (f.destination_lat)
            points[f.destination] = [f.destination_lat, f.destination_lng!];
    });

    let cities = Object.keys(points);
    if (cities.length < 3) return null;

    cities = cities.slice(0, 10);
    const start = cities[0];
    const remaining = new Set(cities.slice(1));
    const path = [start];
    let current = start;

    while (remaining.size > 0) {
        let minCity = null;
        let minDist = Infinity;

        for (const c of remaining) {
            const d = calculateDistance(points[current], points[c]);
            if (d < minDist) {
                minDist = d;
                minCity = c;
            }
        }
        path.push(minCity!);
        remaining.delete(minCity!);
        current = minCity!;
    }

    path.push(start);

    const computeDist = (p: string[]) =>
        p.reduce(
            (acc, cur, i) =>
                i === p.length - 1
                    ? acc
                    : acc + calculateDistance(points[cur], points[p[i + 1]]),
            0
        );

    let bestPath = path;
    let bestDistance = computeDist(path);

    let improved = true;
    let iterations = 0;

    while (improved && iterations < 20) {
        improved = false;
        iterations++;
        for (let i = 1; i < bestPath.length - 2; i++) {
            for (let k = i + 1; k < bestPath.length - 1; k++) {
                const newP = twoOptSwap(bestPath, i, k);
                const newDist = computeDist(newP);
                if (newDist < bestDistance) {
                    bestDistance = newDist;
                    bestPath = newP;
                    improved = true;
                }
            }
        }
    }

    const lines = [];
    for (let i = 0; i < bestPath.length - 1; i++) {
        lines.push({
            positions: [points[bestPath[i]], points[bestPath[i + 1]]],
            color: "#f59e0b",
            tooltip: `${bestPath[i]} → ${bestPath[i + 1]}`,
        });
    }

    return {
        path: bestPath,
        lines,
        totalDistance: bestDistance,
        center: points[start],
    };
};

/* ================================
      MAPA
================================ */

const MapUpdater: React.FC<{ center: LatLngTuple | null; zoom: number }> = ({
    center,
    zoom,
}) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, zoom, { duration: 1.4 });
    }, [center, zoom]);
    return null;
};

/* ================================
      PRICE UI
================================ */

const PriceComparison = ({ standard, optimized, distance }: any) => {
    const pct = Math.round(((standard - optimized) / standard) * 100);

    const fUSD = (v: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(v);

    return (
        <div className="td-price-card">
            <h4 className="td-price-title">Análisis Financiero</h4>

            <p className="td-price-distance">
                Distancia total: <strong>{Math.round(distance)} km</strong>
            </p>

            <div className="td-price-row">
                <div className="td-price-label">Estándar</div>
                <div className="td-price-bar">
                    <div
                        className="td-price-bar-standard"
                        style={{ width: "100%" }}
                    ></div>
                    <span className="td-price-value">{fUSD(standard)}</span>
                </div>
            </div>

            <div className="td-price-row">
                <div className="td-price-label">Optimizado</div>
                <div className="td-price-bar">
                    <div
                        className="td-price-bar-optimized"
                        style={{ width: "80%" }}
                    ></div>
                    <span className="td-price-value td-price-value-optimized">
                        {fUSD(optimized)}
                    </span>
                </div>
            </div>

            {optimized < standard && (
                <div className="td-price-savings">
                    Ahorro estimado: <strong>{pct}%</strong>
                </div>
            )}
        </div>
    );
};

/* ================================
      LISTA DE PAÍSES
================================ */

const CountrySequence = ({ countries, title, onClose }: any) => (
    <div className="td-country-sequence">
        <div className="td-country-header">
            <h4>{title}</h4>
            <button className="td-country-close" onClick={onClose}>
                ×
            </button>
        </div>
        <div className="td-country-list">
            {countries.map((c: string, i: number) => (
                <div key={i} className="td-country-item">
                    <div className="td-country-index">{i + 1}</div>
                    <div className="td-country-name">{c}</div>
                </div>
            ))}
        </div>
    </div>
);

/* ================================
      MAIN COMPONENT
================================ */

export const TradeDashboard = () => {
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

    const [metrics, setMetrics] = useState<any>(null);
    const [involvedCountries, setInvolvedCountries] = useState<string[]>([]);
    const [showNodeDetail, setShowNodeDetail] = useState(false);

    const [mapCenter, setMapCenter] = useState<any>(null);
    const [mapZoom, setMapZoom] = useState(2);

    const formatUSD = (value: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(value);

    const handleFilter = () => {
        setActiveAlgorithm("flow");
        setAlgoLines([]);
        setAlgoMessage(null);
        setSelectedFlow(null);
        setMetrics(null);
        setInvolvedCountries([]);

        if (!origin || !destination || !product) {
            setSelectionError("Selecciona origen, destino y producto.");
            return;
        }

        const match = flows.find(
            (f) =>
                normalize(f.origin) === normalize(origin) &&
                normalize(f.destination) === normalize(destination) &&
                normalize(f.product) === normalize(product)
        );

        if (!match) {
            setSelectionError("❌ No se encontró esa combinación en la base.");
            return;
        }

        const pos = getFlowPositions(match);
        if (!pos) {
            setSelectionError("Faltan coordenadas para esta ruta.");
            return;
        }

        setSelectedFlow(match);
        setInvolvedCountries([match.origin, match.destination]);
        setMapCenter(pos.from);
        setMapZoom(3);

        const baseCost = match.total_price || 0;
        const costWithTariff =
            baseCost * (1 + (match.tariff || 0) / 100);
        const dist = calculateDistance(pos.from, pos.to);

        setMetrics({
            standard: costWithTariff * 1.2,
            optimized: costWithTariff,
            distance: dist,
        });
    };

    const runKruskal = () => {
        if (!product) {
            setAlgoMessage("Selecciona un producto primero.");
            return;
        }
        const result = runKruskalAlgorithm(
            flows.filter((f) => f.product === product),
            formatUSD
        );
        if (!result) {
            setAlgoMessage("No se pudo generar Kruskal.");
            return;
        }
        setAlgoLines(result.lines);
        setMetrics({
            standard: result.totalCost * 1.3,
            optimized: result.totalCost,
            distance: result.totalDistance,
        });
        setInvolvedCountries(Array.from(result.nodes));
        setMapCenter(result.firstPos);
        setMapZoom(2);
        setActiveAlgorithm("kruskal");
        setAlgoMessage("Red mínima generada.");
    };

    const runTsp = () => {
        if (!product) {
            setAlgoMessage("Selecciona un producto primero.");
            return;
        }
        const result = runTspAlgorithm(flows, product);
        if (!result) {
            setAlgoMessage("No hay suficientes nodos TSP.");
            return;
        }

        setAlgoLines(result.lines);
        setMetrics({
            standard: result.totalDistance * 1.3,
            optimized: result.totalDistance,
            distance: result.totalDistance,
        });
        setInvolvedCountries(result.path);
        setMapCenter(result.center);
        setMapZoom(3);
        setActiveAlgorithm("tsp");
        setAlgoMessage("Ruta TSP generada.");
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/trade-flows`);
                const data = await res.json();
                setFlows(data.flows);
            } catch (e: any) {
                setError(e.message);
            }
            setLoading(false);
        };
        load();
    }, []);

    const originOptions = Array.from(
        new Set(flows.map((f) => normalize(f.origin)))
    ).sort();
    const destinationOptions = Array.from(
        new Set(flows.map((f) => normalize(f.destination)))
    ).sort();
    const productOptions = Array.from(
        new Set(flows.map((f) => normalize(f.product)))
    ).sort();

    return (
        <div className="trade-dashboard-root">
            <header className="td-header">
                <div className="td-header-left">
                    <div className="td-logo">
                        <div className="td-logo-dot" />
                    </div>
                    <div className="td-header-text">
                        <h1>Trade Dashboard</h1>
                        <p>Análisis logístico y financiero</p>
                    </div>
                </div>

                <div className="td-header-buttons">
                    <button
                        className={`algo-btn algo-kruskal ${
                            activeAlgorithm === "kruskal" ? "active" : ""
                        }`}
                        onClick={runKruskal}
                    >
                        Kruskal
                    </button>
                    <button
                        className={`algo-btn algo-tsp ${
                            activeAlgorithm === "tsp" ? "active" : ""
                        }`}
                        onClick={runTsp}
                    >
                        TSP
                    </button>
                </div>
            </header>

            <div className="td-main-layout">
                <div className="td-left-panel">
                    <div className="td-card">
                        <h2>Consulta de Flujos</h2>

                        {loading && <p className="td-msg">Cargando…</p>}
                        {error && (
                            <p className="td-msg td-msg-error">❌ {error}</p>
                        )}

                        <div className="td-filters-grid">
                            <div className="td-field">
                                <label>Origen</label>
                                <select
                                    value={origin}
                                    onChange={(e) =>
                                        setOrigin(e.target.value)
                                    }
                                >
                                    <option value="">Selecciona</option>
                                    {originOptions.map((o) => (
                                        <option key={o} value={o}>
                                            {o}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="td-field">
                                <label>Destino</label>
                                <select
                                    value={destination}
                                    onChange={(e) =>
                                        setDestination(e.target.value)
                                    }
                                >
                                    <option value="">Selecciona</option>
                                    {destinationOptions.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="td-field">
                                <label>Producto</label>
                                <select
                                    value={product}
                                    onChange={(e) =>
                                        setProduct(e.target.value)
                                    }
                                >
                                    <option value="">Selecciona</option>
                                    {productOptions.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                className="td-primary-btn"
                                onClick={handleFilter}
                            >
                                Analizar
                            </button>
                        </div>

                        {selectionError && (
                            <p className="td-msg td-msg-error">
                                {selectionError}
                            </p>
                        )}
                    </div>

                    {metrics && (
                        <div>
                            <PriceComparison
                                standard={metrics.standard}
                                optimized={metrics.optimized}
                                distance={metrics.distance}
                            />
                            <button
                                className="td-secondary-btn"
                                onClick={() =>
                                    setShowNodeDetail(!showNodeDetail)
                                }
                            >
                                {showNodeDetail
                                    ? "Ocultar nodos"
                                    : "Ver nodos"}
                            </button>
                        </div>
                    )}
                </div>

                <div className="td-map-wrapper">
                    <MapContainer
                        center={[0, 0]}
                        zoom={2}
                        className="td-map-fullscreen"
                        worldCopyJump
                    >
                        <MapUpdater center={mapCenter} zoom={mapZoom} />
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
                        />

                        {selectedFlow &&
                            getFlowPositions(selectedFlow) && (
                                <>
                                    <Polyline
                                        positions={[
                                            getFlowPositions(
                                                selectedFlow
                                            )!.from,
                                            getFlowPositions(
                                                selectedFlow
                                            )!.to,
                                        ]}
                                        pathOptions={{
                                            color: "#3b82f6",
                                            weight: 3,
                                        }}
                                    />
                                </>
                            )}

                        {algoLines.map((l, i) => (
                            <Polyline
                                key={i}
                                positions={l.positions}
                                pathOptions={{
                                    color: l.color,
                                    weight: 3,
                                }}
                            >
                                <Tooltip sticky>{l.tooltip}</Tooltip>
                            </Polyline>
                        ))}
                    </MapContainer>

                    {algoMessage && (
                        <div className="td-msg td-msg-ok td-msg-floating">
                            {algoMessage}
                        </div>
                    )}

                    {showNodeDetail && (
                        <CountrySequence
                            countries={involvedCountries}
                            title={
                                activeAlgorithm === "tsp"
                                    ? "Ruta TSP"
                                    : "Red mínima"
                            }
                            onClose={() => setShowNodeDetail(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
