import React from 'react'
import "../../style/camara.css"; 

// Hacemos los datos dinámicos para que sea más fácil de gestionar
const cameraData = [
  { id: 1, nombre: "Cámara 1", temp: "9.0°C", pallets: 12, status: "normal" },
  { id: 2, nombre: "Cámara 2", temp: "9.2°C", pallets: 24, status: "normal" },
  { id: 3, nombre: "Cámara 3", temp: "12.1°C", pallets: 8, status: "alerta" }, // Status 'alerta' para la temp alta
];

const CamaraFrio = () => {
    return (
    // Contenedor principal para esta página
    <div className="camara-container" id="camara">
      <div className="dashboard-header">
          <h2>Cámaras</h2>
          <div className="dashboard-user-info">
            <i className="fas fa-user-circle"></i>
            <span>Administrador</span>
          </div>
        </div>
      {/* Tarjeta principal */}
      <div className="camara-card">
        <h3 className="camara-title">Mapa de Cámaras</h3>
        
        {/* Grid para las cajas de información */}
        <div className="camara-grid">
          
          {/* Mapeamos los datos de las cámaras */}
          {cameraData.map((camara) => (
            <div 
              key={camara.id} 
              // Aplicamos la clase de alerta condicionalmente
              className={`camara-box ${camara.status === 'alerta' ? 'status-alerta' : ''}`}
            >
              <div className="camara-box-title">{camara.nombre}</div>
              <div className="camara-box-info">
                {/* Añadimos iconos para más claridad */}
                <i className="fas fa-thermometer-half"></i> 
                Temp: {camara.temp}
              </div>
              <div className="camara-box-info">
                <i className="fas fa-pallet"></i> 
                Pallets: {camara.pallets}
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}

export default CamaraFrio