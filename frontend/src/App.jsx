import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";

// Páginas públicas
import LoginPage from "./page/Auth/LoginPage";
import ForgotPasswordPage from "./page/Auth/ForgotPasswordPage";
import ResetPasswordPage from "./page/Auth/ResetPasswordPage";

// Layout y páginas internas
import Layout from "./components/layout/Layout";
import DashboardPrincipal from "./page/Dashboard/components/DashboardPrincipal";
import BinsPage from "./page/Bins/BinsPage";
import LineaDeProceso from "./page/LineaProceso/LineaDeProceso";
import Pallet from "./page/Pallet/Pallet";
import CamaraFrio from "./page/CamaraFrio/CamaraFrio";
import MonitoringsPage from "./page/Monitoring/MonitoringsPage";
// Importamos la página de Gestión de Pedidos
import GestionPedidos from "./page/pedidos/GestionPedidos"; 
import KPIsPage from "./page/KPIs/KPIsPage";

// ---------------------------------------------------

const routeToItemMap = {
  "/dashboard": "dashboard",
  "/monitoreo": "monitoreo",
  "/bins": "bins",
  "/linea-de-proceso": "linea",
  "/armado-pallet": "pallet",
  "/camara": "camara",
  "/gestion-pedidos": "gestion-pedidos",
  "/kpis": "kpis",
};

const itemToPathMap = {
  dashboard: "/dashboard",
  monitoreo: "/monitoreo",
  linea: "/linea-de-proceso",
  bins: "/bins",
  pallet: "/armado-pallet",
  camara: "/camara",
  kpis: "/kpis",
  "gestion-pedidos": "/gestion-pedidos",
};

// ---------------------------------------------------
// COMPONENTE INTERNO PARA USAR HOOKS DENTRO DEL ROUTER
// ---------------------------------------------------

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeItem, setActiveItem] = useState("dashboard");

  // Este useEffect actualiza el ítem activo del sidebar cuando
  // la URL cambia (ej: usando los botones de "atrás/adelante" del navegador)
  useEffect(() => {
    const currentItem = routeToItemMap[location.pathname];
    if (currentItem && currentItem !== activeItem) {
      setActiveItem(currentItem);
    }
    // Corregido: Si la ruta es solo "/", activa 'dashboard'
    else if (location.pathname === "/") {
        setActiveItem("dashboard");
    }
  }, [location.pathname, activeItem]);

  // FUNCIÓN: Navegar al hacer clic en el Sidebar
  const handleNavigation = (itemId) => {
    const path = itemToPathMap[itemId];
    if (!path) return;

    if (path !== location.pathname) {
      setActiveItem(itemId);
      navigate(path);
    }
  };

  return (
    <Layout activeItem={activeItem} onItemClick={handleNavigation}>
      <Routes>
        {/* Ruta principal que redirige al dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={<DashboardPrincipal />} />
        <Route path="/bins" element={<BinsPage />} />
        <Route path="/linea-de-proceso" element={<LineaDeProceso />} />
        <Route path="/armado-pallet" element={<Pallet />} />
        <Route path="/camara" element={<CamaraFrio />} />

        {/* --- RUTAS FALTANTES AÑADIDAS --- */}
        <Route path="/monitoreo" element={<MonitoringsPage />} />
        <Route path="/gestion-pedidos" element={<GestionPedidos />} />
        <Route path="/kpis" element={<KPIsPage />} />
      </Routes>
    </Layout>
  );
};

// ---------------------------------------------------
// APP PRINCIPAL (ESTRUCTURA CORREGIDA)
// ---------------------------------------------------

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas (sin Layout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Rutas Privadas (con Layout) 
            Usamos "/*" para indicar que cualquier otra ruta 
            (incluyendo "/") debe ser manejada por AppContent */}
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}