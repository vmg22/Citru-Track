import React from "react";
import Logout from "../layout/logout";
import "../../style/sidebar.css";

const NavItem = ({ icon, text, active, onClick }) => {
  return (
    <div className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      <div className="nav-icon-box">
        <i className={icon}></i>
      </div>
      <span className="nav-text">{text}</span>
      {active && <div className="active-indicator" />}
    </div>
  );
};

const Sidebar = ({
  activeItem,
  onItemClick,
  appName = "CitrusTrack",
  appIcon = "fas fa-lemon",
}) => {
  const menuGroups = [
    {
      title: "Principal",
      items: [
        { id: "dashboard", icon: "fas fa-tachometer-alt", text: "Dashboard" },
        { id: "monitoreo", icon: "fas fa-eye", text: "Monitoreo Vivo" },
      ],
    },
    {
      title: "Operaciones",
      items: [
        { id: "bins", icon: "fas fa-warehouse", text: "Recepción Bins" },
        { id: "linea", icon: "fas fa-cogs", text: "Línea Proceso" },
        { id: "camara", icon: "fas fa-snowflake", text: "Cámaras Frío" },
        { id: "pallet", icon: "fas fa-pallet", text: "Armado Pallets" },
      ],
    },
    {
      title: "Gestión",
      items: [
        { id: "logistica", icon: "fas fa-truck", text: "Logística" },
        { id: "gestion-pedidos", icon: "fas fa-clipboard-list", text: "Gestión de Pedidos" },
        { id: "generador-qr", icon: "fas fa-qrcode", text: "Generador QR" },
      ],
    },
    {
      title: "Admin",
      items: [
        { id: "kpis", icon: "fas fa-chart-line", text: "KPIs" },
        { id: "stock", icon: "fas fa-clipboard-list", text: "Stock" },
        { id: "ajustes", icon: "fas fa-cog", text: "Ajustes" },
      ],
    },
  ];

  return (
    <aside className="sidebar-container">
      {/* Header del Sidebar */}
      <div
        className="sidebar-header"
        onClick={() => onItemClick("dashboard")}
        style={{ cursor: "pointer" }}
      >
        <div className="logo-icon">
          <i className={appIcon}></i>
        </div>
        <h1 className="logo-text">{appName}</h1>
      </div>

      {/* Menú */}
      <div className="sidebar-menu">
        {menuGroups.map((group, index) => (
          <div key={index} className="menu-group">
            <h3 className="group-title">{group.title}</h3>
            {group.items.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                text={item.text}
                active={activeItem === item.id}
                onClick={() => onItemClick(item.id)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer — Usuario + Logout */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">AD</div>
          <div className="user-details">
            <span className="user-name">Admin</span>
            <span className="user-role">Supervisor de Planta</span>
          </div>
        </div>

        <Logout
          label={
            <i className="fas fa-sign-out-alt" style={{ fontSize: "20px" }} />
          }
        />
      </div>
    </aside>
  );
};

export default Sidebar;
