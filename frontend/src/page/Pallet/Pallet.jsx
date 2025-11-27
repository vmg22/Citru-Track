import React, { useState, useEffect } from 'react';
import '../../style/pallet.css';
import palletService from '../../services/palletService';
import { getAllProductosActivos } from '../Settings/services/settingsServices';

const Pallet = () => {
  const [cajasDisponibles, setCajasDisponibles] = useState([]);
  const [cajasSeleccionadas, setCajasSeleccionadas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [sublotes, setSublotes] = useState([]);
  
  const [filtros, setFiltros] = useState({
    producto_id: '',
    lote_id: '',
    sublote_id: ''
  });
  
  const [tipoPallet, setTipoPallet] = useState('Europallet');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [qrDataURL, setQrDataURL] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [ultimoPalletId, setUltimoPalletId] = useState(null);

  // 1. Cargar productos al montar
  useEffect(() => {
    cargarProductos();
  }, []);

  // 2. Cargar lotes cuando cambia el producto
  useEffect(() => {
    if (filtros.producto_id) {
      cargarLotes();
      setCajasSeleccionadas([]); // Limpiar selección al cambiar producto
    } else {
      setLotes([]);
      setSublotes([]);
      setCajasDisponibles([]);
    }
  }, [filtros.producto_id]);

  // 3. Cargar sublotes cuando cambia el lote
  useEffect(() => {
    if (filtros.lote_id) {
      cargarSublotes();
      setCajasSeleccionadas([]); // Limpiar selección al cambiar lote
    } else {
      setSublotes([]);
    }
  }, [filtros.lote_id]);

  // 4. Cargar cajas disponibles cuando cambian los filtros
  useEffect(() => {
    if (filtros.producto_id && filtros.lote_id) {
      cargarCajasDisponibles();
    } else {
      setCajasDisponibles([]);
    }
  }, [filtros.producto_id, filtros.lote_id, filtros.sublote_id]);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const response = await getAllProductosActivos();
      console.log('✅ Productos cargados:', response);
      setProductos(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
      showMessage('Error al cargar productos', 'error');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarLotes = async () => {
    if (!filtros.producto_id) return;
    
    try {
      setLoading(true);
      console.log('📦 Cargando lotes para producto:', filtros.producto_id);
      const response = await palletService.obtenerLotesPorProducto(filtros.producto_id);
      console.log('✅ Lotes obtenidos:', response);
      setLotes(Array.isArray(response) ? response : []);
      
      if (response.length === 0) {
        showMessage('No hay lotes disponibles para este producto', 'info');
      }
    } catch (error) {
      console.error('❌ Error cargando lotes:', error);
      showMessage('Error al cargar lotes', 'error');
      setLotes([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarSublotes = async () => {
    if (!filtros.lote_id) return;
    
    try {
      setLoading(true);
      console.log('📦 Cargando sublotes para lote:', filtros.lote_id);
      const response = await palletService.obtenerSublotesPorLote(filtros.lote_id);
      console.log('✅ Sublotes obtenidos:', response);
      setSublotes(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('❌ Error cargando sublotes:', error);
      showMessage('Error al cargar sublotes', 'error');
      setSublotes([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarCajasDisponibles = async () => {
    if (!filtros.producto_id || !filtros.lote_id) {
      setCajasDisponibles([]);
      return;
    }

    setLoading(true);
    try {
      console.log('📦 Cargando cajas con filtros:', filtros);
      const response = await palletService.getCajasDisponibles(filtros);
      console.log('✅ Respuesta cajas:', response);
      
      if (response.success) {
        const cajas = response.cajas || [];
        setCajasDisponibles(cajas);
        
        if (cajas.length === 0) {
          showMessage('No hay cajas disponibles con estos filtros', 'info');
        } else {
          showMessage(`${cajas.length} cajas disponibles`, 'success');
        }
      } else {
        showMessage(response.message || 'Error al cargar cajas', 'error');
        setCajasDisponibles([]);
      }
    } catch (error) {
      console.error('❌ Error cargando cajas:', error);
      showMessage('Error al cargar cajas disponibles', 'error');
      setCajasDisponibles([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleFiltroChange = (campo, valor) => {
    console.log(`🔄 Cambiando ${campo} a:`, valor);
    
    setFiltros(prev => {
      const newFiltros = { ...prev };
      
      // Actualizar el campo
      newFiltros[campo] = valor;
      
      // Resetear dependientes
      if (campo === 'producto_id') {
        newFiltros.lote_id = '';
        newFiltros.sublote_id = '';
      } else if (campo === 'lote_id') {
        newFiltros.sublote_id = '';
      }
      
      console.log('📋 Nuevos filtros:', newFiltros);
      return newFiltros;
    });
    
    // Limpiar selección
    if (cajasSeleccionadas.length > 0) {
      setCajasSeleccionadas([]);
    }
  };

  const toggleCajaSeleccion = (caja) => {
    const yaSeleccionada = cajasSeleccionadas.find(c => c.caja_id === caja.caja_id);
    
    if (yaSeleccionada) {
      setCajasSeleccionadas(cajasSeleccionadas.filter(c => c.caja_id !== caja.caja_id));
    } else {
      // Validar compatibilidad
      if (cajasSeleccionadas.length > 0) {
        const primera = cajasSeleccionadas[0];
        if (caja.producto_id !== primera.producto_id ||
            caja.lote_id !== primera.lote_id ||
            caja.sublote_id !== primera.sublote_id) {
          showMessage('Solo puedes seleccionar cajas del mismo producto/lote/sublote', 'error');
          return;
        }
      }
      setCajasSeleccionadas([...cajasSeleccionadas, caja]);
    }
  };

  const seleccionarTodas = () => {
    if (cajasDisponibles.length === 0) {
      showMessage('No hay cajas disponibles para seleccionar', 'info');
      return;
    }
    setCajasSeleccionadas([...cajasDisponibles]);
    showMessage(`${cajasDisponibles.length} cajas seleccionadas`, 'success');
  };

  const limpiarSeleccion = () => {
    setCajasSeleccionadas([]);
    showMessage('Selección limpiada', 'info');
  };

  const handleCrearPallet = async () => {
    // Validaciones
    if (!filtros.producto_id) {
      showMessage('Debes seleccionar un producto', 'error');
      return;
    }
    
    if (!filtros.lote_id) {
      showMessage('Debes seleccionar un lote', 'error');
      return;
    }
    
    if (cajasSeleccionadas.length === 0) {
      showMessage('Debes seleccionar al menos una caja', 'error');
      return;
    }

    const pallet_id = `PLT-${Date.now().toString().slice(-8)}`;
    
    console.log('🚀 Creando pallet:', {
      pallet_id,
      producto_id: filtros.producto_id,
      lote_id: filtros.lote_id,
      sublote_id: filtros.sublote_id,
      cajas_count: cajasSeleccionadas.length
    });

    setLoading(true);
    try {
      const response = await palletService.crearPalletConCajas({
        pallet_id,
        producto_id: parseInt(filtros.producto_id),
        lote_id: parseInt(filtros.lote_id),
        sublote_id: filtros.sublote_id ? parseInt(filtros.sublote_id) : null,
        cajas_ids: cajasSeleccionadas.map(c => c.caja_id),
        tipo_pallet: tipoPallet
      });
      
      console.log('✅ Respuesta crear pallet:', response);
      
      if (response.success) {
        showMessage(`✅ Pallet ${pallet_id} creado exitosamente con ${cajasSeleccionadas.length} cajas`, 'success');
        setUltimoPalletId(pallet_id);
        setCajasSeleccionadas([]);
        
        // Recargar cajas disponibles
        await cargarCajasDisponibles();
        
        // Preguntar por QR
        setTimeout(() => {
          if (window.confirm('¿Deseas generar el código QR del pallet?')) {
            handleGenerarQR(pallet_id);
          }
        }, 500);
      } else {
        showMessage(response.message || 'Error al crear pallet', 'error');
      }
    } catch (error) {
      console.error('❌ Error al crear pallet:', error);
      showMessage('Error al crear el pallet: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarQR = async (palletId = ultimoPalletId) => {
    if (!palletId) {
      showMessage('No hay pallet para generar QR', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await palletService.generarQRPallet(palletId, 'dataURL');
      if (response.success) {
        setQrDataURL(response.dataURL);
        setShowQRModal(true);
      } else {
        showMessage('Error al generar QR', 'error');
      }
    } catch (error) {
      console.error('Error generando QR:', error);
      showMessage('Error al generar código QR', 'error');
    } finally {
      setLoading(false);
    }
  };

  const descargarQR = () => {
    if (!qrDataURL) return;
    const link = document.createElement('a');
    link.href = qrDataURL;
    link.download = `pallet-${ultimoPalletId}.png`;
    link.click();
    showMessage('QR descargado', 'success');
  };

  const pesoTotal = cajasSeleccionadas.reduce((sum, c) => sum + parseFloat(c.peso_neto || 0), 0);
  const cantidadCajas = cajasSeleccionadas.length;

  return (
    <div className="pallet-container">
      <div className="dashboard-header">
        <h2>🏗️ Armado de Pallet</h2>
        <p className="subtitle">Selecciona producto y lote para ver cajas disponibles</p>
      </div>

      <div className="pallet-card">
        {message.text && (
          <div className={`pallet-message pallet-message-${message.type}`}>
            {message.type === 'success' && '✅ '}
            {message.type === 'error' && '❌ '}
            {message.type === 'info' && 'ℹ️ '}
            {message.text}
          </div>
        )}

        <div className="pallet-filters">
          <h3>📋 Filtros de Selección</h3>
          <div className="filters-grid">
            <div className="filter-item">
              <label>
                Producto <span className="required">*</span>
              </label>
              <select 
                value={filtros.producto_id} 
                onChange={(e) => handleFiltroChange('producto_id', e.target.value)}
                disabled={loading}
              >
                <option value="">-- Seleccionar Producto --</option>
                {productos.map(p => (
                  <option key={p.producto_id} value={p.producto_id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>
                Lote <span className="required">*</span>
              </label>
              <select 
                value={filtros.lote_id} 
                onChange={(e) => handleFiltroChange('lote_id', e.target.value)} 
                disabled={!filtros.producto_id || loading}
              >
                <option value="">-- Seleccionar Lote --</option>
                {lotes.map(l => (
                  <option key={l.lote_id} value={l.lote_id}>
                    {l.descripcion || `Lote ${l.lote_id}`} ({l.total_cajas || 0} cajas)
                  </option>
                ))}
              </select>
              {filtros.producto_id && lotes.length === 0 && !loading && (
                <small className="help-text">No hay lotes disponibles</small>
              )}
            </div>

            {/* <div className="filter-item">
              <label>Sublote (Opcional)</label>
              <select 
                value={filtros.sublote_id} 
                onChange={(e) => handleFiltroChange('sublote_id', e.target.value)} 
                disabled={!filtros.lote_id || loading}
              >
                <option value="">-- Todos los Sublotes --</option>
                {sublotes.map(sl => (
                  <option key={sl.sublote_id} value={sl.sublote_id}>
                    {sl.calibre || `Sublote ${sl.sublote_id}`} ({sl.total_cajas || 0} cajas)
                  </option>
                ))}
              </select>
            </div> */}
          </div>
        </div>

        <div className="pallet-main-grid">
          <div className="pallet-column-left">
            <div className="pallet-inner-box">
              <div className="pallet-header-section">
                <h4>📦 Cajas Disponibles ({cajasDisponibles.length})</h4>
                {cajasDisponibles.length > 0 && (
                  <button 
                    className="pallet-button-small" 
                    onClick={seleccionarTodas}
                    disabled={loading}
                  >
                    ✓ Seleccionar todas
                  </button>
                )}
              </div>

              <div className="pallet-cajas-list">
                {loading && (
                  <div className="pallet-loading">
                    <div className="spinner"></div>
                    <p>Cargando cajas...</p>
                  </div>
                )}
                
                {!loading && !filtros.producto_id && (
                  <div className="pallet-empty-state">
                    <i className="fas fa-box-open fa-3x"></i>
                    <p>Selecciona un producto para comenzar</p>
                  </div>
                )}

                {!loading && filtros.producto_id && !filtros.lote_id && (
                  <div className="pallet-empty-state">
                    <i className="fas fa-layer-group fa-3x"></i>
                    <p>Selecciona un lote para ver las cajas</p>
                  </div>
                )}
                
                {!loading && filtros.lote_id && cajasDisponibles.length === 0 && (
                  <div className="pallet-empty-state">
                    <i className="fas fa-inbox fa-3x"></i>
                    <p>No hay cajas disponibles con estos filtros</p>
                  </div>
                )}

                {!loading && cajasDisponibles.map((caja) => {
                  const isSelected = cajasSeleccionadas.find(c => c.caja_id === caja.caja_id);
                  return (
                    <div
                      key={caja.caja_id}
                      className={`pallet-caja-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleCajaSeleccion(caja)}
                    >
                      <div className="caja-info">
                        <span className="caja-id">
                          <i className="fas fa-box"></i> {caja.caja_id}
                        </span>
                        <span className="caja-peso">
                          <i className="fas fa-weight"></i> {parseFloat(caja.peso_neto || 0).toFixed(2)} kg
                        </span>
                      </div>
                      {isSelected && <i className="fas fa-check-circle check-icon"></i>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pallet-column-right">
            <div className="pallet-inner-box">
              <h4>✓ Cajas Seleccionadas ({cantidadCajas})</h4>

              <div className="pallet-selected-list">
                {cajasSeleccionadas.length === 0 && (
                  <div className="pallet-empty-state">
                    <i className="fas fa-hand-pointer fa-2x"></i>
                    <p>Selecciona cajas de la izquierda</p>
                  </div>
                )}

                {cajasSeleccionadas.map((caja) => (
                  <div key={caja.caja_id} className="pallet-selected-item">
                    <span className="caja-id">
                      <i className="fas fa-box"></i> {caja.caja_id}
                    </span>
                    <span className="caja-peso">
                      {parseFloat(caja.peso_neto || 0).toFixed(2)} kg
                    </span>
                    <button 
                      className="pallet-remove-btn" 
                      onClick={() => toggleCajaSeleccion(caja)}
                      title="Quitar caja"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="pallet-config">
                <h5>⚙️ Configuración del Pallet</h5>
                <div className="config-item">
                  <label>Tipo de Pallet</label>
                  <select 
                    value={tipoPallet} 
                    onChange={(e) => setTipoPallet(e.target.value)}
                    disabled={loading}
                  >
                    <option value="Europallet">Europallet (120x80cm)</option>
                    <option value="Americano">Americano (120x100cm)</option>
                    <option value="Universal">Universal (100x120cm)</option>
                    <option value="Maritimo">Marítimo (110x110cm)</option>
                  </select>
                </div>
              </div>

              <div className="pallet-summary-footer">
                <div className="pallet-summary-stats">
                  <div className="pallet-stat-item">
                    <i className="fas fa-boxes"></i>
                    <span>Cajas: <strong>{cantidadCajas}</strong></span>
                  </div>
                  <div className="pallet-stat-item">
                    <i className="fas fa-weight-hanging"></i>
                    <span>Peso: <strong>{pesoTotal.toFixed(2)} kg</strong></span>
                  </div>
                </div>

                <div className="pallet-summary-actions">
                  {cajasSeleccionadas.length > 0 && (
                    <button 
                      className="pallet-button-secondary" 
                      onClick={limpiarSeleccion}
                      disabled={loading}
                    >
                      <i className="fas fa-eraser"></i> Limpiar
                    </button>
                  )}
                  <button
                    className="pallet-button-primary"
                    onClick={handleCrearPallet}
                    disabled={cajasSeleccionadas.length === 0 || loading || !filtros.lote_id}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Creando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus-circle"></i> Crear Pallet
                      </>
                    )}
                  </button>
                </div>
              </div>

              {ultimoPalletId && (
                <div className="pallet-qr-section">
                  <button 
                    className="pallet-button-qr" 
                    onClick={() => handleGenerarQR()}
                    disabled={loading}
                  >
                    <i className="fas fa-qrcode"></i> Ver QR del último pallet
                  </button>
                  <small>Pallet: {ultimoPalletId}</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showQRModal && (
        <div className="pallet-modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="pallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pallet-modal-header">
              <h3>
                <i className="fas fa-qrcode"></i> Código QR - Pallet {ultimoPalletId}
              </h3>
              <button 
                className="pallet-modal-close" 
                onClick={() => setShowQRModal(false)}
              >
                ×
              </button>
            </div>
            <div className="pallet-modal-body">
              {qrDataURL ? (
                <img src={qrDataURL} alt="QR Code" className="qr-image" />
              ) : (
                <div className="pallet-loading">Generando QR...</div>
              )}
            </div>
            <div className="pallet-modal-footer">
              <button 
                className="pallet-button-secondary" 
                onClick={() => setShowQRModal(false)}
              >
                <i className="fas fa-times"></i> Cerrar
              </button>
              <button 
                className="pallet-button-primary" 
                onClick={descargarQR}
                disabled={!qrDataURL}
              >
                <i className="fas fa-download"></i> Descargar QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pallet;