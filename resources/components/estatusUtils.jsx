// Contenido de: estatusUtils.jsx (VERSIÓN MEJORADA)

// Colores FUERTES (Texto, Borde, Íconos de Alerta)
export const STATUS_COLORS = {
    'EN PROCESO': '#ffc107', // Amarillo (Fuerte)
    'FINALIZADO': '#28a745', // Verde (Fuerte)
    'DEFAULT': '#6c757d',    // Gris
};

// Nuevos colores PASTEL (Fondo de las etiquetas de estatus)
export const STATUS_BG_COLORS = {
    'EN PROCESO': '#fff3cd', // Amarillo muy pálido
    'FINALIZADO': '#d4edda', // Verde muy pálido
    'DEFAULT': '#e9ecef',    // Gris muy pálido
};

// Función para obtener la clase CSS del borde (mantener igual)
export const getBorderClase = (estatus) => {
    // ... (mantener el código actual)
    const estatusNormalizado = estatus ? estatus.toLowerCase() : 'default';

    switch (estatusNormalizado) {
        case "en proceso":
            return "borde-en-proceso";
        case "finalizado":
            return "borde-finalizado";
        default:
            return "borde-default";
    }
};

// Función para obtener el estilo en línea de la etiqueta (Cambiado para usar fondos pastel)
export const getPStatusTagStyle = (estatus) => {
    const estatusKey = estatus?.toUpperCase() || 'DEFAULT';
    // Color del texto (Fuerte)
    const color = STATUS_COLORS[estatusKey]; 
    // Color del fondo (Pastel)
    const bgColor = STATUS_BG_COLORS[estatusKey];

    return {
        backgroundColor: bgColor, // Usa el color pastel para el fondo
        color: color, // El texto usa el color fuerte (mejora contraste y conexión)
        border: `1px solid ${color}`, // Borde sutil
        padding: '2px 8px',
        borderRadius: '5px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
    };
};