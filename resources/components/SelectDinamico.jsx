import React, { useState } from "react";
import { FaAngleDown } from "react-icons/fa";
import "../css/formulario.css";

function SelectDinamico({ opciones, valor, setValor }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="select-global-container-inline">
      <div
        className="select-global-custom"
        onClick={() => setOpen(!open)}
      >
        {valor}
        <FaAngleDown className={`select-global-dropdown-icon ${open ? "open" : ""}`} />
      </div>

      {/* Dropdown absoluto sobre el select */}
      {open && (
        <div className="select-global-options-inline">
          {opciones.map((op, i) => (
            <div
              key={i}
              onClick={() => {
                setValor(op);
                setOpen(false);
              }}
            >
              {op}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SelectDinamico;

