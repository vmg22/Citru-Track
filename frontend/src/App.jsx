import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useNavigate,
    useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";
// Importaciones esenciales de Toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

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
import GestionPedidos from "./page/pedidos/GestionPedidos"; 
import KPIsPage from "./page/KPIs/KPIsPage";
import Ajustes from "./page/Settings/Ajustes";
import Kpi from "./page/KPIs/KPIsPage"; 
import Logistica from "./page/Logitics/LogisticsPage";
import Camara from "./page/Settings/components/Camara";
import ProductoVariedades from "./page/Settings/components/ProductoVariedades";
import Stock from './page/Stock/Stock';
import GeneradorQR from "./page/GeneradorQR/GeneradorQR"; // Nueva página
import EstadisticasBins from "./page/Bins/EstadisticasBins"; // Nueva página
// ---------------------------------------------------

const routeToItemMap = {
    "/dashboard": "dashboard",
    "/monitoreo": "monitoreo",
    "/bins": "bins",
    "/linea-de-proceso": "linea",
    "/armado-pallet": "pallet",
    "/camara": "camara",
    "/gestion-pedidos": "gestion-pedidos",
    "/ajustes": "ajustes",
    "/kpis": "kpis",
    "/logistica": "logistica",
    "/productos": "productos",
    "/stock": "stock",
    "/generador-qr": "generador-qr",
    "/estadisticas": "estadisticas",
};

const itemToPathMap = {
    dashboard: "/dashboard",
    monitoreo: "/monitoreo",
    linea: "/linea-de-proceso",
    bins: "/bins",
    pallet: "/armado-pallet",
    camara: "/camara",
    ajustes:"/ajustes",
    kpis: "/kpis",
    logistica: "/logistica",
    "gestion-pedidos": "/gestion-pedidos",
    productos:"/productos", 
    stock:"/stock",
    "generador-qr": "/generador-qr",
    estadisticas: "/estadisticas",
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
        } else if (location.pathname === "/") {
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
                {/* Ruta principal que redirige al login */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/dashboard" element={<DashboardPrincipal />} />
                <Route path="/bins" element={<BinsPage />} />
                <Route path="/linea-de-proceso" element={<LineaDeProceso />} />
                <Route path="/armado-pallet" element={<Pallet />} />
                <Route path="/camara" element={<CamaraFrio />} />
                <Route path="/camara-config" element={<Camara />} />
                {/* Rutas añadidas */}
                <Route path="/monitoreo" element={<MonitoringsPage />} />
                <Route path="/gestion-pedidos" element={<GestionPedidos />} />
                <Route path="/kpis" element={<KPIsPage />} />
                <Route path="/ajustes" element={<Ajustes />} />
                <Route path="/kpis" element={<Kpi />} />
                <Route path="/logistica" element={<Logistica />} />
                <Route path="/productos" element={<ProductoVariedades />} />
                <Route path="/stock" element={<Stock />} />
                <Route path="/generador-qr" element={<GeneradorQR />} />
                <Route path="/estadisticas" element={<EstadisticasBins />} />// Nueva ruta para EstadisticasBins
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
            {/* Contenedor Toastify disponible en todas las páginas */}
            <ToastContainer 
                position="top-right" 
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            <Routes>
                {/* Rutas Públicas */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                {/* Rutas Privadas con Layout */}
                <Route path="/*" element={<AppContent />} />
            </Routes>
        </BrowserRouter>
    );
}