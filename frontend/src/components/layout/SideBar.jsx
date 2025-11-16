// Sidebar.jsx (Nuevo Archivo)

import React from "react";
// Importar estilos si son específicos, o asume que se cargan globalmente
// import "../../../style/DashboardPrincipal.css"; 

// Componente NavItem (Auxiliar, se queda aquí)
const NavItem = ({ icon, text, active, onClick }) => {
  return (
    <div
      className={`dashboard-nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <i className={icon}></i>
      <span>{text}</span>
    </div>
  );
};

/**
 * Componente Sidebar Modular para navegación principal.
 * * @param {object} props
 * @param {string} props.activeItem - ID del elemento de menú activo.
 * @param {function} props.onItemClick - Función de callback al hacer click en un ítem.
 * @param {string} props.appName - Nombre de la aplicación a mostrar en el logo.
 * @param {string} props.appIcon - Icono del logo.
 */
const Sidebar = ({ activeItem, onItemClick, appName = "CitrusTrack", appIcon = "fas fa-lemon" }) => {
  
  // Los ítems de menú se definen internamente o se pueden pasar como prop si es necesario
  const menuItems = [
    { id: "dashboard", icon: "fas fa-tachometer-alt", text: "Dashboard" },
    { id: "monitoreo", icon: "fas fa-eye", text: "Monitoreo en Tiempo Real" },
    { id: "lotes", icon: "fas fa-boxes", text: "Gestión de Lotes" },
    { id: "logistica", icon: "fas fa-truck", text: "Logística y Rutas" },
    { id: "kpis", icon: "fas fa-chart-line", text: "KPIs y Reportes" },
    { id: "config", icon: "fas fa-cog", text: "Configuración" },
  ];

  return (
    <div className="dashboard-sidebar">
      <div className="dashboard-logo">
        <i className={appIcon}></i>
        <h1>{appName}</h1>
      </div>
      <div className="dashboard-nav-menu">
        {menuItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            text={item.text}
            active={activeItem === item.id}
            onClick={() => onItemClick(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;