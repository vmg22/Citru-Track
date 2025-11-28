import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import '../../style/generadorQR.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const GeneradorQR = () => {
  const [cajasGeneradas, setCajasGeneradas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [sublotes, setSublotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [configuracion, setConfiguracion] = useState({
    prefijo: 'CAJ',
    cantidadInicial: 1,
    cantidadTotal: 10,
    producto_id: '',
    lote_id: '',
    sublote_id: '',
    tipo_caja: '',
    peso_neto: '',
  });

  const printRef = useRef();

  // Cargar productos, lotes y sublotes
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Cargando datos desde:', API_URL);
      
      const [productosRes, lotesRes, sublotesRes] = await Promise.all([
        axios.get(`${API_URL}/api/productos`),
        axios.get(`${API_URL}/api/lotes`),
        axios.get(`${API_URL}/api/lotes/sublotes/all`)
      ]);

      console.log('Productos cargados:', productosRes.data);
      console.log('Lotes cargados:', lotesRes.data);
      console.log('Sublotes cargados:', sublotesRes.data);

      // Manejar diferentes formatos de respuesta
      setProductos(productosRes.data.data || productosRes.data || []);
      setLotes(lotesRes.data.data || lotesRes.data || []);
      setSublotes(sublotesRes.data || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar datos. Verifica que el servidor esté ejecutándose.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfiguracion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generarCodigos = async () => {
    const { prefijo, cantidadInicial, cantidadTotal, producto_id, lote_id, sublote_id, tipo_caja, peso_neto } = configuracion;
    const cajas = [];

    for (let i = 0; i < parseInt(cantidadTotal); i++) {
      const numero = (parseInt(cantidadInicial) + i).toString().padStart(4, '0');
      const caja_id = `${prefijo}-${numero}`;
      
      // Crear objeto con los datos de la caja
      const dataCaja = {
        caja_id: caja_id,
        producto_id: producto_id ? parseInt(producto_id) : null,
        lote_id: lote_id ? parseInt(lote_id) : null,
        sublote_id: sublote_id ? parseInt(sublote_id) : null,
        tipo_caja: tipo_caja || null,
        peso_neto: peso_neto ? parseFloat(peso_neto) : null,
      };

      // Convertir a JSON para el QR
      const qrData = JSON.stringify(dataCaja);
      
      try {
        const qrDataUrl = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        cajas.push({
          codigo: caja_id,
          data: dataCaja,
          qrImage: qrDataUrl
        });
      } catch (error) {
        console.error('Error generando QR:', error);
      }
    }

    setCajasGeneradas(cajas);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Códigos_QR_${configuracion.prefijo || 'SinPrefijo'}`,
  });

  const limpiarCodigos = () => {
    setCajasGeneradas([]);
  };

  const descargarCodigosIndividuales = () => {
    cajasGeneradas.forEach((caja) => {
      const link = document.createElement('a');
      link.href = caja.qrImage;
      link.download = `${caja.codigo}.png`;
      link.click();
    });
  };

  const productoSeleccionado = productos.find(p => p.producto_id == configuracion.producto_id);
  const loteSeleccionado = lotes.find(l => l.lote_id == configuracion.lote_id);
  const subloteSeleccionado = sublotes.find(s => s.sublote_id == configuracion.sublote_id);

  return (
    <div className="generador-qr-container">

      <div className="stock-header">
        <h1 className="stock-title"><i className="fas fa-qrcode"></i> Generador de Códigos QR</h1>
        <div className="monitoreo-user-info">
          <i className="fas fa-user-circle"></i>
          <span>Supervisor de Planta</span>
        </div>
      </div>
 
      <div className="generador-qr-content">
        {/* Panel de configuración */}
        <div className="generador-qr-config-panel">
          <h3>
            <i className="fas fa-cog" style={{color:"green"}}></i>
            Configuración
          </h3>

          <div className="config-form">
            {/* Prefijo y cantidad */}
            <div className="form-group">
              <label htmlFor="prefijo">Prefijo del Código</label>
              <input
                type="text"
                id="prefijo"
                name="prefijo"
                value={configuracion.prefijo}
                onChange={handleChange}
                placeholder="CAJ"
                maxLength={10}
              />
              <small>Ej: CAJ, PALLET, LOTE</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cantidadInicial">Número Inicial</label>
                <input
                  type="number"
                  id="cantidadInicial"
                  name="cantidadInicial"
                  value={configuracion.cantidadInicial}
                  onChange={handleChange}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cantidadTotal">Cantidad</label>
                <input
                  type="number"
                  id="cantidadTotal"
                  name="cantidadTotal"
                  value={configuracion.cantidadTotal}
                  onChange={handleChange}
                  min="1"
                  max="100"
                />
              </div>
            </div>

            {/* Producto */}
            <div className="form-group">
              <label htmlFor="producto_id">Producto *</label>
              {error && (
                <div style={{
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  background: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}>
                  <i className="fas fa-exclamation-triangle"></i> {error}
                  <button 
                    onClick={cargarDatos}
                    style={{
                      marginLeft: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    Reintentar
                  </button>
                </div>
              )}
              <select
                id="producto_id"
                name="producto_id"
                value={configuracion.producto_id}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">
                  {loading ? 'Cargando productos...' : 'Seleccionar producto...'}
                </option>
                {productos.map(producto => (
                  <option key={producto.producto_id} value={producto.producto_id}>
                    {producto.nombre} - {producto.variedad || 'Sin variedad'}
                  </option>
                ))}
              </select>
              {loading && (
                <small style={{color: '#6366f1', marginTop: '0.25rem', display: 'block'}}>
                  <i className="fas fa-spinner fa-spin"></i> Cargando datos...
                </small>
              )}
            </div>

            {/* Lote y Sublote */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lote_id">Lote (Opcional)</label>
                <select
                  id="lote_id"
                  name="lote_id"
                  value={configuracion.lote_id}
                  onChange={handleChange}
                >
                  <option value="">Sin lote</option>
                  {lotes.map(lote => (
                    <option key={lote.lote_id} value={lote.lote_id}>
                      Lote #{lote.lote_id} - {lote.descripcion || lote.producto_nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="sublote_id">Sublote (Opcional)</label>
                <select
                  id="sublote_id"
                  name="sublote_id"
                  value={configuracion.sublote_id}
                  onChange={handleChange}
                >
                  <option value="">Sin sublote</option>
                  {sublotes.map(sublote => (
                    <option key={sublote.sublote_id} value={sublote.sublote_id}>
                      Sublote #{sublote.sublote_id} {sublote.lote_descripcion ? `(${sublote.lote_descripcion})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tipo de caja y peso */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tipo_caja">Tipo de Caja (Opcional)</label>
                <input
                  type="text"
                  id="tipo_caja"
                  name="tipo_caja"
                  value={configuracion.tipo_caja}
                  onChange={handleChange}
                  placeholder="Ej: 10kg, Exportación"
                  maxLength={150}
                />
              </div>

              <div className="form-group">
                <label htmlFor="peso_neto">Peso Neto (kg)</label>
                <input
                  type="number"
                  id="peso_neto"
                  name="peso_neto"
                  value={configuracion.peso_neto}
                  onChange={handleChange}
                  placeholder="10.500"
                  step="0.001"
                  min="0"
                />
              </div>
            </div>

            {/* Vista previa */}
            <div className="config-preview">
              <strong>Vista previa:</strong>
              <div className="preview-code">
                {configuracion.prefijo 
                  ? `${configuracion.prefijo}-${(configuracion.cantidadInicial || 1).toString().padStart(4, '0')}`
                  : '(Ingresa un prefijo)'}
              </div>
              {productoSeleccionado && (
                <small style={{display: 'block', marginTop: '0.5rem', color: '#64748b'}}>
                  Producto: {productoSeleccionado.nombre}
                  {loteSeleccionado && ` | Lote #${loteSeleccionado.lote_id}`}
                  {subloteSeleccionado && ` | Sublote #${subloteSeleccionado.sublote_id}`}
                </small>
              )}
            </div>

            {/* Botón generar */}
            <div className="config-actions">
              <button 
                className="btn btn-primary"
                onClick={generarCodigos}
                disabled={!configuracion.prefijo || !configuracion.producto_id}
              >
                <i className="fas fa-magic"></i>
                Generar Códigos QR
              </button>
            </div>
          </div>
        </div>

        {/* Panel de resultados */}
        <div className="generador-qr-results-panel">
          {cajasGeneradas.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-qrcode fa-3x"></i>
              <p>No hay códigos QR generados</p>
              <small>Configura los parámetros y genera tus códigos QR</small>
            </div>
          ) : (
            <>
              <div className="results-header">
                <h3>
                  <i className="fas fa-check-circle"></i>
                  {cajasGeneradas.length} Códigos Generados
                </h3>
                <div className="results-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={handlePrint}
                  >
                    <i className="fas fa-print"></i>
                    Imprimir Todo
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={descargarCodigosIndividuales}
                  >
                    <i className="fas fa-download"></i>
                    Descargar Todos
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={limpiarCodigos}
                  >
                    <i className="fas fa-trash"></i>
                    Limpiar
                  </button>
                </div>
              </div>

              {/* Grid de códigos QR - Vista previa */}
              <div className="qr-grid">
                {cajasGeneradas.slice(0, 12).map((caja, index) => (
                  <div key={index} className="qr-card">
                    <div className="qr-image-container">
                      <img src={caja.qrImage} alt={caja.codigo} />
                    </div>
                    <div className="qr-code-label">{caja.codigo}</div>
                    {caja.data.producto_id && productoSeleccionado && (
                      <div className="qr-product-label">{productoSeleccionado.nombre}</div>
                    )}
                    {caja.data.peso_neto && (
                      <div className="qr-product-label">{caja.data.peso_neto} kg</div>
                    )}
                  </div>
                ))}
              </div>

              {cajasGeneradas.length > 12 && (
                <div className="more-items-indicator">
                  <i className="fas fa-ellipsis-h"></i>
                  <span>Y {cajasGeneradas.length - 12} códigos más...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Área de impresión (oculta) */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} className="print-area">
          <div className="print-header">
            <h1>CitrusTrack - Códigos QR</h1>
            <p>Generado: {new Date().toLocaleDateString('es-AR')}</p>
            {productoSeleccionado && (
              <p><strong>Producto:</strong> {productoSeleccionado.nombre}</p>
            )}
            {loteSeleccionado && (
              <p><strong>Lote:</strong> {loteSeleccionado.codigo_lote}</p>
            )}
          </div>
          <div className="print-grid">
            {cajasGeneradas.map((caja, index) => (
              <div key={index} className="print-qr-item">
                <img src={caja.qrImage} alt={caja.codigo} />
                <div className="print-qr-label">{caja.codigo}</div>
                {productoSeleccionado && (
                  <div className="print-qr-product">{productoSeleccionado.nombre}</div>
                )}
                {caja.data.peso_neto && (
                  <div className="print-qr-meta">Peso: {caja.data.peso_neto} kg</div>
                )}
                {loteSeleccionado && (
                  <div className="print-qr-meta">Lote: {loteSeleccionado.codigo_lote}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneradorQR;
