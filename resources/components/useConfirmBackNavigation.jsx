import React, { useState, useCallback, useEffect } from "react"; 
// 🚨 CAMBIO A LA IMPORTACIÓN ESTABLE
import { useBlocker } from "react-router-dom"; 

export default function useConfirmBackNavigation(camposModificados) {
    const shouldBlock = Object.keys(camposModificados || {}).length > 0;

    // Usamos el nombre estable
    const blocker = useBlocker(shouldBlock); 

    // ... (resto del código del hook)
    const [mostrarModal, setMostrarModal] = useState(false);
    
    useEffect(() => {
        if (blocker?.state === 'blocked') {
            setMostrarModal(true);
        }
    }, [blocker]);
    
    const confirmarNavegacion = useCallback(() => {
        if (blocker) {
            blocker.proceed(); 
            setMostrarModal(false);
        }
    }, [blocker]);

    const cancelarNavegacion = useCallback(() => {
        if (blocker) {
            blocker.reset(); 
            setMostrarModal(false);
        }
    }, [blocker]);

    return { 
        navegacionPendiente: mostrarModal, 
        confirmarNavegacion, 
        cancelarNavegacion 
    };
}
