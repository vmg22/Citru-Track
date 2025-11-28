import React, { useState, useEffect } from "react";
import stockService from "../../services/stockService";
import "../../style/stock.css";
import { getAllProductosActivos } from "../Settings/services/settingsServices";

const Stock = () => {
  // Estado para datos de stock
  const [stockData, setStockData] = useState({
    totales: {
      total_pallets: 0,
      total_cajas: 0,
      peso_total: 0,
    },
    porEstado: [],
    porProducto: [],
    porUbicacion: [],
  });

  // Estado para filtros
  const [filtros, setFiltros] = useState({
    producto_id: "",
    fecha_desde: "",
    fecha_hasta: "",
  });

  // Estado para productos
  const [productos, setProductos] = useState([]);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados disponibles según tu tabla
  const estadosPallet = [
    "armado",
    "en_camara",
    "reservado",
    "en_transporte",
    "despachado",
    "anulado",
  ];

  // Colores para cada estado
  const coloresEstado = {
    armado: "#3498db",
    en_camara: "#2ecc71",
    reservado: "#f39c12",
    en_transporte: "#9b59b6",
    despachado: "#95a5a6",
    anulado: "#e74c3c",
  };

  // Etiquetas amigables para estados
  const etiquetasEstado = {
    armado: "Armado",
    en_camara: "En Cámara",
    reservado: "Reservado",
    en_transporte: "En Transporte",
    despachado: "Despachado",
    anulado: "Anulado",
  };

  // Función para obtener datos del stock
  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await stockService.getResumenStock(filtros);

      setStockData(data);
    } catch (err) {
      console.error("Error al obtener datos de stock:", err);
      setError(
        "Error al cargar los datos de stock. Por favor, intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  // Obtener lista de productos
  const fetchProductos = async () => {
    try {
      const data = await getAllProductosActivos()
      setProductos(data);
    } catch (err) {
      console.error("Error al obtener productos:", err);
    }
  };

  // Efecto inicial: cargar productos y stock
  useEffect(() => {
    fetchProductos();
  }, []);

  // Efecto: actualizar stock cuando cambian los filtros
  useEffect(() => {
    fetchStockData();
  }, [filtros]);

  // Calcular porcentaje para gráfico circular
  const calcularPorcentaje = (valor, total) => {
    if (!total || total === 0) return 0;
    return ((valor / total) * 100).toFixed(1);
  };

  // Obtener cantidad de cajas por estado
  const getCajasPorEstado = (estado) => {
    const estadoData = stockData.porEstado.find((e) => e.estado === estado);
    return estadoData ? estadoData.cantidad_cajas : 0;
  };

  // Componente de gráfico circular
  const GraficoCircular = ({ porcentaje, color, label, cantidad }) => {
    const radio = 45;
    const circunferencia = 2 * Math.PI * radio;
    const offset = circunferencia - (porcentaje / 100) * circunferencia;

    return (
      <div className="stock-grafico-circular">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            className="stock-circulo-fondo"
            cx="60"
            cy="60"
            r={radio}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="10"
          />
          <circle
            className="stock-circulo-progreso"
            cx="60"
            cy="60"
            r={radio}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circunferencia}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{
              transition: "stroke-dashoffset 0.5s ease",
            }}
          />
          <text
            x="60"
            y="55"
            className="stock-porcentaje-texto"
            textAnchor="middle"
          >
            {porcentaje}%
          </text>
          <text
            x="60"
            y="72"
            className="stock-cantidad-texto"
            textAnchor="middle"
          >
            {cantidad}
          </text>
        </svg>
        <p className="stock-label-grafico">{label}</p>
      </div>
    );
  };

  // Manejador de cambio de filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({ producto_id: "", fecha_desde: "", fecha_hasta: "" });
  };

  // Renderizado de loading
  if (loading && !stockData.totales) {
    return (
      <div className="stock-container">
        <div className="stock-loading">
          <div className="stock-spinner"></div>
          <p>Cargando datos de stock...</p>
        </div>
      </div>
    );
  }

  // Renderizado de error
  if (error) {
    return (
      <div className="stock-container">
        <div className="stock-error">
          <span className="stock-error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={fetchStockData} className="stock-btn-reintentar">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-container">
      {/* Header */}
      <div className="stock-header">
        <h1 className="stock-title"><i className="fas fa-clipboard-list"></i> Stock en Tiempo Real</h1>
        <div className="monitoreo-user-info">
          <i className="fas fa-user-circle"></i>
          <span>Supervisor de Planta</span>
        </div>
      </div>



      {/* Filtros */}
      <div className="stock-filtros">
        <div className="stock-filtro-grupo">
          <label className="stock-label">Producto:</label>
          <select
            name="producto_id"
            value={filtros.producto_id}
            onChange={handleFiltroChange}
            className="stock-select"
          >
            <option value="">Todos los productos</option>
            {productos.map((producto) => (
              <option key={producto.producto_id} value={producto.producto_id}>
                {producto.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="stock-filtro-grupo">
          <label className="stock-label">Fecha desde:</label>
          <input
            type="date"
            name="fecha_desde"
            value={filtros.fecha_desde}
            onChange={handleFiltroChange}
            className="stock-input-date"
          />
        </div>

        <div className="stock-filtro-grupo">
          <label className="stock-label">Fecha hasta:</label>
          <input
            type="date"
            name="fecha_hasta"
            value={filtros.fecha_hasta}
            onChange={handleFiltroChange}
            className="stock-input-date"
          />
        </div>

        <button onClick={limpiarFiltros} className="stock-btn-limpiar">
          Limpiar Filtros
        </button>
      </div>

      {/* Cards principales de totales */}
<div className="stock-cards-principales">
  <div className="stock-card stock-card-total">
    <div className="stock-card-icon">
      <i className="fas fa-boxes"></i>
    </div>
    <div className="stock-card-content">
      <h3 className="stock-card-titulo">Total Cajas</h3>
      <p className="stock-card-numero">
        {stockData.totales.total_cajas.toLocaleString("es-AR")}
      </p>
    </div>
  </div>

  <div className="stock-card stock-card-pallets">
    <div className="stock-card-icon">
      <i className="fas fa-pallet"></i>
    </div>
    <div className="stock-card-content">
      <h3 className="stock-card-titulo">Total Pallets</h3>
      <p className="stock-card-numero">
        {stockData.totales.total_pallets.toLocaleString("es-AR")}
      </p>
    </div>
  </div>

  <div className="stock-card stock-card-peso">
    <div className="stock-card-icon">
      <i className="fas fa-weight-hanging"></i>
    </div>
    <div className="stock-card-content">
      <h3 className="stock-card-titulo">Peso Total (kg)</h3>
      <p className="stock-card-numero">
        {parseFloat(stockData.totales.peso_total).toLocaleString(
          "es-AR",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}
      </p>
    </div>
  </div>

  <div className="stock-card stock-card-promedio">
    <div className="stock-card-icon">
      <i className="fas fa-calculator"></i>
    </div>
    <div className="stock-card-content">
      <h3 className="stock-card-titulo">Promedio Cajas/Pallet</h3>
      <p className="stock-card-numero">
        {stockData.totales.total_pallets > 0
          ? (
              stockData.totales.total_cajas /
              stockData.totales.total_pallets
            ).toFixed(1)
          : "0"}
      </p>
    </div>
  </div>
</div>

      {/* Stock por Estado con gráficos circulares */}
      <div className="stock-seccion">
        <h2 className="stock-seccion-titulo">Estado de Planta</h2>
        <div className="stock-graficos-grid">
          {estadosPallet.map((estado) => {
            const cajas = getCajasPorEstado(estado);
            const porcentaje = calcularPorcentaje(
              cajas,
              stockData.totales.total_cajas
            );

            return (
              <div key={estado} className="stock-card-grafico">
                <GraficoCircular
                  porcentaje={porcentaje}
                  color={coloresEstado[estado]}
                  label={etiquetasEstado[estado]}
                  cantidad={cajas.toLocaleString("es-AR")}
                />
                <div className="stock-grafico-info">
                  <p className="stock-info-label">Cajas</p>
                  <p className="stock-info-pallets">
                    {stockData.porEstado.find((e) => e.estado === estado)
                      ?.cantidad_pallets || 0}{" "}
                    pallets
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stock por Producto */}
      <div className="stock-seccion">
        <h2 className="stock-seccion-titulo">Stock por Producto</h2>
        {stockData.porProducto.length > 0 ? (
          <div className="stock-productos-grid">
            {stockData.porProducto.map((producto) => {
              const porcentaje = calcularPorcentaje(
                producto.cantidad_cajas,
                stockData.totales.total_cajas
              );

              return (
                <div key={producto.producto_id} className="stock-card-producto">
                  <div className="stock-producto-header">
                    <h3 className="stock-producto-nombre">
                      {producto.producto_nombre}
                    </h3>
                    {producto.categoria && (
                      <span className="stock-producto-categoria">
                        {producto.categoria}
                      </span>
                    )}
                  </div>

                  <div className="stock-producto-stats">
                    <div className="stock-producto-stat">
                      <span className="stock-stat-label">📦 Cajas:</span>
                      <span className="stock-stat-valor">
                        {producto.cantidad_cajas.toLocaleString("es-AR")}
                      </span>
                    </div>
                    <div className="stock-producto-stat">
                      <span className="stock-stat-label">🚛 Pallets:</span>
                      <span className="stock-stat-valor">
                        {producto.cantidad_pallets}
                      </span>
                    </div>
                    <div className="stock-producto-stat">
                      <span className="stock-stat-label">⚖️ Peso:</span>
                      <span className="stock-stat-valor">
                        {parseFloat(producto.peso_total).toLocaleString(
                          "es-AR",
                          {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          }
                        )}{" "}
                        kg
                      </span>
                    </div>
                    <div className="stock-producto-stat">
                      <span className="stock-stat-label">📊 Porcentaje:</span>
                      <span className="stock-stat-valor stock-stat-porcentaje">
                        {porcentaje}%
                      </span>
                    </div>
                  </div>

                  <div className="stock-producto-barra">
                    <div
                      className="stock-producto-barra-progreso"
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="stock-sin-datos">
            <p>No hay productos con stock en el período seleccionado</p>
          </div>
        )}
      </div>

      {/* Stock por Ubicación (si hay datos) */}
      {stockData.porUbicacion && stockData.porUbicacion.length > 0 && (
        <div className="stock-seccion">
          <h2 className="stock-seccion-titulo">
           Stock por Ubicación en Camara
          </h2>
          <div className="stock-ubicaciones-grid">
            {stockData.porUbicacion.map((ubicacion, index) => (
              <div key={index} className="stock-card-ubicacion">
                <div className="stock-ubicacion-nombre">
                  {ubicacion.ubicacion_nombre || "Sin ubicación"}
                </div>
                <div className="stock-ubicacion-datos">
                  <div className="stock-ubicacion-stat">
                    <span>Pallets:</span>
                    <strong>{ubicacion.cantidad_pallets}</strong>
                  </div>
                  <div className="stock-ubicacion-stat">
                    <span>Cajas:</span>
                    <strong>
                      {ubicacion.cantidad_cajas.toLocaleString("es-AR")}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;
