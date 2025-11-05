// src/services/reportsApi.ts
export type ReportItem = {
    id: number;
    title: string;
    date: string;   // ISO o yyyy-mm-dd
    status: string; // "Completado" | "Pendiente" | etc.
};

export async function fetchReports(): Promise<ReportItem[]> {
    const res = await fetch('/api/reports');
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Error ${res.status}`);
    }
    const data = await res.json();
    // Soporta {reports:[...]} o {items:[...]}
    const list: ReportItem[] = (data.reports ?? data.items ?? []) as ReportItem[];
    return Array.isArray(list) ? list : [];
}
