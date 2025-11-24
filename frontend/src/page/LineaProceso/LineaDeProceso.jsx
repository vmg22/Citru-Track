import React, { useState, useEffect } from 'react';
import * as procesoService from './services/procesoService';


import BandejaEnProceso from './BandejaEnProceso'; 
import GestionLotes from './GestionLotes';       
import ListaLotes from './ListaLotes'; 
import '../../style/lineaproceso.css';

const LineadeProceso = () => {
  const [tabActiva, setTabActiva] = useState('proceso');
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const fetchProds = async () => {
      try {
        const res = await procesoService.getProductosConVariedades();
        setProductos(res.data || []);
      } catch (e) { console.error(e); }
    };
    fetchProds();
  }, []);

  return (
    <div className="linea-proceso-container">
      <div className="header-proceso">
        <h2>Linea de Proceso</h2>
        
        <div className="tabs-container">
           <button 
             className={`tab-btn ${tabActiva === 'proceso' ? 'active' : ''}`}
             onClick={() => setTabActiva('proceso')}
           >
              En Proceso
           </button>
           <button 
             className={`tab-btn ${tabActiva === 'loteo' ? 'active' : ''}`}
             onClick={() => setTabActiva('loteo')}
           >
              Gestion de Lotes
           </button>
           <button 
             className={`tab-btn ${tabActiva === 'listado' ? 'active' : ''}`}
             onClick={() => setTabActiva('listado')}
           >
              Lista Lotes
           </button>
        </div>
      </div>

      <div className="tab-body">
        {tabActiva === 'proceso' && <BandejaEnProceso productos={productos} />}
        {tabActiva === 'loteo' && <GestionLotes productos={productos} />}
        {tabActiva === 'listado' && <ListaLotes />}
      </div>
    </div>
  );
};

export default LineadeProceso;