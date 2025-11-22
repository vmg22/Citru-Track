import React, { useState } from "react";
import ConfigNavbar from "./components/ConfigNavbar";
import UsuariosTable from "./components/UsuariosTable";
import ChoferTransporte from "./components/ChoferTransporte";
import Productores from "./components/Productores";
import Camara from "./components/Camara";
import ProductoVariedades from "./components/ProductoVariedades";
import Camion from "./components/Camion";

const Ajustes = () => {
  const [activePanel, setActivePanel] = useState("camaras");

  //  manejar el cambio de panel
  const handlePanelChange = (panelId) => {
    setActivePanel(panelId);
    console.log(`Cambiando a panel: ${panelId}`);
  };

  // renderizar el panel activo
  const renderPanelContent = () => {
    switch (activePanel) {
      case "usuarios":
        return <UsuariosTable />;
      case "transporte":
        return <ChoferTransporte />;
      case "productores":
        return <Productores />;
      case "camaras":
        return <Camara />;
      case "productos":
        return <ProductoVariedades />;
        case "camion":
        return <Camion />;
      default:
        return <h2>Configuración para el panel: {activePanel}</h2>;
    }
  };

  return (
    <div>
      <ConfigNavbar
        activePanel={activePanel}
        onPanelChange={handlePanelChange}
      />

      {/* Contenido principal de la página de ajustes */}
      <div className="ajustes-content" style={{ padding: "20px" }}>
        {renderPanelContent()}
      </div>
    </div>
  );
};

export default Ajustes;
