import React, { useState, useEffect, useCallback } from "react";
import "../../../style/confignavbar.css";

// Definición de las categorías y sus items (Fuera del componente, es data estática)
const menuItems = {
  // 1. MODIFICACIÓN: La categoría 'camaras' ahora tiene una propiedad 'panel' y ya no necesita 'items'.
  camaras: {
    label: "Cámaras",
    icon: "fa-solid fa-snowflake",
    panel: "camaras", // Identificador del panel a cargar directamente
  },
  usuarios: {
    label: "Usuarios y Roles",
    icon: "fas fa-users",
    items: [
      {
        id: "usuarios",
        label: "Usuarios de la Empresa",
        icon: "fas fa-user-friends",
      },
      {
        id: "transporte",
        label: "Transportes y Choferes",
        icon: "fas fa-truck-moving",
      },
      { id: "productores", label: "Productores", icon: "fas fa-tractor" },
    ],
  },
productos: {
    label: "Productos",
    icon: "fa-solid fa-bars",
    panel: "productos", 
  },
};

const ConfigNavbar = ({ activePanel, onPanelChange }) => {
  const [activeCategory, setActiveCategory] = useState(null);

  // Función para cerrar el submenú
  const closeSubmenu = useCallback(() => {
    setActiveCategory(null);
  }, []);

  // Nueva función para manejar el click en la categoría
  const handleCategoryClick = (key, categoria) => {
    // Si la categoría tiene la propiedad 'panel' (acción directa)
    if (categoria.panel) {
      onPanelChange(categoria.panel);
      closeSubmenu(); // Cierra cualquier otro submenú que esté abierto
    }
    // Si tiene 'items' (submenú)
    else if (categoria.items && categoria.items.length > 0) {
      // Alterna la visibilidad del submenú
      setActiveCategory(activeCategory === key ? null : key);
    }
  };

  const cargarPanel = (panel) => {
    onPanelChange(panel);
    closeSubmenu(); // Cerrar submenú al seleccionar
  };

  // Efecto para escuchar la tecla ESC para cerrar el submenú (Mejora de accesibilidad)
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        closeSubmenu();
      }
    };
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [closeSubmenu]);

  return (
    <div className="config-navbar-horizontal">
      <nav className="navbar-horizontal">
        {Object.entries(menuItems).map(([key, categoria]) => {
          const isDirectAction = !!categoria.panel;
    
    // 🎯 NUEVA LÓGICA DE ACTIVACIÓN DE CATEGORÍA PADRE
    const isItemActive = categoria.items 
        ? categoria.items.some(item => item.id === activePanel) 
        : false;

    const isActive = isDirectAction 
        ? activePanel === categoria.panel 
        : activeCategory === key || isItemActive;

          return (
            <div key={key} className="navbar-categoria-horizontal">
              {/* Header de la Categoría */}
              <div
                className={`navbar-header-horizontal ${
                  isActive ? "active" : ""
                }`}
                onClick={() => handleCategoryClick(key, categoria)}
                aria-expanded={isActive && !isDirectAction} // Solo expandible si es submenú
                aria-controls={!isDirectAction ? `submenu-${key}` : undefined}
                role="button"
                tabIndex="0"
              >
                <i className={categoria.icon}></i>
                <span>{categoria.label}</span>
                {!isDirectAction && <i className="fas fa-chevron-down"></i>}
              </div>
              {categoria.items && categoria.items.length > 0 && (
                <div
                  id={`submenu-${key}`} // ID para ARIA
                  className={`navbar-submenu-horizontal ${
                    activeCategory === key ? "active" : ""
                  }`}
                >
                  {categoria.items.map((item) => (
                    <div
                      key={item.id}
                      className={`navbar-item-horizontal ${
                        activePanel === item.id ? "active" : ""
                      }`}
                      onClick={() => cargarPanel(item.id)}
                      role="menuitem"
                      tabIndex="0"
                    >
                      <i className={item.icon}></i>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default ConfigNavbar;
