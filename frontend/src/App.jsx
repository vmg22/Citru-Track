<<<<<<< HEAD
import { BrowserRouter, Routes, Route, Navigate  } from "react-router-dom";

import DashboardPage from "./page/Dashboard/DashboardPage";
import LoginPage from "./page/Auth/LoginPage";
import ForgotPasswordPage from "./page/Auth/ForgotPasswordPage";
import ResetPasswordPage from "./page/Auth/ResetPasswordPage";
=======
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";
import DashboardPrincipal from "./page/Dashboard/components/DashboardPrincipal"; // Asumo que esta ruta es correcta
import BinsPage from "./page/Bins/BinsPage"; // Asumo que esta ruta es correcta
import Layout from "./components/layout/Layout";
import LineaDeProceso from "./page/LineaProceso/LineaDeProceso";
import Pallet from "./page/Pallet/Pallet";
import CamaraFrio from "./page/CamaraFrio/CamaraFrio";

// --- Mapas de Navegación ---
// Nos ayudan a traducir de IDs de item a rutas de URL y viceversa.

// 1. De la RUTA (URL) al ID del ITEM (para resaltar el item correcto)
const routeToItemMap = {
  "/": "dashboard",
  "/dashboard": "dashboard",
  "/bins": "bins",
  "/linea-de-proceso": "linea",
  "/armado-pallet": "pallet",
  "/camara": "camara",
  "/monitoreo": "monitoreo",
  "/lotes": "lotes",
  "/logistica": "logistica",
  "/kpis": "kpis",
  "/config": "config",
};

// 2. Del ID del ITEM a la RUTA (para navegar al hacer clic)
const itemToPathMap = {
  dashboard: "/dashboard", 
  linea: "/linea-de-proceso", 
  bins: "/bins",
  pallet: "/armado-pallet",
  camara: "/camara",
  monitoreo: "/monitoreo", // Asegúrate de tener estas rutas en <Routes>
  lotes: "/lotes", // Asegúrate de tener estas rutas en <Routes>
  logistica: "/logistica", // Asegúrate de tener estas rutas en <Routes>
  kpis: "/kpis", // Asegúrate de tener estas rutas en <Routes>
  config: "/config", // Asegúrate de tener estas rutas en <Routes>
};

/**
 * Creamos un componente interno para poder usar los hooks
 * (useNavigate, useLocation) ya que App() está por fuera de <BrowserRouter>
 */
const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("dashboard");

  // EFECTO: Sincronizar el item activo cuando la URL cambia
  // (Ej: el usuario usa el botón "atrás" del navegador)
  useEffect(() => {
    const currentItem = routeToItemMap[location.pathname];
    if (currentItem && currentItem !== activeItem) {
      setActiveItem(currentItem);
    }
  }, [location.pathname]); // No incluyas 'activeItem' aquí para evitar loops

  // FUNCIÓN: Navegar al hacer clic en el Sidebar
  const handleNavigation = (itemId) => {
    // 1. Obtenemos la ruta a la que queremos ir
    const path = itemToPathMap[itemId];

    if (path && path !== location.pathname) {
      // 2. Actualizamos el estado visual (optimista)
      setActiveItem(itemId);
      // 3. NAVEGAMOS a la nueva ruta
      navigate(path);
    } else if (path) {
      // Si ya estamos en la ruta, solo aseguramos el estado
      setActiveItem(itemId);
    } else {
      console.warn("No se encontró una ruta para el item:", itemId);
    }
  };

  return (
    <Layout activeItem={activeItem} onItemClick={handleNavigation}>
      <Routes>
        {/* Es mejor tener DashboardPrincipal en ambas rutas si son lo mismo */}
        <Route path="/" element={<DashboardPrincipal />} />
        <Route path="/dashboard" element={<DashboardPrincipal />} />
        <Route path="/bins" element={<BinsPage />} />
        <Route path="/linea-de-proceso" element={<LineaDeProceso />} />
        <Route path="/armado-pallet" element={<Pallet />} />
        <Route path="/camara" element={<CamaraFrio />} />
      </Routes>
    </Layout>
  );
};
>>>>>>> bec0a36c1477c0d7b7bd208edb509c26ed5272e3

export default function App() {
  return (
    <BrowserRouter>
<<<<<<< HEAD
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        
      </Routes>
=======
      <AppContent />
>>>>>>> bec0a36c1477c0d7b7bd208edb509c26ed5272e3
    </BrowserRouter>
  );
}