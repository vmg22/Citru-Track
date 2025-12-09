import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import { 
  getTransportistas, 
  getCamiones, 
  getChoferes, 
  getPalletsDelPedido,
  updatePedido 
} from '../../services/pedidosService';
import { generarRemitoRechazado } from '../../services/remitoRechazadoService';
import Swal from 'sweetalert2';
import '../../style/modalRechazado.css';

const ModalEditarRechazado = ({ pedido, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    destino: '',
    tipoDestino: '',
    fechaProgramada: '',
    transportistaId: '',
    camionId: '',
    choferId: ''
  });
  
  const [pallets, setPallets] = useState([]);
  const [transportistas, setTransportistas] = useState([]);
  const [camiones, setCamiones] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (pedido) {
      console.log('📦 Pedido recibido en modal:', pedido);
      console.log('🆔 od_id:', pedido.od_id, 'orden_id:', pedido.orden_id);
      
      cargarDatos();
      setFormData({
        destino: pedido.destino || '',
        tipoDestino: 'regreso_planta', // Siempre fijo en regreso_planta
        fechaProgramada: pedido.fecha_programada ? pedido.fecha_programada.split('T')[0] : '',
        transportistaId: pedido.transportista_id || '',
        camionId: pedido.camion_id || '',
        choferId: pedido.chofer_id || ''
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      console.log('📦 Cargando datos para pedido:', pedido.od_id || pedido.orden_id);
      
      const pedidoId = pedido.od_id || pedido.orden_id;
      console.log('🎯 Obteniendo pallets para od_id:', pedidoId);
      
      const [transpData, camData, choData, palletsData] = await Promise.all([
        getTransportistas(),
        getCamiones(),
        getChoferes(),
        getPalletsDelPedido(pedidoId)
      ]);

      setTransportistas(Array.isArray(transpData) ? transpData : []);
      setCamiones(Array.isArray(camData) ? camData : []);
      setChoferes(Array.isArray(choData) ? choData : []);
      setPallets(Array.isArray(palletsData) ? palletsData : []);
      
      console.log('✅ Datos cargados:', {
        transportistas: transpData.length,
        camiones: camData.length,
        choferes: choData.length,
        pallets: palletsData.length
      });
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      setError('Error al cargar datos del pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si cambia transportista, resetear camión y chofer
    if (name === 'transportistaId') {
      setFormData(prev => ({
        ...prev,
        transportistaId: value,
        camionId: '',
        choferId: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async () => {
    // Validar campos requeridos antes de mostrar confirmación
    if (!formData.destino || !formData.tipoDestino || !formData.fechaProgramada) {
      Swal.fire({
        title: '⚠️ Campos requeridos',
        text: 'Por favor complete todos los campos obligatorios (Destino, Tipo de Destino y Fecha)',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Validar que tipoDestino sea válido
    const tiposValidos = ['aeropuerto', 'puerto', 'otra_ciudad', 'regreso_planta'];
    const tipoNormalizado = formData.tipoDestino?.toLowerCase().trim();
    if (!tiposValidos.includes(tipoNormalizado)) {
      Swal.fire({
        title: '⚠️ Tipo de destino inválido',
        text: `El tipo de destino "${formData.tipoDestino}" no es válido. Seleccione una opción del menú.`,
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Mostrar confirmación
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: '¿Desea guardar los cambios y cambiar el estado a EN RUTA?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#15BA84',
      cancelButtonColor: '#d33'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    setError(null);

    try {
      console.log('📝 FormData completo antes de enviar:', formData);
      
      // Asegurar que tipoDestino sea un valor válido
      let tipoDestinoNormalizado = (formData.tipoDestino || '').toLowerCase().trim();
      
      // Mapeo de valores con espacios a formato correcto
      const mapeoTipos = {
        'regreso a planta': 'regreso_planta',
        'regreso_a_planta': 'regreso_planta',
        'otra ciudad': 'otra_ciudad',
        'otra_ciudad': 'otra_ciudad',
        'aeropuerto': 'aeropuerto',
        'puerto': 'puerto',
        'regreso_planta': 'regreso_planta'
      };
      
      tipoDestinoNormalizado = mapeoTipos[tipoDestinoNormalizado] || tipoDestinoNormalizado;
      
      console.log('🔍 Valor original tipoDestino:', formData.tipoDestino);
      console.log('🔍 Valor normalizado:', tipoDestinoNormalizado);
      
      if (!['aeropuerto', 'puerto', 'otra_ciudad', 'regreso_planta'].includes(tipoDestinoNormalizado)) {
        console.error('❌ tipo_destino inválido:', tipoDestinoNormalizado);
        Swal.fire({
          title: 'Error de validación',
          text: `Tipo de destino inválido: "${formData.tipoDestino}". Debe ser: aeropuerto, puerto, otra_ciudad o regreso_planta`,
          icon: 'error',
          confirmButtonText: 'Cerrar'
        });
        return;
      }
      
      const destinoTrimmed = (formData.destino || '').trim();
      console.log('🔍 Destino original:', formData.destino);
      console.log('🔍 Destino trimmed:', destinoTrimmed);
      console.log('🔍 Destino length:', destinoTrimmed.length);
      
      const payload = {
        destino: destinoTrimmed,
        tipo_destino: tipoDestinoNormalizado,
        fecha_programada: formData.fechaProgramada,
        transportista_id: formData.transportistaId ? parseInt(formData.transportistaId) : null,
        camion_id: formData.camionId ? parseInt(formData.camionId) : null,
        chofer_id: formData.choferId ? parseInt(formData.choferId) : null,
        estado: 'en_ruta'
      };

      console.log('📤 Enviando payload completo:', JSON.stringify(payload, null, 2));
      console.log('📤 od_id:', pedido.od_id || pedido.orden_id);
      
      await updatePedido(pedido.od_id || pedido.orden_id, payload);
      
      // 📄 Generar PDF del remito rechazado
      const transportistaSeleccionado = transportistas.find(t => t.transportista_id === parseInt(formData.transportistaId));
      const camionSeleccionado = camiones.find(c => c.camion_id === parseInt(formData.camionId));
      const choferSeleccionado = choferes.find(ch => ch.chofer_id === parseInt(formData.choferId));
      
      const datosPDF = {
        od_id: pedido.od_id || pedido.orden_id,
        od_code: pedido.od_code,
        fechaProgramada: formData.fechaProgramada,
        destino: formData.destino,
        tipoDestino: tipoDestinoNormalizado, // Usar valor normalizado
        clienteNombre: pedido.cliente_nombre,
        clienteDireccion: pedido.cliente_direccion || "N/A",
        clienteCuit: pedido.cliente_cuit || "N/A",
        choferNombre: choferSeleccionado?.nombre || "No asignado",
        choferDni: choferSeleccionado?.dni || "N/A",
        camionTipo: camionSeleccionado?.tipo_camion || "No asignado",
        camionPatente: camionSeleccionado?.patente || "N/A",
        transportistaNombre: transportistaSeleccionado?.nombre || "No asignado",
        observaciones: `Orden previamente rechazada. Acción: Reprocesamiento con destino ${tipoDestinoNormalizado.replace('_', ' ')}`,
        pallets: pallets,
        estado: "RECHAZADO → EN RUTA",
        accion: "Reprocesamiento y Reenvío",
      };
      
      console.log('📄 Generando PDF con datos:', datosPDF);
      await generarRemitoRechazado(datosPDF);
      
      Swal.fire({
        title: '¡Guardado!',
        text: 'Los cambios se han guardado y el remito fue generado exitosamente.',
        icon: 'success',
        timer: 2500,
        showConfirmButton: false
      });
      
      if (onSave) {
        await onSave();
      }
      
      onClose();
    } catch (err) {
      console.error('❌ Error guardando cambios:', err);
      const errorMsg = err.message || 'Error al guardar los cambios';
      setError(errorMsg);
      
      Swal.fire({
        title: 'Error',
        text: errorMsg,
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!pedido) return null;

  // Filtrar camiones según transportista seleccionado
  const camionesDisponibles = camiones.filter(c => {
    if (!formData.transportistaId) return false;
    return String(c.transportista_id) === String(formData.transportistaId);
  });

  // Filtrar choferes según transportista seleccionado
  const choferesDisponibles = choferes.filter(ch => {
    if (!formData.transportistaId) return false;
    return String(ch.transportista_id) === String(formData.transportistaId);
  });

  // Calcular totales de pallets
  const totalPallets = pallets.length;
  const pesoTotal = pallets.reduce((sum, p) => sum + parseFloat(p.peso_total || 0), 0);

  return (
    <div className="modal-overlay-rechazado" onClick={onClose}>
      <div className="modal-container-rechazado" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-rechazado">
          <h2>Editar Pedido Rechazado</h2>
          <button onClick={onClose} className="btn-close-rechazado">✕</button>
        </div>

        {error && (
          <Alert variant="danger" className="mx-4 mt-3">
            <strong>⚠️ Error:</strong> {error}
          </Alert>
        )}

        <div className="modal-body-rechazado">
          {/* Información General */}
          <div className="section-rechazado">
            <h5 className="section-title-rechazado">Información General</h5>
            <div className="info-grid-rechazado">
              <div className="info-item-rechazado">
                <label>Código OD:</label>
                <span className="info-value-rechazado">{pedido.od_code}</span>
              </div>
              <div className="info-item-rechazado">
                <label>Cliente:</label>
                <span className="info-value-rechazado">{pedido.cliente_nombre}</span>
              </div>
              <div className="info-item-rechazado">
                <label>Producto:</label>
                <span className="info-value-rechazado">ID: {pedido.producto_id}</span>
              </div>
              <div className="info-item-rechazado">
                <label>Estado:</label>
                <Badge bg="danger" className="px-3 py-2">
                  {pedido.estado?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Destino */}
          <div className="section-rechazado">
            <h5 className="section-title-rechazado">Destino</h5>
            <div className="form-grid-rechazado">
              
              <Form.Group>
                <Form.Label>Tipo de Destino *</Form.Label>
                <Form.Select
                  name="tipoDestino"
                  value={formData.tipoDestino}
                  onChange={handleChange}
                  disabled
                  style={{ color: '#000', opacity: 1 }}
                >
                  <option value="regreso_planta">Regreso a Planta</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group>
                <Form.Label>Fecha Programada *</Form.Label>
                <Form.Control
                  type="date"
                  name="fechaProgramada"
                  value={formData.fechaProgramada}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
          </div>

          {/* Asignación Logística */}
          <div className="section-rechazado">
            <h5 className="section-title-rechazado">Asignación Logística</h5>
            <div className="form-grid-rechazado">
              <Form.Group>
                <Form.Label>Transportista</Form.Label>
                <Form.Select
                  name="transportistaId"
                  value={formData.transportistaId}
                  onChange={handleChange}
                >
                  <option value="">Sin asignar</option>
                  {transportistas.map(t => (
                    <option key={t.transportista_id} value={t.transportista_id}>
                      {t.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              
              <Form.Group>
                <Form.Label>Camión</Form.Label>
                <Form.Select
                  name="camionId"
                  value={formData.camionId}
                  onChange={handleChange}
                  disabled={!formData.transportistaId}
                >
                  <option value="">Sin asignar</option>
                  {camionesDisponibles.length > 0 ? (
                    camionesDisponibles.map(c => (
                      <option key={c.camion_id} value={c.camion_id}>
                        {c.patente} - {c.tipo_camion}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      {formData.transportistaId 
                        ? 'No hay camiones para este transportista' 
                        : 'Seleccione un transportista primero'}
                    </option>
                  )}
                </Form.Select>
              </Form.Group>
              
              <Form.Group>
                <Form.Label>Chofer</Form.Label>
                <Form.Select
                  name="choferId"
                  value={formData.choferId}
                  onChange={handleChange}
                  disabled={!formData.transportistaId}
                >
                  <option value="">Sin asignar</option>
                  {choferesDisponibles.length > 0 ? (
                    choferesDisponibles.map(ch => (
                      <option key={ch.chofer_id} value={ch.chofer_id}>
                        {ch.nombre}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      {formData.transportistaId 
                        ? 'No hay choferes para este transportista' 
                        : 'Seleccione un transportista primero'}
                    </option>
                  )}
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          {/* Pallets Asociados */}
          <div className="section-rechazado">
            <h5 className="section-title-rechazado">📦 Pallets Asociados</h5>
            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" className="me-2" />
                Cargando pallets...
              </div>
            ) : pallets.length > 0 ? (
              <>
                <div className="table-responsive">
                  <Table striped bordered hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ID Pallet</th>
                        <th>Lote</th>
                        <th className="text-center">Cajas</th>
                        <th className="text-center">Peso (kg)</th>
                        <th>Tipo</th>
                        <th className="text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pallets.map(p => (
                        <tr key={p.pallet_id}>
                          <td><strong>{p.pallet_id}</strong></td>
                          <td>{p.lote_descripcion || 'N/A'}</td>
                          <td className="text-center">
                            <Badge bg="info">{p.cantidad_cajas || 0}</Badge>
                          </td>
                          <td className="text-center">
                            <strong>{parseFloat(p.peso_total || 0).toFixed(2)}</strong>
                          </td>
                          <td>{p.tipo_pallet || '-'}</td>
                          <td className="text-center">
                            <Badge bg="warning">{p.estado}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <div className="pallets-summary-rechazado mt-3">
                  <Badge bg="primary" className="me-3 px-3 py-2">
                    <strong>Total Pallets:</strong> {totalPallets}
                  </Badge>
                  <Badge bg="success" className="px-3 py-2">
                    <strong>Peso Total:</strong> {pesoTotal.toFixed(2)} kg
                  </Badge>
                </div>
              </>
            ) : (
              <Alert variant="info" className="mb-0">
                No hay pallets asociados a este pedido
              </Alert>
            )}
          </div>
        </div>

        <div className="modal-footer-rechazado">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="success" style={{color: 'white'}} onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalEditarRechazado;


