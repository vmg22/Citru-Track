import React, { useState, useEffect } from 'react'
import "../../style/camara.css"; 
import { getAllCamaras } from './service/camaraService';

const CamaraFrio = () => {
  const [camaras, setCamaras] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllCamaras();
        setCamaras(data);
      } catch (error) {
        console.error("Error al cargar datos de las cámaras:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Función para determinar el estado basado en la temperatura
  const getStatus = (temperatura) => {
    const temp = parseFloat(temperatura);
    return temp > 20 ? 'alerta' : 'normal';
  };

  if (loading) {
    return (
      <div className="camara-container">
        <div className="dashboard-header">
          <h2>Cámaras</h2>
          <div className="dashboard-user-info">
            <i className="fas fa-user-circle"></i>
            <span>Administrador</span>
          </div>
        </div>
        <div className="loading">Cargando cámaras...</div>
      </div>
    );
  }

  return (
    <div className="camara-container" id="camara">
      <div className="monitoreo-header">
            <h2>
              <i className="fa-solid fa-snowflake"></i> Cámaras de Frío
            </h2>
            <div className="monitoreo-user-info">
              <i className="fas fa-user-circle"></i>
              <span>Supervisor de Planta</span>
            </div>
          </div>
      
      <div className="camara-card">
        <h3 className="camara-title">Mapa de Cámaras</h3>
        
        <div className="camara-grid">
          {camaras.data.map((camara) => (
            <div 
              key={camara.camara_id} 
              className={`camara-box ${getStatus(camara.temperatura_aproximada) === 'alerta' ? 'status-alerta' : ''}`}
            >
              <div className="camara-box-title">{camara.nombre}</div>
              <div className="camara-box-info">
                <i className="fas fa-thermometer-half"></i> 
                Temp: {camara.temperatura_aproximada}°C
              </div>
              <div className="camara-box-info">
                <i className="fas fa-pallet"></i> 
                Pallets: {camara.capacidad_pallets}
              </div>
              <div className="camara-box-info">
                <i className="fas fa-map-marker-alt"></i> 
                {camara.ubicacion}
              </div>
              <div className="camara-box-info">
                <i className="fas fa-calendar"></i> 
                Creada: {new Date(camara.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CamaraFrio;