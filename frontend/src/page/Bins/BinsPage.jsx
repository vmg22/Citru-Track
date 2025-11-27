import React, { useState, useEffect } from 'react';
import binloteServices from './services/binloteServices';
import Swal from 'sweetalert2';
import '../../style/bins.css';

const BinsPage = () => {

  const [productores, setProductores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [fincasDisponibles, setFincasDisponibles] = useState([]);
  const [variedadesDisponibles, setVariedadesDisponibles] = useState([]);
  const [binsRecientes, setBinsRecientes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [formData, setFormData] = useState({
    producto_id: '',
    variedad_id: '',
    productor_id: '',
    finca_id: '',
    fecha_cosecha: '',
    peso_bruto: '',
    remito: '',
    observaciones: '',
    responsable: 'Admin'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [remitoValido, setRemitoValido] = useState(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [productoresData, productosData, binsData] = await Promise.all([
        binloteServices.getProductores(),
        binloteServices.getProductos(),
        binloteServices.getBinsRecientes(10)
      ]);

      setProductores(productoresData.data || []);
      setProductos(productosData.data || []);
      setBinsRecientes(binsData.data || []);

    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
      setError('Error al cargar los datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const handleProductorChange = (e) => {
    const productorId = parseInt(e.target.value);
    setFormData({
      ...formData,
      productor_id: productorId,
      finca_id: ''
    });

    const productor = productores.find(p => p.productor_id === productorId);
    setFincasDisponibles(productor?.fincas || []);
  };

  const handleProductoChange = (e) => {
    const productoId = parseInt(e.target.value);
    setFormData({
      ...formData,
      producto_id: productoId,
      variedad_id: ''
    });

    const producto = productos.find(p => p.producto_id === productoId);
    setVariedadesDisponibles(producto?.variedades || []);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRemitoBlur = async (e) => {
    const remito = e.target.value;
    if (remito.length < 3) {
      setRemitoValido(null);
      return;
    }

    try {
      const response = await binloteServices.validarRemito(remito);
      setRemitoValido(!response.existe);
      if (response.existe) {
        setError('⚠️ Este número de remito ya existe en el sistema');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Error validando remito:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!formData.producto_id || !formData.fecha_cosecha || !formData.peso_bruto || !formData.remito) {
        setError('Por favor complete todos los campos obligatorios');
        setLoading(false);
        return;
      }

      // CAMBIO PRINCIPAL: Llamamos a crearBin en lugar de crearBinYLote
      // Nota: Asegúrate de que en tu archivo services exista este método y apunte al endpoint correcto (ej: POST /api/bins)
      const response = await binloteServices.crearBin({
        producto_id: parseInt(formData.producto_id),
        variedad_id: formData.variedad_id ? parseInt(formData.variedad_id) : null,
        productor_id: formData.productor_id ? parseInt(formData.productor_id) : null,
        finca_id: formData.finca_id ? parseInt(formData.finca_id) : null,
        fecha_cosecha: formData.fecha_cosecha,
        peso_bruto: parseFloat(formData.peso_bruto),
        remito: formData.remito,
        observaciones: formData.observaciones,
        responsable: formData.responsable
      });

      console.log('✅ Respuesta del servidor:', response);

      setSuccess(true);
      
      // Ajustamos la alerta para no buscar datos del lote que ya no existen
      // Asumimos que la respuesta trae los datos del bin creado en response.data o response.data.bin
      const binCreado = response.data.bin || response.data; 

     Swal.fire({
                icon: "success",
                title: "BIN registrado exitosamente",
                html: `
                     <div style="text-align: left; font-size: 1.1rem;">
                     <hr>
                     <p><strong>📦 BIN ID:</strong> ${binCreado.bin_id}</p>
                     <p><strong>⚖️ Peso:</strong> ${formData.peso_bruto} kg</p>
                     <p><strong>📄 Remito:</strong> ${formData.remito}</p>
                     <hr>
                     </div>
                     `,
                confirmButtonText: "Aceptar",
               });

      // Limpiar formulario
      setFormData({
        producto_id: '',
        variedad_id: '',
        productor_id: '',
        finca_id: '',
        fecha_cosecha: '',
        peso_bruto: '',
        remito: '',
        observaciones: '',
        responsable: 'Admin'
      });

      setFincasDisponibles([]);
      setVariedadesDisponibles([]);
      setRemitoValido(null);

      // Recargar bins recientes
      const binsData = await binloteServices.getBinsRecientes(10);
      setBinsRecientes(binsData.data || []);

    } catch (err) {
      console.error('❌ Error creando bin:', err);
      
      if (err.response?.status === 409) {
        setError('⚠️ El número de remito ya existe en el sistema');
      } else if (err.response?.status === 400) {
        setError('⚠️ Datos inválidos: ' + (err.response.data.message || 'Verifique los campos'));
      } else {
        setError('❌ Error al crear el bin: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  // Funciones de paginación
  const getPaginatedBins = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = binsRecientes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(binsRecientes.length / itemsPerPage);

    return {
      currentItems,
      totalPages,
      totalItems: binsRecientes.length
    };
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
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
    <div className="recepcion-bin-container">
      <h2>Recepción de Bin</h2>

      {/* Mensajes de error o éxito */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          ✅ Bin registrado exitosamente (Pendiente de Lote)
          <button onClick={() => setSuccess(false)}>✕</button>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bin-form">
        
        {/* Productor */}
        <div className="form-group">
          <label htmlFor="productor_id">Productor</label>
          <select
            id="productor_id"
            name="productor_id"
            value={formData.productor_id}
            onChange={handleProductorChange}
            disabled={loading}
          >
            <option value="">Seleccione productor</option>
            {productores.map(productor => (
              <option key={productor.productor_id} value={productor.productor_id}>
                {productor.productor_nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Finca */}
        <div className="form-group">
          <label htmlFor="finca_id">Finca</label>
          <select
            id="finca_id"
            name="finca_id"
            value={formData.finca_id}
            onChange={handleInputChange}
            disabled={!formData.productor_id || loading}
          >
            <option value="">Seleccione finca</option>
            {fincasDisponibles.map(finca => (
              <option key={finca.finca_id} value={finca.finca_id}>
                {finca.nombre} - {finca.ubicacion}
              </option>
            ))}
          </select>
        </div>

        {/* Producto */}
        <div className="form-group">
          <label htmlFor="producto_id">Producto *</label>
          <select
            id="producto_id"
            name="producto_id"
            value={formData.producto_id}
            onChange={handleProductoChange}
            disabled={loading}
            required
          >
            <option value="">Seleccione producto</option>
            {productos.map(producto => (
              <option key={producto.producto_id} value={producto.producto_id}>
                {producto.producto_nombre} ({producto.categoria})
              </option>
            ))}
          </select>
        </div>

        {/* Variedad */}
        <div className="form-group">
          <label htmlFor="variedad_id">Variedad</label>
          <select
            id="variedad_id"
            name="variedad_id"
            value={formData.variedad_id}
            onChange={handleInputChange}
            disabled={!formData.producto_id || loading}
          >
            <option value="">Seleccione variedad</option>
            {variedadesDisponibles.map(variedad => (
              <option key={variedad.variedad_id} value={variedad.variedad_id}>
                {variedad.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha cosecha */}
        <div className="form-group">
          <label htmlFor="fecha_cosecha">Fecha cosecha *</label>
          <input
            type="date"
            id="fecha_cosecha"
            name="fecha_cosecha"
            value={formData.fecha_cosecha}
            onChange={handleInputChange}
            disabled={loading}
            required
          />
        </div>

        {/* Peso estimado */}
        <div className="form-group">
          <label htmlFor="peso_bruto">Peso estimado (kg) *</label>
          <input
            type="number"
            id="peso_bruto"
            name="peso_bruto"
            value={formData.peso_bruto}
            onChange={handleInputChange}
            step="0.1"
            min="0"
            placeholder="420"
            disabled={loading}
            required
          />
        </div>

        {/* Remito */}
        <div className="form-group">
          <label htmlFor="remito">
            Remito *
            {remitoValido === false && <span className="error-text"> ⚠️ Ya existe</span>}
            {remitoValido === true && <span className="success-text"> ✓ Disponible</span>}
          </label>
          <input
            type="text"
            id="remito"
            name="remito"
            value={formData.remito}
            onChange={handleInputChange}
            onBlur={handleRemitoBlur}
            placeholder="RMT-55422"
            disabled={loading}
            required
          />
        </div>

        {/* Observaciones */}
        <div className="form-group">
          <label htmlFor="observaciones">Observaciones</label>
          <textarea
            id="observaciones"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleInputChange}
            rows="3"
            placeholder="Fruta en buen estado, sin daños visibles"
            disabled={loading}
          />
        </div>

        {/* Botón submit */}
        <button 
          type="submit" 
          className="btn-submit"
          disabled={loading || remitoValido === false}
        >
          {loading ? 'Registrando...' : 'Registrar Bin '}
        </button>
      </form>

      {/* Bins recientes */}
      <div className="bins-recientes">
        <h3>Bins recientes</h3>
        {binsRecientes.length === 0 ? (
          <p>No hay bins registrados</p>
        ) : (
          <>
            <ul>
              {getPaginatedBins().currentItems.map(bin => (
                <li key={bin.bin_id}>
                  <div className="bin-header">
                    <strong>{bin.bin_id}</strong>
                    
                  
                    {/* ya no agregamos lote en el bin solo despues de pasar por la linea de proceso, com */}
                    {/* {bin.lote_id && <span className="lote-badge">Lote #{bin.lote_id}</span>} */}
                  </div>
                  <div className="bin-info">
                    {bin.producto_nombre} {bin.variedad_nombre && `- ${bin.variedad_nombre}`}
                  </div>
                  <div className="bin-details">
                    Remito: {bin.remito} | Peso: {bin.peso_bruto} kg
                  </div>
                  <div className="bin-meta">
                    <small>
                      Ingreso: {formatearFecha(bin.fecha_ingreso_bin)}
                    </small>
                  </div>
                </li>
              ))}
            </ul>

            {/* Paginación */}
            {getPaginatedBins().totalPages > 1 && (
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
            )}

            <div className="mt-3 text-muted small px-2 d-flex justify-content-between align-items-center">
              <span>
                Mostrando {getPaginatedBins().currentItems.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, getPaginatedBins().totalItems)} de {getPaginatedBins().totalItems} registros
              </span>
              <span>
                Página {currentPage} de {getPaginatedBins().totalPages || 1}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BinsPage;