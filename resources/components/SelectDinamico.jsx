import React, { useState, useEffect, useRef } from "react";
import "../css/formulario.css";

// Añadir un prop para el texto placeholder
function SelectDinamico({ opciones, valor, setValor, placeholder = "Selecciona..." }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null); // Referencia al contenedor principal para cerrar al hacer clic fuera

  // Manejador para cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el clic no está dentro del contenedor, lo cierra.
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Manejador para teclas (Accesibilidad)
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Previene la acción por defecto del espacio o enter
      setOpen(!open);
    } else if (event.key === 'Escape') {
      setOpen(false);
      containerRef.current.querySelector('.select-global-custom').focus(); // Vuelve el foco al botón
    }
    // Implementación más compleja para navegar con flechas arriba/abajo...
  };

  return (
    <div 
      className="select-global-container-inline" 
      ref={containerRef}
      // ARIA roles para accesibilidad
      role="listbox" 
      aria-expanded={open}
      aria-haspopup="listbox"
    >
      {/* El botón ahora reacciona al teclado */}
      <div
        className={`select-global-custom ${open ? "open" : ""}`}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown} // Añadir manejo de teclado
        tabIndex={0}
        aria-label={valor || placeholder}
      >
        {valor || placeholder}
      </div>

      <div className={`select-global-options-inline ${open ? "open" : ""}`}>
        {opciones.map((op, i) => (
          <div
            key={i}
            // Agrega una clase 'selected' si el valor coincide
            className={op === valor ? 'selected' : ''} 
            onClick={() => {
              setValor(op);
              setOpen(false);
            }}
            // Roles ARIA para opciones
            role="option"
            aria-selected={op === valor}
            tabIndex={-1} // Permite el foco programático si se necesita
          >
            {op}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SelectDinamico;


