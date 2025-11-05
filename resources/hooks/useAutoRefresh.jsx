// src/hooks/useAutoRefresh.js
import { useEffect } from "react";

/**
 * Hook que ejecuta una función periódicamente (por defecto cada 5 segundos).
 * @param {Function} callback - Función que se ejecutará cada intervalo.
 * @param {number} delay - Tiempo en milisegundos (por defecto 5000 ms = 5 segundos).
 */
export function useAutoRefresh(callback, delay = 5000) {
  useEffect(() => {
    const intervalId = setInterval(() => {
      callback();
    }, delay);

    // Limpieza: cuando el componente se desmonta
    return () => clearInterval(intervalId);
  }, [callback, delay]);
}
