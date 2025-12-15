export const STATUS_COLORS = {
    'EN PROCESO': '#ffc107', // Amarillo (Fuerte)
'FINALIZADO': '#28a745', // Verde (Fuerte)
 'DEFAULT': '#6c757d', 
};

export const STATUS_BG_COLORS = {
    'EN PROCESO': '#fff3cd', // Amarillo muy pálido
    'FINALIZADO': '#d4edda', // Verde muy pálido
    'DEFAULT': '#e9ecef',    // Gris muy pálido
};

// Función para obtener la clase CSS del borde (mantener igual)
export const getBorderClase = (estatus) => {

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

export const getPStatusTagStyle = (estatus) => {
    const estatusKey = estatus?.toUpperCase() || 'DEFAULT';
    const color = STATUS_COLORS[estatusKey]; 
    const bgColor = STATUS_BG_COLORS[estatusKey];

    return {
backgroundColor: bgColor, 
 color: color, 
        border: `2px solid ${color}`, 
padding: '2px 8px',
borderRadius: '5px',
fontSize: '0.85rem',
fontWeight: 'bold',
    };
};