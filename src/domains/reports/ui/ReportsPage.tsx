import React from "react";
import { useNavigate } from "react-router-dom";
import "./ReportsPage.css";

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate("/");
  };

  // Ejemplo de datos de reportes
  const reports = [
    { id: 1, title: "Reporte de Ventas", date: "2025-09-01", status: "Completado" },
    { id: 2, title: "Análisis de Mercado", date: "2025-09-10", status: "Pendiente" },
    { id: 3, title: "Proyección Financiera", date: "2025-09-15", status: "Completado" },
  ];

  return (
    <div className="reports-container">
      <header className="reports-header">
        <h1>Reports</h1>
        <button onClick={goBack}>⬅ Volver al Dashboard</button>
      </header>

      <main className="reports-main">
        <table className="reports-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.id}</td>
                <td>{report.title}</td>
                <td>{report.date}</td>
                <td className={report.status === "Completado" ? "status-done" : "status-pending"}>
                  {report.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};
