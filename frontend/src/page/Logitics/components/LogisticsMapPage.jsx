import React from 'react';
import LogisticsMap from './components/LogisticsMap';

const Logistica = () => {
    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Logística y Distribución</h1>
                    <p className="text-gray-500">Seguimiento en tiempo real de la flota CitrusTrack</p>
                </div>
                
                {/* Botones de acción rápida (Ejemplo) */}
                <div className="flex gap-3">
                    <button className="bg-white text-gray-700 px-4 py-2 rounded shadow border hover:bg-gray-50">
                        Ver Reportes
                    </button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">
                        + Nueva Hoja de Ruta
                    </button>
                </div>
            </div>

            {/* Contenedor del Mapa */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <LogisticsMap />
            </div>
            
            {/* Aquí podrías agregar una tabla debajo con el listado detallado */}
        </div>
    );
};

export default Logistica;