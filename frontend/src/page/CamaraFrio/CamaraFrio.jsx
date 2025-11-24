import React, { useState, useEffect } from "react";
import "../../style/camara.css";
import { getAllCamaras } from "./service/camaraService";

const CamaraFrio = () => {
  const [camaras, setCamaras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAllCamaras();
        setCamaras(response.data);
      } catch (error) {
        console.error("Error al cargar datos de las cámaras:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatus = (temperatura) => {
    const temp = parseFloat(temperatura);
    return temp > 20 ? "alerta" : "normal";
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
          {camaras.map((camara) => {
            const isAlert =
              getStatus(camara.temperatura_aproximada) === "alerta";
            const ocupacion = camara.pallets_en_uso;
            const capacidad = camara.capacidad_pallets;
            const porcentaje = camara.porcentaje_ocupacion;

            let occupancyStatusClass = "";
            if (porcentaje >= 90) {
              occupancyStatusClass = "status-lleno";
            } else if (porcentaje > 70) {
              occupancyStatusClass = "status-alto";
            }

            return (
              <div
                key={camara.camara_id}
                className={`camara-box ${isAlert ? "status-alerta" : ""} ${occupancyStatusClass}`}
              >
                <div className="camara-box-title">{camara.nombre}</div>

                <div className="camara-box-info camara-box-stock">
                  <i className="fas fa-pallet"></i>
                  Stock Actual: {ocupacion} / {capacidad} pallets
                </div>

                <div className="camara-box-info camara-box-ocupacion">
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar"
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                  <span className="porcentaje mx-3">
                    {porcentaje}% Ocupado
                  </span>
                </div>

                <div className="camara-box-info">
                  <i className="fas fa-thermometer-half"></i>
                  Temperatura: {camara.temperatura_aproximada}°C
                </div>

                <div className="camara-box-info">
                  <i className="fas fa-tint"></i>
                  Humedad: {camara.humedad_optima}%
                </div>

                <div className="camara-box-info">
                  <i className="fas fa-tachometer-alt"></i>
                  Presión: {camara.presion_optima} kPa
                </div>

                <div className="camara-box-info">
                  <i className="fas fa-map-marker-alt"></i>
                  {camara.ubicacion}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CamaraFrio;
