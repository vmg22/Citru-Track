import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import "../../../style/qrScanner.css";
import {
  FaPlay,
  FaStop,
  FaCamera,
  FaExclamationTriangle,
} from "react-icons/fa";

// Este componente ahora se renderiza INLINE en el flujo del documento.
const QRCameraScanner = ({
  onCajaDetectada,
  lineaActual,
  productoActual,
  isVisible,
}) => {
  // isScanning es interno, ya que solo el componente controla su propia cámara.
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const html5QrCodeRef = useRef(null);
  const scannerIdRef = useRef("qr-reader-inline"); // ID único para el elemento de video

  // La lógica de historial (lastScannedCode, scanHistory) se moverá al componente padre.

  // --- Lógica de Inicialización y Limpieza ---
  useEffect(() => {
    // Detener el escaneo si se oculta el componente
    if (!isVisible && isScanning) {
      stopScanning();
    }

    return () => {
      if (html5QrCodeRef.current && isScanning) {
        // stopScanning(); // No es necesario llamar aquí si lo manejamos en el if anterior
      }
    };
  }, [isVisible]);

  // --- Funciones de Escaneo ---
  const startScanning = async () => {
    try {
      setCameraError("");

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerIdRef.current);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.333,
      };

      // Asegurar que la cámara se detiene antes de empezar si ya estaba activa
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Error al iniciar el escaneo:", err);
      setCameraError(
        "No se pudo acceder a la cámara. Por favor, verifica los permisos."
      );
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      }
    } catch (err) {
      console.error("Error al detener el escaneo:", err);
    }
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    // Notificar al componente padre de la lectura
    if (onCajaDetectada) {
      onCajaDetectada(decodedText); // Enviamos el texto decodificado
    }

    // Simplemente mostramos feedback visual, la lógica de guardado/parseo se hace en el padre
    showSuccessFeedback();
  };

  const onScanError = (errorMessage) => {
    // Ignorar errores normales de escaneo
  };

  const showSuccessFeedback = () => {
    const reader = document.getElementById(scannerIdRef.current);
    if (reader) {
      reader.classList.add("qr-success-flash");
      setTimeout(() => {
        reader.classList.remove("qr-success-flash");
      }, 500);
    }
  };

  // La lógica de `showErrorFeedback` y el llamado a la API se mueve al padre
  // para centralizar el manejo de datos escaneados.

  // Si el componente no es visible, no renderizamos nada, pero lo manejamos
  // con el prop `isVisible` en el padre.

  // --- Renderizado ---
  return (
    <div className="qr-inline-viewer">
      {/* Contenedor de la Cámara */}
      <div className="qr-scanner-video-container">
        <div id={scannerIdRef.current} className="qr-reader"></div>

        {/* Placeholder/Cámara Error */}
        {!isScanning && (
          <div className="qr-scanner-placeholder">
            <FaCamera size={48} />
            {cameraError ? (
              <p className="qr-error-text">
                <FaExclamationTriangle /> {cameraError}
              </p>
            ) : (
              <p>Presiona "Iniciar Escaneo" para activar la cámara</p>
            )}
          </div>
        )}
      </div>

      {/* Acciones (Botones) */}
      <div className="qr-scanner-actions">
        {!isScanning ? (
          <button className="qr-btn qr-btn-start" onClick={startScanning}>
            <FaPlay />
            Iniciar Escaneo
          </button>
        ) : (
          <button className="qr-btn qr-btn-stop" onClick={stopScanning}>
            <FaStop />
            Detener Escaneo
          </button>
        )}
      </div>

      <p style={{ marginTop: "10px", fontSize: "0.8rem", color: "#666" }}>
        Línea: {lineaActual} | Producto: {productoActual}
      </p>
    </div>
  );
};

export default QRCameraScanner;
