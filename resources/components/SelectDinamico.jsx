import React, { useState, useEffect, useRef } from "react";
import "../css/select.css";

function SelectDinamico({ opciones, valor, setValor, placeholder = "Selecciona..." }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Manejo de teclado
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(!open);
    } else if (event.key === "Escape") {
      setOpen(false);
      containerRef.current.querySelector(".select-global-custom").focus();
    }
  };

  return (
    <div
      className="select-global-container-inline"
      ref={containerRef}
      role="listbox"
      aria-expanded={open}
      aria-haspopup="listbox"
    >
      <div
        className={`select-global-custom ${open ? "open" : ""}`}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        /* Usamos el valor para la accesibilidad, aunque no se muestre visualmente */
        aria-label={`Opciones de ordenamiento: ${valor || placeholder}`} 
      >
        {/* 🛑 Hemos ELIMINADO el <span className="select-global-text"> */}
        
        {/* 🎯 Este es el único elemento visible en el botón */}
        <span className="select-toggle-icon" aria-hidden="true">
          ↑↓
        </span>
      </div>

      <div className={`select-global-options-inline ${open ? "open" : ""}`}>
        {opciones.map((op, i) => (
          <div
            key={i}
            className={op === valor ? "selected" : ""}
            onClick={() => {
              setValor(op);
              setOpen(false);
            }}
            role="option"
            aria-selected={op === valor}
            tabIndex={-1}
          >
            {op}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SelectDinamico;

