import React, { useState, useEffect } from 'react';
import '../../style/pallet.css';
import * as palletService from '../../services/palletService';

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
    } else {
      setLotes([]);
      setSublotes([]);
    }
  }, [filtros.producto_id]);

  // 3. Cargar sublotes cuando cambia el lote
  useEffect(() => {
    if (filtros.lote_id) {
      cargarSublotes();
    } else {
      setSublotes([]);
    }
  }, [filtros.lote_id]);

  // 4. Cargar cajas disponibles cuando cambian los filtros
  useEffect(() => {
    if (filtros.producto_id) {
      cargarCajasDisponibles();
    } else {
      setCajasDisponibles([]);
    }
  }, [filtros.producto_id, filtros.lote_id, filtros.sublote_id]);

  const cargarProductos = async () => {
    try {
      const response = await palletService.obtenerProductos();
      const productos = response.success && Array.isArray(response.data) ? response.data : [];
      setProductos(productos);
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
      setProductos([]);
    }
  };

  const cargarLotes = async () => {
    if (!filtros.producto_id) return;
    try {
      const response = await palletService.obtenerLotesPorProducto(filtros.producto_id);
      setLotes(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('❌ Error cargando lotes:', error);
      setLotes([]);
    }
  };

  const cargarSublotes = async () => {
    if (!filtros.lote_id) return;
    try {
      const response = await palletService.obtenerSublotesPorLote(filtros.lote_id);
      setSublotes(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('❌ Error cargando sublotes:', error);
      setSublotes([]);
    }
  };

  const cargarCajasDisponibles = async () => {
    setLoading(true);
    try {
      const response = await palletService.getCajasDisponibles(filtros);
      if (response.success) {
        setCajasDisponibles(response.cajas || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      // Resetear dependientes
      ...(campo === 'producto_id' && { lote_id: '', sublote_id: '' }),
      ...(campo === 'lote_id' && { sublote_id: '' })
    }));
    
    if (cajasSeleccionadas.length > 0) {
      setCajasSeleccionadas([]);
    }
  };

  const toggleCajaSeleccion = (caja) => {
    const yaSeleccionada = cajasSeleccionadas.find(c => c.caja_id === caja.caja_id);
    
    if (yaSeleccionada) {
      setCajasSeleccionadas(cajasSeleccionadas.filter(c => c.caja_id !== caja.caja_id));
    } else {
      if (cajasSeleccionadas.length > 0) {
        const primera = cajasSeleccionadas[0];
        if (caja.producto_id !== primera.producto_id ||
            caja.lote_id !== primera.lote_id ||
            caja.sublote_id !== primera.sublote_id) {
          showMessage('Solo puedes seleccionar cajas compatibles', 'error');
          return;
        }
      }
      setCajasSeleccionadas([...cajasSeleccionadas, caja]);
    }
  };

  const seleccionarTodas = () => {
    if (cajasDisponibles.length === 0) return;
    setCajasSeleccionadas([...cajasDisponibles]);
  };

  const limpiarSeleccion = () => {
    setCajasSeleccionadas([]);
  };

  const handleCrearPallet = async () => {
    if (cajasSeleccionadas.length === 0 || !filtros.producto_id) {
      showMessage('Selecciona producto y cajas', 'error');
      return;
    }

    const pallet_id = `PLT-${Date.now().toString().slice(-8)}`;

    setLoading(true);
    try {
      const response = await palletService.crearPalletConCajas({
        pallet_id,
        producto_id: parseInt(filtros.producto_id),
        lote_id: filtros.lote_id ? parseInt(filtros.lote_id) : null,
        sublote_id: filtros.sublote_id ? parseInt(filtros.sublote_id) : null,
        cajas_ids: cajasSeleccionadas.map(c => c.caja_id),
        tipo_pallet: tipoPallet
      });
      
      if (response.success) {
        showMessage(`✅ Pallet ${pallet_id} creado!`, 'success');
        setUltimoPalletId(pallet_id);
        setCajasSeleccionadas([]);
        cargarCajasDisponibles();
        
        setTimeout(() => {
          if (window.confirm('¿Generar código QR?')) {
            handleGenerarQR(pallet_id);
          }
        }, 500);
      } else {
        showMessage(response.message || 'Error al crear pallet', 'error');
      }
    } catch (error) {
      showMessage('Error al crear pallet', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarQR = async (palletId = ultimoPalletId) => {
    if (!palletId) return;

    setLoading(true);
    try {
      const response = await palletService.generarQRPallet(palletId, 'dataURL');
      if (response.success) {
        setQrDataURL(response.dataURL);
        setShowQRModal(true);
      }
    } catch (error) {
      showMessage('Error al generar QR', 'error');
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
  };

  const pesoTotal = cajasSeleccionadas.reduce((sum, c) => sum + parseFloat(c.peso_neto || 0), 0);
  const cantidadCajas = cajasSeleccionadas.length;

  return (
    <div className="pallet-container">
      <div className="dashboard-header">
        <h2>Armado de Pallet</h2>
      </div>

      <div className="pallet-card">
        {message.text && (
          <div className={`pallet-message pallet-message-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="pallet-filters">
          <h3>Filtros</h3>
          <div className="filters-grid">
            <div className="filter-item">
              <label>Producto *</label>
              <select value={filtros.producto_id} onChange={(e) => handleFiltroChange('producto_id', e.target.value)}>
                <option value="">Seleccionar...</option>
                {productos.map(p => (
                  <option key={p.producto_id} value={p.producto_id}>{p.producto_nombre}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Lote</label>
              <select value={filtros.lote_id} onChange={(e) => handleFiltroChange('lote_id', e.target.value)} disabled={!filtros.producto_id}>
                <option value="">Todos...</option>
                {lotes.map(l => (
                  <option key={l.lote_id} value={l.lote_id}>{l.descripcion || `Lote ${l.lote_id}`}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Sublote</label>
              <select value={filtros.sublote_id} onChange={(e) => handleFiltroChange('sublote_id', e.target.value)} disabled={!filtros.lote_id}>
                <option value="">Todos...</option>
                {sublotes.map(sl => (
                  <option key={sl.sublote_id} value={sl.sublote_id}>{sl.calibre || `Sublote ${sl.sublote_id}`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pallet-main-grid">
          <div className="pallet-column-left">
            <div className="pallet-inner-box">
              <div className="pallet-header-section">
                <h4>Cajas disponibles ({cajasDisponibles.length})</h4>
                {cajasDisponibles.length > 0 && (
                  <button className="pallet-button-small" onClick={seleccionarTodas}>
                    Seleccionar todas
                  </button>
                )}
              </div>

              <div className="pallet-cajas-list">
                {loading && <div className="pallet-loading">Cargando...</div>}
                
                {!loading && cajasDisponibles.length === 0 && (
                  <div className="pallet-empty-state">
                    {filtros.producto_id ? 'No hay cajas disponibles' : 'Selecciona un producto'}
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
                        <span className="caja-id">{caja.caja_id}</span>
                        <span className="caja-peso">{parseFloat(caja.peso_neto || 0).toFixed(2)} kg</span>
                      </div>
                      {isSelected && <i className="fas fa-check-circle"></i>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pallet-column-right">
            <div className="pallet-inner-box">
              <h4>Cajas seleccionadas ({cantidadCajas})</h4>

              <div className="pallet-selected-list">
                {cajasSeleccionadas.length === 0 && (
                  <div className="pallet-empty-state">No hay cajas seleccionadas</div>
                )}

                {cajasSeleccionadas.map((caja) => (
                  <div key={caja.caja_id} className="pallet-selected-item">
                    <span className="caja-id">{caja.caja_id}</span>
                    <span className="caja-peso">{parseFloat(caja.peso_neto || 0).toFixed(2)} kg</span>
                    <button className="pallet-remove-btn" onClick={() => toggleCajaSeleccion(caja)}>×</button>
                  </div>
                ))}
              </div>

              <div className="pallet-config">
                <h5>Configuración</h5>
                <div className="config-item">
                  <label>Tipo de Pallet</label>
                  <select value={tipoPallet} onChange={(e) => setTipoPallet(e.target.value)}>
                    <option value="Europallet">Europallet (120x80cm)</option>
                    <option value="Americano">Americano (120x100cm)</option>
                    <option value="Universal">Universal (100x120cm)</option>
                    <option value="Maritimo">Marítimo (110x110cm)</option>
                  </select>
                </div>
              </div>

              <div className="pallet-summary-footer">
                <div className="pallet-summary-stats">
                  <div className="pallet-stat-item">Cajas: <span>{cantidadCajas}</span></div>
                  <div className="pallet-stat-item">Peso: <span>{pesoTotal.toFixed(2)} kg</span></div>
                </div>

                <div className="pallet-summary-actions">
                  {cajasSeleccionadas.length > 0 && (
                    <button className="pallet-button-secondary" onClick={limpiarSeleccion}>
                      Limpiar
                    </button>
                  )}
                  <button
                    className="pallet-button-primary"
                    onClick={handleCrearPallet}
                    disabled={cajasSeleccionadas.length === 0 || loading}
                  >
                    {loading ? 'Creando...' : 'Crear Pallet'}
                  </button>
                </div>
              </div>

              {ultimoPalletId && (
                <div className="pallet-qr-section">
                  <button className="pallet-button-qr" onClick={() => handleGenerarQR()}>
                    <i className="fas fa-qrcode"></i> Ver QR
                  </button>
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
              <h3>QR - Pallet {ultimoPalletId}</h3>
              <button className="pallet-modal-close" onClick={() => setShowQRModal(false)}>×</button>
            </div>
            <div className="pallet-modal-body">
              {qrDataURL && <img src={qrDataURL} alt="QR Code" className="qr-image" />}
            </div>
            <div className="pallet-modal-footer">
              <button className="pallet-button-secondary" onClick={() => setShowQRModal(false)}>Cerrar</button>
              <button className="pallet-button-primary" onClick={descargarQR}>
                <i className="fas fa-download"></i> Descargar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pallet;