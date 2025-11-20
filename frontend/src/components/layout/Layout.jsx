import React from 'react';
import Sidebar from "./SideBar"; // Asumo que SideBar.jsx está en la misma carpeta

const Layout = ({ children, activeItem, onItemClick }) => {
  return (
    <div className="dashboard-container">
      {/* El Sidebar simplemente recibe el estado activo y la función de click */}
      <Sidebar activeItem={activeItem} onItemClick={onItemClick} />
      
      <div>
        {/* 'children' será el componente de la ruta activa (ej: BinsPage) */}
        {children}
      </div>
    </div>
  );
};

export default Layout;