import React from "react";
import "../../style/sidebar.css"

const NavItem = ({ icon, text, active, onClick }) => {
  return (
    <div
      className={`side-nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <i className={icon}></i>
      <span>{text}</span>
    </div>
  );
};

const Sidebar = ({ activeItem, onItemClick, appName = "CitrusTrack", appIcon = "fas fa-lemon" }) => {
  const menuItems = [
    { id: "dashboard", icon: "fas fa-tachometer-alt", text: "Dashboard" },
    { id: "bins", icon: "fas fa-warehouse", text: "Recepción de Bins" },
    { id: "monitoreo", icon: "fas fa-eye", text: "Monitoreo en Tiempo Real" },
    { id: "lotes", icon: "fas fa-boxes", text: "Gestión de Lotes" },
    { id: "logistica", icon: "fas fa-truck", text: "Logística y Rutas" },
    { id: "kpis", icon: "fas fa-chart-line", text: "KPIs y Reportes" },
    { id: "config", icon: "fas fa-cog", text: "Configuración" },
  ];

  return (
    <div className="side-sidebar">
      <div className="side-logo">
        <i className={appIcon}></i>
        <h1>{appName}</h1>
      </div>
      <div className="side-nav-menu">
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
