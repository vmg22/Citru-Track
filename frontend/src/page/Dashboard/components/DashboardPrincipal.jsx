import React, { useState, useEffect } from "react";
import MapaLogistica from "./MapaLogistica";
import "../../../style/DashboardPrincipal.css";
import { Link } from "react-router-dom";

// Componente Button Reutilizable
const Button = ({ children, onClick, className = "", icon }) => {
  return (
    <button onClick={onClick} className={`dashboard-button ${className}`}>
      {icon && <i className={icon}></i>}
      {children}
    </button>
  );
};

// Componente Card Reutilizable
const Card = ({ title, icon, iconClass, children }) => {
  return (
    <div className="dashboard-card-item">
      <div className="dashboard-card-header">
        <div className="dashboard-card-title">{title}</div>
        <div className={`dashboard-card-icon ${iconClass}`}>
          <i className={icon}></i>
        </div>
      </div>
      <div className="dashboard-card-content">
        {children}
      </div>
    </div>
  );
};

// Componente Status Badge
const StatusBadge = ({ status }) => {
  return (
    <span
      className={`dashboard-status dashboard-status-${status.toLowerCase()}`}
    >
      {status}
    </span>
  );
};

// Componente Conveyor CON COLORES
const Conveyor = () => {
  // Configuración de colores por tipo de fruta
  const fruitColors = {
    LIM: {
      background: 'linear-gradient(135deg, #C6D84F 0%, #9FB92C 100%)',
      color: '#2D5016',
      shadow: '0 4px 6px rgba(159, 185, 44, 0.4)',
      emoji: '🍋',
      name: 'Limón'
    },
    ORA: {
      background: 'linear-gradient(135deg, #FF9F40 0%, #FF7F00 100%)',
      color: '#8B4000',
      shadow: '0 4px 6px rgba(255, 127, 0, 0.4)',
      emoji: '🍊',
      name: 'Naranja'
    },
    MAN: {
      background: 'linear-gradient(135deg, #FFB347 0%, #FF8C00 100%)',
      color: '#CC6600',
      shadow: '0 4px 6px rgba(255, 140, 0, 0.4)',
      emoji: '🍊',
      name: 'Mandarina'
    }
  };

  const boxes = [
    { text: "LIM", delay: "0s" },
    { text: "ORA", delay: "3s" },
    { text: "MAN", delay: "6s" },
    { text: "LIM", delay: "9s" },
    { text: "ORA", delay: "12s" },
  ];

  return (
    <div className="dashboard-conveyor-container">
      <div className="dashboard-conveyor-belt"></div>
      {boxes.map((box, index) => {
        const colorConfig = fruitColors[box.text];
        return (
          <div
            key={index}
            className="dashboard-box"
            style={{ 
              animationDelay: box.delay,
              background: colorConfig.background,
              color: colorConfig.color,
              boxShadow: colorConfig.shadow,
              border: `2px solid ${colorConfig.color}20`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              fontWeight: 'bold',
              fontSize: '11px',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}
            title={colorConfig.name}
          >
            <span style={{ fontSize: '18px' }}>{colorConfig.emoji}</span>
            <span>{box.text}</span>
          </div>
        );
      })}
    </div>
  );
};

// Componente Table
const Table = ({ headers, rows }) => {
  return (
    <div className="dashboard-table-container">
      <table className="dashboard-table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Componente KPI
const KPIItem = ({ value, label, status }) => {
  return (
    <div className="dashboard-kpi-item">
      <div className={`dashboard-kpi-value dashboard-kpi-${status}`}>
        {value}
      </div>
      <div className="dashboard-kpi-label">{label}</div>
    </div>
  );
};

// Componente Alert
const Alert = ({ title, description }) => {
  return (
    <div className="dashboard-alerta">
      <i className="fas fa-exclamation-triangle"></i>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
};

// ==================== Componente Principal ====================

const DashboardPrincipal = () => {


  useEffect(() => {
    console.log("✅ Dashboard montado correctamente");
    const interval = setInterval(() => {
      console.log("Actualizando datos...");
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const lotesData = [
    ["LIM00123", "Limón", <StatusBadge key="s1" status="Normal" />],
    ["ORA00456", "Naranja", <StatusBadge key="s2" status="Alerta" />],
    ["MAN00789", "Mandarina", <StatusBadge key="s3" status="Transito" />],
  ];

  const condicionesData = [
    [
      "T1A3121430LIM00123K",
      "Limón",
      "10.2°C",
      "67%",
      <StatusBadge key="c1" status="Normal" />,
    ],
    [
      "T1A3121431LIM00123J",
      "Limón",
      "12.5°C",
      "65%",
      <StatusBadge key="c2" status="Alerta" />,
    ],
    [
      "T2B3121450ORA00456A",
      "Naranja",
      "8.7°C",
      "70%",
      <StatusBadge key="c3" status="Normal" />,
    ],
  ];

  const viajesData = [
    [
      "#12",
      "Carlos Gómez",
      "Aeropuerto Tucumán",
      <StatusBadge key="v1" status="Transito" />,
      "5.4°C",
    ],
    [
      "#13",
      "María López",
      "Mercado Central Bs.As.",
      <StatusBadge key="v2" status="Transito" />,
      "6.2°C",
    ],
    [
      "#14",
      "Juan Pérez",
      "Puerto Rosario",
      <StatusBadge key="v3" status="Normal" />,
      "-",
    ],
  ];

  return (
    <>
      {/* Estos links es mejor moverlos al index.html 
        o cargarlos en App.js para que no se recarguen
        en cada cambio de página.
      */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      {/* Este div "dashboard-container" es el del Layout, 
        y "dashboard-main-content" también.
        Tu componente de página no debería re-declararlos.
        
        El Layout ya provee:
        <div className="dashboard-container">
          <Sidebar />
          <div className="dashboard-main-content">
             ... (Aquí se renderiza DashboardPrincipal) ...
          </div>
        </div>

        Por lo tanto, DashboardPrincipal SÓLO debe renderizar 
        el contenido de la página.
      */}
      
      {/* Quitamos <div className="dashboard-container">
        Quitamos <div className="dashboard-main-content">
      */}
      
        <div className="dashboard-header">
          <h2>Dashboard Principal</h2>
          <div className="dashboard-user-info">
            <i className="fas fa-user-circle"></i>
            <span>Administrador</span>
          </div>
        </div>

        <div className="dashboard-cards-container">
          <Link to="/monitoreo" className="dashboard-card-link" style={{textDecoration:"none"}}>
          <Card
            title="Monitoreo en Tiempo Real"
            icon="fas fa-eye"
            iconClass="monitoring"
          >
            <p>
              Visualice el flujo de cajas en la planta y condiciones de
              transporte en tiempo real.
            </p>
            <Conveyor />
          </Card>
          </Link>
          

          <Card
            title="Gestión de Lotes"
            icon="fas fa-boxes"
            iconClass="lotes"
          >
            <p>
              Registre, consulte y audite lotes y productos con trazabilidad
              completa.
            </p>
            <Table
              headers={["ID Lote", "Producto", "Estado"]}
              rows={lotesData}
            />
          </Card>

          <Card
            title="Logística y Rutas"
            icon="fas fa-truck"
            iconClass="logistica"
          >
            <p>
              Monitoree viajes, vehículos y condiciones en trayecto con mapas
              interactivos.
            </p>
            <div className="dashboard-map-container">
              <MapaLogistica />
            </div>
          </Card>

          <Card
            title="Dashboard de KPIs"
            icon="fas fa-chart-line"
            iconClass="kpis"
          >
            <p>
              Métricas clave de calidad y eficiencia con gráficos y
              comparativas.
            </p>
            <div className="dashboard-kpi-container">
              <KPIItem value="96.5%" label="Puntualidad" status="good" />
              <KPIItem
                value="2.4%"
                label="Rupturas de Frío"
                status="warning"
              />
            </div>
          </Card>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-left">
            <div className="dashboard-info-card">
              <h3>Condiciones Actuales</h3>
              <Table
                headers={[
                  "ID Caja",
                  "Producto",
                  "Temperatura",
                  "Humedad",
                  "Estado",
                ]}
                rows={condicionesData}
              />
            </div>

            <div className="dashboard-info-card">
              <h3>Viajes Activos</h3>
              <Table
                headers={[
                  "ID Viaje",
                  "Chofer",
                  "Destino",
                  "Estado",
                  "Temperatura Media",
                ]}
                rows={viajesData}
              />
            </div>
          </div>

          <div className="dashboard-right">
            <div className="dashboard-info-card">
              <h3>Alertas Activas</h3>
              <div className="dashboard-alertas-container">
                <Alert
                  title="Ruptura de frío detectada"
                  description="Caja T1A3121431LIM00123J - Temperatura: 12.5°C"
                />
                <Alert
                  title="Vibración excesiva"
                  description="Camión AB 123 CD - Viaje #12"
                />
              </div>
            </div>

            <div className="dashboard-info-card">
              <h3>KPIs Principales</h3>
              <div className="dashboard-kpi-container">
                <KPIItem
                  value="99.7%"
                  label="Lecturas Correctas"
                  status="good"
                />
                <KPIItem
                  value="1.8%"
                  label="Merma Promedio"
                  status="warning"
                />
                <KPIItem
                  value="87.3"
                  label="Costo por Caja ($)"
                  status="good"
                />
                <KPIItem value="12" label="Alertas Críticas" status="bad" />
              </div>
            </div>
          </div>
        </div>
      {/* Se quitan los </div> de cierre de 
        'dashboard-main-content' y 'dashboard-container'
      */}
    </>
  );
};

export default DashboardPrincipal;