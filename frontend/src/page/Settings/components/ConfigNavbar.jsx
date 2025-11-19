import React, { useState, useEffect, useCallback } from "react";
import "../../../style/confignavbar.css";

// Definición de las categorías y sus items (Fuera del componente, es data estática)
const menuItems = {
  sensores: {
    label: "Sensores IoT",
    icon: "fas fa-microchip",
    items: [
      { id: "sensores", label: "Gestión de Sensores", icon: "fas fa-list" },
      { id: "umbrales", label: "Umbrales y Alertas", icon: "fas fa-thermometer-half" },
      { id: "calibracion", label: "Calibración", icon: "fas fa-tools" }
    ]
  },
  usuarios: {
    label: "Usuarios y Roles",
    icon: "fas fa-users",
    items: [
      { id: "usuarios", label: "Usuarios de la Empresa", icon: "fas fa-user-friends" },
      { id: "transporte", label: "Transportes y Choferes", icon: "fas fa-truck-moving" },
      { id: "productores", label: "Productores", icon: "fas fa-tractor" },
    ]
  },
  notificaciones: {
    label: "Notificaciones",
    icon: "fas fa-bell",
    items: [
      { id: "alertas", label: "Configuración Alertas", icon: "fas fa-exclamation-triangle" },
      { id: "canales", label: "Canales de Notificación", icon: "fas fa-comment-alt" },
      { id: "plantillas", label: "Plantillas de Mensajes", icon: "fas fa-envelope" }
    ]
  }
};

const ConfigNavbar = ({ activePanel, onPanelChange }) => {
  const [activeCategory, setActiveCategory] = useState(null);

  // Función para cerrar el submenú
  const closeSubmenu = useCallback(() => {
    setActiveCategory(null);
  }, []);

  const toggleSubmenu = (categoria) => {
    setActiveCategory(activeCategory === categoria ? null : categoria);
  };

  const cargarPanel = (panel) => {
    onPanelChange(panel);
    closeSubmenu(); // Cerrar submenú al seleccionar
  };

  // Efecto para escuchar la tecla ESC para cerrar el submenú (Mejora de accesibilidad)
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        closeSubmenu();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [closeSubmenu]);

  return (
    <div className="config-navbar-horizontal">
      <nav className="navbar-horizontal">
        {/* Mapeo dinámico sobre todas las categorías */}
        {Object.entries(menuItems).map(([key, categoria]) => (
          <div 
            key={key} 
            className="navbar-categoria-horizontal"
          >
            {/* Header de la Categoría */}
            <div
              className={`navbar-header-horizontal ${activeCategory === key ? "active" : ""}`}
              onClick={() => toggleSubmenu(key)}
              aria-expanded={activeCategory === key} // Accesibilidad ARIA
              aria-controls={`submenu-${key}`} // Accesibilidad ARIA
              role="button" // Indica que es un elemento interactivo
              tabIndex="0" // Permite enfocar con el teclado
            >
              <i className={categoria.icon}></i>
              <span>{categoria.label}</span>
              <i className="fas fa-chevron-down"></i>
            </div>
            
            {/* Submenú */}
            <div 
              id={`submenu-${key}`} // ID para ARIA
              className={`navbar-submenu-horizontal ${activeCategory === key ? "active" : ""}`}
            >
              {categoria.items.map(item => (
                <div 
                  key={item.id}
                  className={`navbar-item-horizontal ${activePanel === item.id ? "active" : ""}`} 
                  onClick={() => cargarPanel(item.id)}
                  role="menuitem" // Accesibilidad ARIA
                  tabIndex="0" // Permite enfocar con el teclado
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>
      

    </div>
  );
};

export default ConfigNavbar;