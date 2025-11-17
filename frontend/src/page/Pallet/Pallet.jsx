import React from 'react'
import { useState } from 'react';
import "../../style/pallet.css"
const Pallet = () => {
  // --- Estados de React ---
  
  // 1. Cajas en la lista "disponibles"
  const [cajasDisponibles, setCajasDisponibles] = useState([
    { id: 'CX-12345', peso: '14.50' },
    { id: 'CX-12346', peso: '15.10' },
    { id: 'CX-12347', peso: '14.90' },
  ]);

  // 2. Los 64 espacios del pallet (null si está vacío, o un objeto 'caja' si está lleno)
  const [palletSlots, setPalletSlots] = useState(Array(64).fill(null));

  // 3. Mensaje de estado (para reemplazar el 'alert()')
  const [message, setMessage] = useState('');

  // --- Lógica y Handlers ---

  // Muestra un mensaje temporal
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000); // Se borra después de 3 seg
  };

  // 1. Generar una nueva caja (simulación)
  const handleGenerarCaja = () => {
    const id = 'CX-' + Date.now().toString().slice(-6);
    const pesoKg = (Math.random() * 2 + 13).toFixed(2);
    const newCaja = { id: id, peso: pesoKg };
    
    // Añade la nueva caja al inicio de la lista
    setCajasDisponibles(prevCajas => [newCaja, ...prevCajas]);
  };

  // 2. Añadir caja haciendo clic en un SLOT VACÍO
  // (Toma la PRIMERA caja de la lista y la pone en el slot clickeado)
  const handleSlotClick = (slotIndex) => {
    // Si el slot ya está ocupado, o no hay cajas para añadir, no hacer nada
    if (palletSlots[slotIndex] || cajasDisponibles.length === 0) {
      return;
    }

    // Tomar la primera caja de la lista
    const cajaToAdd = cajasDisponibles[0];
    const newCajasDisponibles = cajasDisponibles.slice(1); // El resto de las cajas

    // Colocar la caja en el slot
    const newPalletSlots = [...palletSlots];
    newPalletSlots[slotIndex] = cajaToAdd;

    // Actualizar estados
    setPalletSlots(newPalletSlots);
    setCajasDisponibles(newCajasDisponibles);
  };

  // 3. Añadir caja haciendo clic en el botón "ADD" de la lista
  // (Toma la caja de ESA fila y la pone en el PRIMER slot vacío)
  const handleAddCajaDesdeLista = (cajaId) => {
    // 1. Encontrar el primer slot vacío
    const primerSlotVacio = palletSlots.findIndex(slot => slot === null);

    if (primerSlotVacio === -1) {
      showMessage('El pallet está lleno. No se pueden añadir más cajas.');
      return;
    }

    // 2. Encontrar la caja en la lista de disponibles
    const cajaIndex = cajasDisponibles.findIndex(c => c.id === cajaId);
    if (cajaIndex === -1) return; // La caja no se encontró (raro)

    const cajaToAdd = cajasDisponibles[cajaIndex];

    // 3. Quitar la caja de la lista de disponibles
    const newCajasDisponibles = cajasDisponibles.filter((_, i) => i !== cajaIndex);

    // 4. Poner la caja en el primer slot vacío
    const newPalletSlots = [...palletSlots];
    newPalletSlots[primerSlotVacio] = cajaToAdd;

    // 5. Actualizar estados
    setPalletSlots(newPalletSlots);
    setCajasDisponibles(newCajasDisponibles);
  };

  // 4. Cerrar el pallet
  const handleCerrarPallet = () => {
    const palletId = 'PALT-' + Date.now().toString().slice(-6);
    
    // Usamos los valores calculados
    const msg = `Pallet cerrado: ${palletId} | Cajas: ${cajasAñadidas} | Peso: ${pesoTotal.toFixed(2)}kg`;
    showMessage(msg);

    // Resetear todo
    setPalletSlots(Array(64).fill(null));
    setCajasDisponibles([]); // Limpiamos también las cajas disponibles
  };


  // --- Valores Calculados (Derived State) ---
  // Se calculan en cada render
  const cajasEnPallet = palletSlots.filter(Boolean);
  const cajasAñadidas = cajasEnPallet.length;
  const pesoTotal = cajasEnPallet.reduce((sum, caja) => sum + (caja ? parseFloat(caja.peso) : 0), 0);
  const isPalletEmpty = cajasAñadidas === 0;

  return (
    <div className="pallet-container" id="pallet">
      <div className="dashboard-header">
          <h2>Armado de Pallet</h2>
          <div className="dashboard-user-info">
            <i className="fas fa-user-circle"></i>
            <span>Administrador</span>
          </div>
        </div>
      <div className="pallet-card">
        
        {/* Mensaje de estado */}
        {message && (
          <div className="pallet-message">
            {message}
          </div>
        )}        
        <div className="pallet-main-grid">
          
          {/* Columna Izquierda: Cajas Disponibles */}
          <div className="pallet-column-left">
            <div className="pallet-inner-box">
              <h4 className="pallet-subtitle">Cajas disponibles ({cajasDisponibles.length})</h4>
              
              <ul id="cajasAvailable" className="pallet-cajas-list">
                {/* Renderizado dinámico de la lista de cajas */}
                {cajasDisponibles.length === 0 && (
                  <li className="pallet-caja-item-empty">No hay cajas disponibles.</li>
                )}
                {cajasDisponibles.map((caja) => (
                  <li key={caja.id} className="pallet-caja-item">
                    <span>{caja.id} - {caja.peso}kg</span>
                    <button 
                      className="pallet-caja-add-btn"
                      onClick={() => handleAddCajaDesdeLista(caja.id)}
                    >
                      Añadir
                    </button>
                  </li>
                ))}
              </ul>
              
              <button 
                id="generarCaja" 
                className="pallet-button-generar"
                onClick={handleGenerarCaja}
              >
                Generar caja
              </button>
            </div>
          </div>

          {/* Columna Derecha: Pallet Grid */}
          <div className="pallet-column-right">
            <div className="pallet-inner-box">
              <h4 className="pallet-subtitle">Pallet ({cajasAñadidas} / 64 slots)</h4>
              
              <div id="palletGrid" className="pallet-grid-slots" style={{minHeight: '220px'}}>
                {/* Renderizado dinámico de los 64 slots */}
                {palletSlots.map((caja, index) => (
                  <div 
                    key={index} 
                    className={`pallet-slot ${caja ? 'filled' : 'empty'}`}
                    onClick={() => handleSlotClick(index)}
                    title={caja ? `${caja.id} - ${caja.peso}kg` : 'Slot vacío - Click para añadir'}
                  >
                    {caja ? caja.id : ''}
                  </div>
                ))}
              </div>

              {/* Footer con el resumen y botón de cierre */}
              <div className="pallet-summary-footer">
                <div className="pallet-summary-stats">
                  <div className="pallet-stat-item">Cajas añadidas: <span id="countAdded">{cajasAñadidas}</span></div>
                  <div className="pallet-stat-item">Peso total: <span id="pesoTotal">{pesoTotal.toFixed(2)}</span> kg</div>
                </div>
                <div className="pallet-summary-actions">
                  <button 
                    id="cerrarPallet" 
                    className="pallet-button-cerrar"
                    onClick={handleCerrarPallet}
                    disabled={isPalletEmpty}
                  >
                    Cerrar Pallet
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Pallet