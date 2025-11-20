// src/services/kpiService.js
const API_BASE = import.meta.env.VITE_API || "http://localhost:4000/api/kpi";
const KPI_URL = import.meta.env.VITE_KPI || `${API_BASE}/kpi`;

export async function getKPIs() {
  const res = await fetch(KPI_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
