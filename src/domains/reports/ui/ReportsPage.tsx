import React, { useEffect, useState } from "react";
import "./ReportsPage.css";

type Report = {
  id: number;
  created_at: string; // ISO
  origin: string;
  destination: string;
  product?: string | null;
  cost: number;
  path: string[];
};

const currency = (n: number) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 }).format(n);

export const ReportsPage: React.FC = () => {
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setErr("");
      setLoading(true);
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) throw new Error("No se pudieron cargar los reportes");
        const data: Report[] = await res.json();
        setItems(data || []);
      } catch (e: any) {
        setErr(e?.message || "Error inesperado");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
      <div className="reports">
        <h1>Reportes</h1>

        {loading && <p className="muted">Cargando...</p>}
        {!!err && <p className="error">{err}</p>}

        {!loading && items.length === 0 && <p className="muted">Aún no hay reportes. Calcula una ruta para registrarla.</p>}

        {items.length > 0 && (
            <div className="table-wrap">
              <table className="rtable">
                <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Producto</th>
                  <th>Ruta</th>
                  <th>Costo</th>
                </tr>
                </thead>
                <tbody>
                {items.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.created_at).toLocaleString("es-PE")}</td>
                      <td>{r.origin}</td>
                      <td>{r.destination}</td>
                      <td>{r.product ?? "—"}</td>
                      <td>{r.path.join(" → ")}</td>
                      <td>{currency(r.cost)}</td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}
      </div>
  );
};

export default ReportsPage;
