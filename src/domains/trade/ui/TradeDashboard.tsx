import React, { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Polyline,
    Tooltip,
    Marker,
    CircleMarker,
} from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./TradeDashboard.css";
import { getSession } from "../../auth/model/authStore";

const API_BASE = "http://127.0.0.1:8000";

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

    // ---------------- Utils ----------------

    const formatNumberFull = (value: number) =>
        new Intl.NumberFormat("es-PE", {
            maximumFractionDigits: 0,
        }).format(value);

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

    const haversineApprox = (a: LatLngTuple, b: LatLngTuple): number => {
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        return Math.sqrt(dx * dx + dy * dy);
    };

    // ---------------- Carga dataset ----------------

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

    // ---------------- Parse meta desde summary ----------------

    const parseMetaFromSummary = (summary: string) => {
        const meta: {
            origin?: string;
            destination?: string;
            product?: string;
        } = {};

        summary
            .split("|")
            .map((p) => p.trim())
            .forEach((p) => {
                const [k, ...rest] = p.split(":");
                const key = (k || "").toLowerCase();
                const val = rest.join(":").trim();
                if (!val) return;
                if (key.includes("origen")) meta.origin = val;
                else if (key.includes("destino")) meta.destination = val;
                else if (key.includes("producto")) meta.product = val;
            });

        return meta;
    };

    // ---------------- Aplicar contexto desde Reportes ----------------

    useEffect(() => {
        if (!flows.length) return;

        const raw = localStorage.getItem("selectedReportContext");
        if (!raw) return;

        try {
            const ctx = JSON.parse(raw);
            const algo = String(ctx.algorithm || "").toLowerCase();
            const summary: string = ctx.summary || "";
            const meta = parseMetaFromSummary(summary);

            setReportHint(null);
            setAlgoLines([]);
            setAlgoMessage(null);
            setSelectedFlow(null);
            setSelectionError("");
            setActiveAlgorithm(null);

            if (algo === "flow" || algo === "puntual") {
                if (meta.origin && meta.destination && meta.product) {
                    setOrigin(meta.origin);
                    setDestination(meta.destination);
                    setProduct(meta.product);

                    const match = flows.find(
                        (f) =>
                            f.origin === meta.origin &&
                            f.destination === meta.destination &&
                            f.product === meta.product
                    );
                    if (match) {
                        setSelectedFlow(match);
                        setReportHint(
                            `Mostrando flujo puntual desde el reporte "${ctx.title}".`
                        );
                    } else {
                        setReportHint(
                            `No se encontró en el dataset el flujo del reporte "${ctx.title}".`
                        );
                    }
                }
            } else if (algo === "dijkstra") {
                if (meta.origin && meta.destination && meta.product) {
                    setOrigin(meta.origin);
                    setDestination(meta.destination);
                    setProduct(meta.product);
                    runDijkstra(meta.origin, meta.destination, meta.product, true);
                    setReportHint(
                        `Ruta mínima (Dijkstra) desde reporte "${ctx.title}".`
                    );
                }
            } else if (algo === "kruskal") {
                const prod = meta.product;
                if (prod) setProduct(prod);
                runKruskal(meta.product, true);
                setReportHint(
                    `Red mínima (Kruskal) desde reporte "${ctx.title}".`
                );
            } else if (algo === "tsp") {
                const prod = meta.product;
                if (prod) setProduct(prod);
                runTsp(meta.product, true);
                setReportHint(
                    `Ruta óptima (TSP) desde reporte "${ctx.title}".`
                );
            }
        } catch (err) {
            console.error("Error leyendo contexto de reporte:", err);
        } finally {
            localStorage.removeItem("selectedReportContext");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flows]);

    // ---------------- Opciones select ----------------

    const originOptions = Array.from(new Set(flows.map((f) => f.origin))).sort();
    const destinationOptions = Array.from(
        new Set(flows.map((f) => f.destination))
    ).sort();
    const productOptions = Array.from(
        new Set(flows.map((f) => f.product))
    ).sort();

    // ---------------- Flujo puntual ----------------

    const handleFilter = () => {
        setSelectionError("");
        setSelectedFlow(null);
        setAlgoLines([]);
        setAlgoMessage(null);
        setActiveAlgorithm(null);
        setReportHint(null);

        if (!origin || !destination || !product) {
            setSelectionError("Selecciona origen, destino y producto.");
            return;
        }

        const match = flows.find(
            (f) =>
                f.origin === origin &&
                f.destination === destination &&
                f.product === product
        );

        if (!match) {
            setSelectionError(
                "No se encontró esa combinación en el dataset."
            );
            return;
        }

        const pos = getFlowPositions(match);
        if (!pos) {
            setSelectionError(
                "Se encontró la fila, pero faltan coordenadas para dibujarla. Configura ese país en el backend."
            );
            setSelectedFlow(match);
            return;
        }

        setSelectedFlow(match);

        const total = match.total_price || 0;
        const totalWithTariff = total * (1 + (match.tariff || 0) / 100);

        const summary =
            `Origen: ${match.origin} | ` +
            `Destino: ${match.destination} | ` +
            `Producto: ${match.product} | ` +
            `Total: ${formatNumberFull(total)} | ` +
            `Total+Arancel(${match.tariff}%): ${formatNumberFull(
                totalWithTariff
            )}`;

        postReport({
            title: `Flujo puntual ${match.origin} → ${match.destination}`,
            algorithm: "flow",
            description:
                `Flujo puntual desde ${match.origin} hacia ${match.destination} ` +
                `para el producto "${match.product}".`,
            result_summary: summary,
        });
    };

    // ---------------- Algoritmos ----------------

    const runDijkstra = (
        from: string,
        to: string,
        prod: string,
        fromReport = false
    ) => {
        setActiveAlgorithm("dijkstra");
        setSelectedFlow(null);
        setAlgoLines([]);
        setAlgoMessage(null);
        setSelectionError("");

        const edgesByOrigin: Record<
            string,
            { to: string; weight: number; flow: TradeFlow }[]
        > = {};

        const filtered = flows.filter(
            (f) =>
                f.product === prod &&
                coordsOk(f) &&
                (f.total_price || f.quantity || 0) > 0
        );
        if (!filtered.length) {
            setAlgoMessage(
                "No hay datos suficientes para Dijkstra con ese producto."
            );
            return;
        }

        for (const f of filtered) {
            const w = f.total_price || f.quantity || 1;
            if (!edgesByOrigin[f.origin]) edgesByOrigin[f.origin] = [];
            edgesByOrigin[f.origin].push({ to: f.destination, weight: w, flow: f });
        }

        const dist: Record<string, number> = {};
        const prev: Record<string, TradeFlow | null> = {};
        const visited: Record<string, boolean> = {};

        for (const f of filtered) {
            dist[f.origin] = Infinity;
            dist[f.destination] = Infinity;
        }
        dist[from] = 0;

        while (true) {
            let u: string | null = null;
            let best = Infinity;
            for (const node in dist) {
                if (!visited[node] && dist[node] < best) {
                    best = dist[node];
                    u = node;
                }
            }
            if (u === null || u === to) break;
            visited[u] = true;

            for (const e of edgesByOrigin[u] || []) {
                const nd = dist[u] + e.weight;
                if (nd < (dist[e.to] ?? Infinity)) {
                    dist[e.to] = nd;
                    prev[e.to] = e.flow;
                }
            }
        }

        if (dist[to] === Infinity) {
            setAlgoMessage(
                "No se encontró ruta entre esos países para ese producto."
            );
            return;
        }

        const routeFlows: TradeFlow[] = [];
        let cur = to;
        while (cur !== from) {
            const f = prev[cur];
            if (!f) break;
            routeFlows.push(f);
            cur = f.origin;
        }
        routeFlows.reverse();

        const lines: AlgoLine[] = [];
        let totalCost = 0;
        for (const f of routeFlows) {
            const pos = getFlowPositions(f);
            if (!pos) continue;
            const cost = f.total_price || f.quantity || 0;
            totalCost += cost;
            lines.push({
                positions: [pos.from, pos.to],
                color: "#3b82f6",
                tooltip: `${f.origin} → ${f.destination} · ${formatNumberFull(
                    cost
                )}`,
            });
        }

        setAlgoLines(lines);
        setAlgoMessage(
            `Ruta mínima (Dijkstra) para "${prod}" de ${from} a ${to}. Peso total = ${formatNumberFull(
                totalCost
            )}.`
        );

        if (!fromReport) {
            const summary =
                `Origen: ${from} | Destino: ${to} | Producto: ${prod} | ` +
                `Peso total: ${formatNumberFull(totalCost)}`;
            postReport({
                title: `Ruta mínima ${from} → ${to} (${prod})`,
                algorithm: "dijkstra",
                description:
                    `Ruta mínima calculada con Dijkstra para el producto "${prod}".`,
                result_summary: summary,
            });
        }
    };

    const runKruskal = (prod?: string, fromReport = false) => {
        const productToUse = prod || product;
        if (!productToUse) {
            setAlgoMessage("Selecciona un producto para Kruskal.");
            setActiveAlgorithm(null);
            return;
        }

        setActiveAlgorithm("kruskal");
        setSelectedFlow(null);
        setAlgoLines([]);
        setAlgoMessage(null);
        setSelectionError("");

        const filtered = flows.filter(
            (f) =>
                f.product === productToUse &&
                coordsOk(f) &&
                (f.total_price || f.quantity || 0) > 0
        );
        if (!filtered.length) {
            setAlgoMessage(
                "No hay datos suficientes para Kruskal con ese producto."
            );
            return;
        }

        const nodes = Array.from(
            new Set(filtered.flatMap((f) => [f.origin, f.destination]))
        );
        const nodeIndex: Record<string, number> = {};
        nodes.forEach((n, i) => (nodeIndex[n] = i));

        type Edge = {
            u: number;
            v: number;
            weight: number;
            flow: TradeFlow;
        };
        const edges: Edge[] = filtered.map((f) => ({
            u: nodeIndex[f.origin],
            v: nodeIndex[f.destination],
            weight: f.total_price || f.quantity || 1,
            flow: f,
        }));
        edges.sort((a, b) => a.weight - b.weight);

        const parent = nodes.map((_, i) => i);
        const rank = nodes.map(() => 0);
        const find = (x: number): number =>
            parent[x] === x ? x : (parent[x] = find(parent[x]));
        const union = (a: number, b: number): boolean => {
            let ra = find(a),
                rb = find(b);
            if (ra === rb) return false;
            if (rank[ra] < rank[rb]) [ra, rb] = [rb, ra];
            parent[rb] = ra;
            if (rank[ra] === rank[rb]) rank[ra]++;
            return true;
        };

        const lines: AlgoLine[] = [];
        let total = 0;
        let used = 0;
        for (const e of edges) {
            if (union(e.u, e.v)) {
                const pos = getFlowPositions(e.flow);
                if (!pos) continue;
                total += e.weight;
                used++;
                lines.push({
                    positions: [pos.from, pos.to],
                    color: "#22c55e",
                    tooltip: `${e.flow.origin} → ${e.flow.destination} · ${formatNumberFull(
                        e.weight
                    )}`,
                });
            }
            if (used === nodes.length - 1) break;
        }

        setAlgoLines(lines);
        setAlgoMessage(
            `Red mínima (Kruskal) para "${productToUse}" conectando ${nodes.length} países. Peso total = ${formatNumberFull(
                total
            )}.`
        );

        if (!fromReport) {
            postReport({
                title: `Red mínima ${productToUse}`,
                algorithm: "kruskal",
                description:
                    `Red mínima generada con Kruskal sobre las rutas del producto "${productToUse}".`,
                result_summary: `Producto: ${productToUse} | Costo total: ${formatNumberFull(
                    total
                )}`,
            });
        }
    };

    const runTsp = (prod?: string, fromReport = false) => {
        const productToUse = prod || product;
        if (!productToUse) {
            setAlgoMessage("Selecciona un producto para TSP.");
            setActiveAlgorithm(null);
            return;
        }

        setActiveAlgorithm("tsp");
        setSelectedFlow(null);
        setAlgoLines([]);
        setAlgoMessage(null);
        setSelectionError("");

        const filtered = flows.filter(
            (f) => f.product === productToUse && coordsOk(f)
        );
        if (!filtered.length) {
            setAlgoMessage(
                "No hay datos suficientes para TSP con ese producto."
            );
            return;
        }

        const coordByCountry: Record<string, LatLngTuple> = {};
        for (const f of filtered) {
            if (!coordByCountry[f.origin] && coordsOk(f)) {
                coordByCountry[f.origin] = [
                    f.origin_lat as number,
                    f.origin_lng as number,
                ];
            }
            if (!coordByCountry[f.destination] && coordsOk(f)) {
                coordByCountry[f.destination] = [
                    f.destination_lat as number,
                    f.destination_lng as number,
                ];
            }
        }
        const countries = Object.keys(coordByCountry);
        if (countries.length < 2) {
            setAlgoMessage(
                "Se requieren al menos 2 países con coordenadas para TSP."
            );
            return;
        }

        const n = countries.length;
        const visited = new Array(n).fill(false);
        const routeIdx: number[] = [];
        let current = 0;
        visited[0] = true;
        routeIdx.push(0);
        let totalDist = 0;

        for (let step = 1; step < n; step++) {
            let best = -1;
            let bestD = Infinity;
            for (let j = 0; j < n; j++) {
                if (visited[j]) continue;
                const d = haversineApprox(
                    coordByCountry[countries[current]],
                    coordByCountry[countries[j]]
                );
                if (d < bestD) {
                    bestD = d;
                    best = j;
                }
            }
            if (best === -1) break;
            visited[best] = true;
            routeIdx.push(best);
            totalDist += bestD;
            current = best;
        }

        const lines: AlgoLine[] = [];
        for (let i = 0; i < routeIdx.length - 1; i++) {
            const a = countries[routeIdx[i]];
            const b = countries[routeIdx[i + 1]];
            lines.push({
                positions: [coordByCountry[a], coordByCountry[b]],
                color: "#f59e0b",
                tooltip: `${a} → ${b}`,
            });
        }

        setAlgoLines(lines);
        setAlgoMessage(
            `Ruta aproximada TSP para "${productToUse}" visitando ${countries.length} países. Distancia relativa total: ${totalDist.toFixed(
                2
            )}.`
        );

        if (!fromReport) {
            postReport({
                title: `Ruta óptima TSP ${productToUse}`,
                algorithm: "tsp",
                description:
                    `Ruta aproximada calculada con heurística TSP visitando múltiples países para "${productToUse}".`,
                result_summary: `Producto: ${productToUse} | Distancia relativa total: ${totalDist.toFixed(
                    2
                )}`,
            });
        }
    };

    // ---------------- Click botones header ----------------

    const handleSelectAlgorithm = (alg: Algorithm) => {
        setReportHint(null);

        if (alg === "dijkstra") {
            if (!origin || !destination || !product) {
                setAlgoMessage(
                    "Para Dijkstra selecciona origen, destino y producto arriba."
                );
                setActiveAlgorithm(null);
                return;
            }
            runDijkstra(origin, destination, product);
        } else if (alg === "kruskal") {
            runKruskal();
        } else if (alg === "tsp") {
            runTsp();
        } else {
            setActiveAlgorithm(null);
            setAlgoLines([]);
            setAlgoMessage(null);
        }
    };

    // ---------------- Render ----------------

    return (
        <div className="trade-dashboard-root">
            <header className="td-header">
                <div className="td-header-left">
                    <div className="td-logo">
                        <div className="td-logo-dot" />
                    </div>
                    <div className="td-header-text">
                        <h1>Trade Dashboard</h1>
                        <p>
                            Explora flujos comerciales y rutas óptimas según producto.
                        </p>
                    </div>
                </div>

                <div className="td-header-buttons">
                    <button
                        className={
                            activeAlgorithm === "dijkstra"
                                ? "algo-btn algo-dijkstra active"
                                : "algo-btn algo-dijkstra"
                        }
                        onClick={() => handleSelectAlgorithm("dijkstra")}
                    >
                        Ruta mínima (Dijkstra)
                    </button>
                    <button
                        className={
                            activeAlgorithm === "kruskal"
                                ? "algo-btn algo-kruskal active"
                                : "algo-btn algo-kruskal"
                        }
                        onClick={() => handleSelectAlgorithm("kruskal")}
                    >
                        Red mínima (Kruskal)
                    </button>
                    <button
                        className={
                            activeAlgorithm === "tsp"
                                ? "algo-btn algo-tsp active"
                                : "algo-btn algo-tsp"
                        }
                        onClick={() => handleSelectAlgorithm("tsp")}
                    >
                        Ruta óptima (TSP)
                    </button>
                </div>
            </header>

            <section className="td-card">
                <h2>Flujo puntual y selección de producto</h2>

                {reportHint && (
                    <div className="td-msg td-msg-ok" style={{ marginBottom: "0.75rem" }}>
                        {reportHint}
                    </div>
                )}

                {loading && <p className="td-msg">Cargando datos...</p>}
                {error && (
                    <p className="td-msg td-msg-error">❌ {error}</p>
                )}

                {!loading && !error && flows.length > 0 && (
                    <>
                        <div className="td-filters-grid">
                            <div className="td-field">
                                <label>Origen</label>
                                <select
                                    value={origin}
                                    onChange={(e) => {
                                        setOrigin(e.target.value);
                                        setDestination("");
                                        setProduct("");
                                        setSelectedFlow(null);
                                        setSelectionError("");
                                        setAlgoLines([]);
                                        setAlgoMessage(null);
                                        setActiveAlgorithm(null);
                                        setReportHint(null);
                                    }}
                                >
                                    <option value="">Selecciona origen</option>
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
                                    onChange={(e) => {
                                        setDestination(e.target.value);
                                        setProduct("");
                                        setSelectedFlow(null);
                                        setSelectionError("");
                                        setAlgoLines([]);
                                        setAlgoMessage(null);
                                        setActiveAlgorithm(null);
                                        setReportHint(null);
                                    }}
                                >
                                    <option value="">Selecciona destino</option>
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
                                    onChange={(e) => {
                                        setProduct(e.target.value);
                                        setSelectedFlow(null);
                                        setSelectionError("");
                                        setAlgoLines([]);
                                        setAlgoMessage(null);
                                        setActiveAlgorithm(null);
                                        setReportHint(null);
                                    }}
                                >
                                    <option value="">Selecciona producto</option>
                                    {productOptions.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="td-field" style={{ alignSelf: "flex-end" }}>
                                <button
                                    className="td-primary-btn"
                                    onClick={handleFilter}
                                    disabled={!flows.length}
                                >
                                    Mostrar flujo puntual
                                </button>
                            </div>
                        </div>

                        {selectionError && (
                            <p
                                className="td-msg td-msg-error"
                                style={{ marginTop: "0.5rem" }}
                            >
                                ❌ {selectionError}
                            </p>
                        )}

                        {selectedFlow && (
                            <div
                                className="td-msg td-msg-ok"
                                style={{ marginTop: "0.5rem" }}
                            >
                                <div>
                                    <strong>Origen:</strong> {selectedFlow.origin}
                                </div>
                                <div>
                                    <strong>Destino:</strong> {selectedFlow.destination}
                                </div>
                                <div>
                                    <strong>Producto:</strong> {selectedFlow.product}
                                </div>
                                <div>
                                    <strong>Total:</strong>{" "}
                                    {formatNumberFull(
                                        selectedFlow.total_price || 0
                                    )}
                                </div>
                                <div>
                                    <strong>
                                        Total + Arancel ({selectedFlow.tariff}%):
                                    </strong>{" "}
                                    {formatNumberFull(
                                        (selectedFlow.total_price || 0) *
                                        (1 + (selectedFlow.tariff || 0) / 100)
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>

            <section className="td-card td-map-card">
                <MapContainer
                    className="td-map"
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

                    {selectedFlow && getFlowPositions(selectedFlow) && (() => {
                        const pos = getFlowPositions(selectedFlow)!;
                        return (
                            <>
                                <CircleMarker
                                    center={pos.from}
                                    radius={6}
                                    pathOptions={{ color: "#3b82f6" }}
                                >
                                    <Tooltip permanent direction="top" offset={[0, -6]}>
                                        {selectedFlow.origin}
                                    </Tooltip>
                                </CircleMarker>

                                <CircleMarker
                                    center={pos.to}
                                    radius={6}
                                    pathOptions={{ color: "#22c55e" }}
                                >
                                    <Tooltip permanent direction="top" offset={[0, -6]}>
                                        {selectedFlow.destination}
                                    </Tooltip>
                                </CircleMarker>

                                <Polyline
                                    positions={[pos.from, pos.to]}
                                    pathOptions={{
                                        color: "#38bdf8",
                                        weight: 3,
                                        opacity: 0.9,
                                    }}
                                />

                                <Marker
                                    position={[
                                        (pos.from[0] + pos.to[0]) / 2,
                                        (pos.from[1] + pos.to[1]) / 2,
                                    ]}
                                    opacity={0}
                                >
                                    <Tooltip permanent direction="top" offset={[0, -6]}>
                                        {selectedFlow.product} ·{" "}
                                        {formatNumberFull(
                                            selectedFlow.total_price || 0
                                        )}
                                    </Tooltip>
                                </Marker>
                            </>
                        );
                    })()}

                    {algoLines.map((l, i) => (
                        <Polyline
                            key={`algo-${i}`}
                            positions={l.positions}
                            pathOptions={{
                                color: l.color,
                                weight: 3,
                                opacity: 0.9,
                            }}
                        >
                            <Tooltip sticky>{l.tooltip}</Tooltip>
                        </Polyline>
                    ))}
                </MapContainer>

                {algoMessage && (
                    <div
                        className="td-msg td-msg-ok"
                        style={{ marginTop: "0.5rem" }}
                    >
                        {algoMessage}
                    </div>
                )}
            </section>
        </div>
    );
};
