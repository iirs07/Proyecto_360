import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import "../css/global.css"; 

const ErrorMensaje = ({ mensaje }) => {
  if (!mensaje) return null;

  return (
    <small className="error-global">
      <FaExclamationTriangle className="error-icon-global" />
      {mensaje}
    </small>
  );
};

export default ErrorMensaje;
