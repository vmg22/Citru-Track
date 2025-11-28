import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import '../../../style/qrScanner.css';

const QRCameraScanner = ({ onCajaDetectada, lineaActual, productoActual }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [scanHistory, setScanHistory] = useState([]);
  const [cameraError, setCameraError] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const html5QrCodeRef = useRef(null);
  const scannerIdRef = useRef('qr-reader');

  // Inicializar el escáner cuando el componente se monta
  useEffect(() => {
    return () => {
      // Limpiar el escáner cuando el componente se desmonta
      if (html5QrCodeRef.current && isScanning) {
        stopScanning();
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setCameraError('');
      
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerIdRef.current);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.333,
      };

      await html5QrCodeRef.current.start(
        { facingMode: "environment" }, // Usar cámara trasera en móviles
        config,
        onScanSuccess,
        onScanError
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Error al iniciar el escaneo:', err);
      setCameraError('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      }
    } catch (err) {
      console.error('Error al detener el escaneo:', err);
    }
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    // Evitar procesar el mismo código múltiples veces
    if (decodedText === lastScannedCode) {
      return;
    }

    setLastScannedCode(decodedText);
    
    // Intentar parsear el código QR como JSON
    let cajaData;
    try {
      // Si el código es un JSON, parsearlo
      cajaData = JSON.parse(decodedText);
    } catch (e) {
      // Si no es JSON, asumir que es un código simple (string)
      cajaData = {
        codigo_qr: decodedText,
        linea: lineaActual,
        producto_id: productoActual,
      };
    }

    // Si es un objeto JSON válido con caja_id, usar esos datos
    if (cajaData.caja_id) {
      // El QR contiene todos los datos de la caja
      const displayCode = cajaData.caja_id;
      
      // Agregar al historial
      const newScan = {
        code: displayCode,
        timestamp: new Date().toLocaleTimeString('es-AR'),
      };
      setScanHistory(prev => [newScan, ...prev.slice(0, 4)]);

      console.log('📦 QR con datos JSON detectado:', cajaData);

      // Enviar al backend con todos los datos
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const response = await axios.post(`${API_URL}/api/cajas/ingresar`, cajaData);

        if (response.data.success) {
          // Notificar al componente padre
          if (onCajaDetectada) {
            onCajaDetectada(response.data.caja);
          }

          // Mostrar feedback visual
          showSuccessFeedback();
        }
      } catch (error) {
        console.error('❌ Error al registrar la caja (JSON):', error);
        console.error('❌ Detalles del error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        if (error.response?.data?.message) {
          showErrorFeedback(error.response.data.message);
        } else {
          showErrorFeedback('Error desconocido al registrar la caja');
        }
      }
    } else {
      // Código QR simple (formato antiguo)
      const newScan = {
        code: decodedText,
        timestamp: new Date().toLocaleTimeString('es-AR'),
      };
      setScanHistory(prev => [newScan, ...prev.slice(0, 4)]);

      // Preparar datos para enviar
      const dataToSend = {
        codigo_qr: decodedText,
        linea: lineaActual,
        producto_id: productoActual,
      };

      console.log('📦 Datos a enviar al backend:', dataToSend);
      console.log('📝 Tipo de producto_id:', typeof dataToSend.producto_id);

      // Enviar al backend
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const response = await axios.post(`${API_URL}/api/cajas/ingresar`, dataToSend);


        if (response.data.success) {
          // Notificar al componente padre
          if (onCajaDetectada) {
            onCajaDetectada(response.data.caja);
          }

          // Mostrar feedback visual
          showSuccessFeedback();
        }
      } catch (error) {
        console.error('❌ Error al registrar la caja:', error);
        console.error('❌ Detalles del error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        if (error.response?.data?.message) {
          showErrorFeedback(error.response.data.message);
        } else {
          showErrorFeedback('Error desconocido al registrar la caja');
        }
      }
    }
  };

  const onScanError = (errorMessage) => {
    // Ignorar errores normales de escaneo (cuando no detecta un código)
    // Solo loguear si es un error real
    if (!errorMessage.includes('NotFoundException')) {
      console.warn('Error de escaneo:', errorMessage);
    }
  };

  const showSuccessFeedback = () => {
    const reader = document.getElementById(scannerIdRef.current);
    if (reader) {
      reader.classList.add('qr-success-flash');
      setTimeout(() => {
        reader.classList.remove('qr-success-flash');
      }, 500);
    }
  };

  const showErrorFeedback = (message) => {
    const reader = document.getElementById(scannerIdRef.current);
    if (reader) {
      reader.classList.add('qr-error-flash');
      setTimeout(() => {
        reader.classList.remove('qr-error-flash');
      }, 500);
    }
    alert(message);
  };

  return (
    <div className={`qr-scanner-container ${isMinimized ? 'minimized' : ''}`}>
      <div className="qr-scanner-header">
        <div className="qr-scanner-title">
          <i className="fas fa-qrcode"></i>
          <span>Escaneo QR</span>
        </div>
        <div className="qr-scanner-controls">
          <button
            className="qr-control-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Maximizar' : 'Minimizar'}
          >
            <i className={`fas fa-${isMinimized ? 'window-maximize' : 'window-minimize'}`}></i>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="qr-scanner-video-container">
            <div id={scannerIdRef.current} className="qr-reader"></div>
            {!isScanning && (
              <div className="qr-scanner-placeholder">
                <i className="fas fa-camera fa-3x"></i>
                <p>Presiona "Iniciar Escaneo" para activar la cámara</p>
              </div>
            )}
          </div>

          <div className="qr-scanner-actions">
            {!isScanning ? (
              <button className="qr-btn qr-btn-start" onClick={startScanning}>
                <i className="fas fa-play"></i>
                Iniciar Escaneo
              </button>
            ) : (
              <button className="qr-btn qr-btn-stop" onClick={stopScanning}>
                <i className="fas fa-stop"></i>
                Detener Escaneo
              </button>
            )}
          </div>

          {cameraError && (
            <div className="qr-scanner-error">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{cameraError}</span>
            </div>
          )}

          {lastScannedCode && (
            <div className="qr-scanner-last-code">
              <strong>Último código:</strong> {lastScannedCode}
            </div>
          )}

          {scanHistory.length > 0 && (
            <div className="qr-scanner-history">
              <div className="qr-history-title">Historial (últimos 5)</div>
              {scanHistory.map((scan, index) => (
                <div key={index} className="qr-history-item">
                  <span className="qr-history-code">{scan.code}</span>
                  <span className="qr-history-time">{scan.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QRCameraScanner;
