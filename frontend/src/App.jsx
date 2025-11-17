import {
  BrowserRouter,
  Routes,
  Route,
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

// ---------------------------------------------------
// MAPAS DE RUTA <-> ITEM
// ---------------------------------------------------

const routeToItemMap = {
  "/dashboard": "dashboard",
  "/bins": "bins",
  "/linea-de-proceso": "linea",
  "/armado-pallet": "pallet",
  "/camara": "camara",
};

const itemToPathMap = {
  dashboard: "/dashboard",
  linea: "/linea-de-proceso",
  bins: "/bins",
  pallet: "/armado-pallet",
  camara: "/camara",
};

// ---------------------------------------------------
// COMPONENTE INTERNO PARA USAR HOOKS DENTRO DEL ROUTER
// ---------------------------------------------------

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeItem, setActiveItem] = useState("dashboard");

  // Sincronizar activo con la ruta
  useEffect(() => {
    const currentItem = routeToItemMap[location.pathname];
    if (currentItem && currentItem !== activeItem) {
      setActiveItem(currentItem);
    }
  }, [location.pathname]);

  // Navegación desde el sidebar
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
        <Route path="/dashboard" element={<DashboardPrincipal />} />
        <Route path="/bins" element={<BinsPage />} />
        <Route path="/linea-de-proceso" element={<LineaDeProceso />} />
        <Route path="/armado-pallet" element={<Pallet />} />
        <Route path="/camara" element={<CamaraFrio />} />

        {/* Redirección de raíz → dashboard */}
        <Route path="/" element={<DashboardPrincipal />} />
      </Routes>
    </Layout>
  );
};

// ---------------------------------------------------
// APP PRINCIPAL
// ---------------------------------------------------

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas sin layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Todo lo privado va dentro de AppContent */}
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}
