import React, { useState, useEffect } from 'react';
// CORRECCIÓN 1: Importar todo el objeto con el alias
import * as procesoService from './services/procesoService'; 
import ModalRegistrarProceso from './ModalRegistrarProceso';
import ModalHistorialBin from './ModalHistorialBin';
import '../../style/lineaproceso.css';

const LineadeProceso = () => {
  // Estados
  const [productos, setProductos] = useState([]);
  const [variedadesDisponibles, setVariedadesDisponibles] = useState([]);
  const [bins, setBins] = useState([]);
  const [binSeleccionado, setBinSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  // Filtros
  const [filtros, setFiltros] = useState({
    producto_id: '',
    variedad_id: '',
    estado: ''
  });

  // Modales
  const [modalRegistrar, setModalRegistrar] = useState(false);
  const [modalHistorial, setModalHistorial] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    cargarProductos();
    cargarBins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar bins cuando cambian los filtros
  useEffect(() => {
    if (filtros.producto_id || filtros.variedad_id || filtros.estado) {
      cargarBins();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const cargarProductos = async () => {
    try {
      // CORRECCIÓN 2: Usar el nombre real de la función en el servicio
      const response = await procesoService.getProductosConVariedades();
      setProductos(response.data || []);
    } catch (err) {
      console.error('Error cargando productos:', err);
    }
  };

  const cargarBins = async () => {
    try {
      setLoading(true);
      const filtrosLimpios = Object.fromEntries(
        Object.entries(filtros).filter(([, v]) => v !== '')
      );
      // CORRECCIÓN 3: Usar el nombre real de la función en el servicio
      const response = await procesoService.getBinsConFiltros(filtrosLimpios);
      setBins(response.data || []);
    } catch (err) {
      setError('Error al cargar bins');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductoChange = (e) => {
    const productoId = e.target.value;
    setFiltros({ ...filtros, producto_id: productoId, variedad_id: '' });
    
    const producto = productos.find(p => p.producto_id === parseInt(productoId));
    setVariedadesDisponibles(producto?.variedades || []);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros({ ...filtros, [campo]: valor });
  };

  const limpiarFiltros = () => {
    setFiltros({ producto_id: '', variedad_id: '', estado: '' });
    setVariedadesDisponibles([]);
    cargarBins(); // Esto recargará los bins sin filtros
  };

  const abrirModalRegistrar = (bin) => {
    setBinSeleccionado(bin);
    setModalRegistrar(true);
  };

  const abrirModalHistorial = (bin) => {
    setBinSeleccionado(bin);
    setModalHistorial(true);
  };

  const handleProcesoRegistrado = () => {
    setModalRegistrar(false);
    cargarBins();
  };

  const calcularPorcentaje = (completados, totales) => {
    if (!totales || totales === 0) return 0;
    return Math.round((completados / totales) * 100);
  };

  // Funciones de paginación
  const getPaginatedBins = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = bins.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(bins.length / itemsPerPage);

    return {
      currentItems,
      totalPages,
      totalItems: bins.length
    };
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const { totalPages } = getPaginatedBins();
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="linea-proceso-container">
      <h2>Línea de Proceso</h2>

      {/* Filtros */}
      <div className="filtros-card">
        <h3>Filtros</h3>
        <div className="filtros-grid">
          
          {/* Producto */}
          <div className="filtro-group">
            <label>Producto</label>
            <select
              value={filtros.producto_id}
              onChange={handleProductoChange}
            >
              <option value="">Todos los productos</option>
              {productos.map(producto => (
                <option key={producto.producto_id} value={producto.producto_id}>
                  {producto.producto_nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Variedad */}
          <div className="filtro-group">
            <label>Variedad</label>
            <select
              value={filtros.variedad_id}
              onChange={(e) => handleFiltroChange('variedad_id', e.target.value)}
              disabled={!filtros.producto_id}
            >
              <option value="">Todas las variedades</option>
              {variedadesDisponibles.map(variedad => (
                <option key={variedad.variedad_id} value={variedad.variedad_id}>
                  {variedad.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div className="filtro-group">
            <label>Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="Recepción">Recepción</option>
              <option value="Lavado">Lavado</option>
              <option value="Clasificación electrónica">Clasificación</option>
              <option value="Empaque">Empaque</option>
              <option value="Cámara fría">Cámara fría</option>
            </select>
          </div>

          {/* Botón limpiar */}
          <div className="filtro-group">
            <label>&nbsp;</label>
            <button className="btn-limpiar" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Lista de bins */}
      <div className="bins-lista-card">
        <div className="card-header">
          <h3>Bins en Proceso</h3>
          <span className="badge-count">{bins.length} bins</span>
        </div>

        {loading ? (
          <div className="loading">Cargando bins...</div>
        ) : bins.length === 0 ? (
          <div className="empty-state">
            <p>No hay bins que coincidan con los filtros</p>
          </div>
        ) : (
          <>
          <div className="bins-grid">
            {getPaginatedBins().currentItems.map(bin => (
              <div key={bin.bin_id} className="bin-card">
                <div className="bin-header">
                  <h4>{bin.bin_id}</h4>
                  <span className={`estado-badge ${bin.estado_actual?.toLowerCase().replace(/\s/g, '-')}`}>
                    {bin.estado_actual || 'Sin estado'}
                  </span>
                </div>

                <div className="bin-info">
                  <div className="info-row">
                    <span className="label">Producto:</span>
                    <span className="value">
                      {bin.producto_nombre} 
                      {bin.variedad_nombre && ` - ${bin.variedad_nombre}`}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Remito:</span>
                    <span className="value">{bin.remito}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Peso:</span>
                    <span className="value">{bin.peso_bruto} kg</span>
                  </div>
                  {bin.lote_descripcion && (
                    <div className="info-row">
                      <span className="label">Lote:</span>
                      <span className="value">{bin.lote_descripcion}</span>
                    </div>
                  )}
                </div>

                {/* Barra de progreso */}
                <div className="progreso-container">
                  <div className="progreso-texto">
                    <span>Progreso</span>
                    <span className="progreso-numeros">
                      {bin.procesos_completados}/{bin.procesos_totales_obligatorios}
                    </span>
                  </div>
                  <div className="barra-progreso">
                    <div 
                      className="barra-progreso-fill"
                      style={{ 
                        width: `${calcularPorcentaje(bin.procesos_completados, bin.procesos_totales_obligatorios)}%` 
                      }}
                    />
                  </div>
                  <div className="porcentaje-texto">
                    {calcularPorcentaje(bin.procesos_completados, bin.procesos_totales_obligatorios)}% completado
                  </div>
                </div>

                {/* Acciones */}
                <div className="bin-acciones">
                  <button 
                    className="btn-secundario"
                    onClick={() => abrirModalHistorial(bin)}
                  >
                    Ver Historial
                  </button>
                  <button 
                    className="btn-primario"
                    onClick={() => abrirModalRegistrar(bin)}
                  >
                    Registrar Proceso
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {getPaginatedBins().totalPages > 1 && (
            <>
              <div className="d-flex justify-content-center align-items-center mt-4 mb-3">
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </button>
                    </li>
                    
                    {getPageNumbers().map((page, index) => (
                      <li
                        key={index}
                        className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}
                      >
                        {page === '...' ? (
                          <span className="page-link">...</span>
                        ) : (
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        )}
                      </li>
                    ))}
                    
                    <li className={`page-item ${currentPage === getPaginatedBins().totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === getPaginatedBins().totalPages}
                      >
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>

              <div className="mt-3 text-muted small px-2 d-flex justify-content-between align-items-center">
                <span>
                  Mostrando {getPaginatedBins().currentItems.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, getPaginatedBins().totalItems)} de {getPaginatedBins().totalItems} bins
                </span>
                <span>
                  Página {currentPage} de {getPaginatedBins().totalPages || 1}
                </span>
              </div>
            </>
          )}
          </>
        )}
      </div>

      {/* Modales */}
      {modalRegistrar && binSeleccionado && (
        <ModalRegistrarProceso
          bin={binSeleccionado}
          onClose={() => setModalRegistrar(false)}
          onSuccess={handleProcesoRegistrado}
        />
      )}

      {modalHistorial && binSeleccionado && (
        <ModalHistorialBin
          bin={binSeleccionado}
          onClose={() => setModalHistorial(false)}
        />
      )}
    </div>
  );
};

export default LineadeProceso;