import React from "react";
import { FiArrowLeft } from "react-icons/fi";
import "../css/Empty.css";
import logo3 from "../imagenes/logo3.png";

const EmptyState = ({
  titulo = "SIN DATOS",
  mensaje = "No hay información para mostrar.",
  botonTexto = "Volver",
  onVolver,
  icono = logo3
}) => {
  return (
    <div className="main-container">
      <div className="empty-state-container">
        <img src={icono} alt="Icono" className="escudo-icon" />
        <h2 className="empty-title">{titulo}</h2>
        <p className="empty-description">{mensaje}</p>
        <button onClick={onVolver} className="btn-volver">
          <FiArrowLeft size={20} />
          {botonTexto}
        </button>
      </div>
    </div>
  );
};

export default EmptyState;

