import React, { useState, useEffect } from "react";
import "../css/ProgresoProyecto.css";

// Iconos SVG - SIN COLORES DEFINIDOS (los colores vendrán del CSS)
const IconoCompletado = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </svg>
);

const IconoPendiente = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const IconoTotal = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="9" x2="15" y2="9" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="15" x2="13" y2="15" />
  </svg>
);

const IconoSinDatos = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
);

// Hook personalizado para la animación del progreso
const useProgresoAnimado = (progresoInicial, duracion = 800) => {
  const [progreso, setProgreso] = useState(0);
  
  useEffect(() => {
    const p = Number(progresoInicial) || 0;
    let startTime = null;
    let animationFrame = null;

    const animar = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const tiempoTranscurrido = timestamp - startTime;
      const progresoAnimado = Math.min((tiempoTranscurrido / duracion) * p, p);
      
      setProgreso(progresoAnimado);
      
      if (tiempoTranscurrido < duracion) {
        animationFrame = requestAnimationFrame(animar);
      }
    };

    animationFrame = requestAnimationFrame(animar);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [progresoInicial, duracion]);

  return Math.round(progreso);
};

export default function ProgresoProyecto({ 
  progresoInicial, 
  tareasTotales, 
  tareasCompletadas,
  tipo = "barra",
  tamaño = "medio",
  className = "",
  onEstadoCambio,
  mostrarEstadisticas = true
}) {
  const progreso = useProgresoAnimado(progresoInicial);
  const p = Number(progresoInicial) || 0;

  // Efecto para callback cuando cambia el estado
  useEffect(() => {
    if (onEstadoCambio) {
      onEstadoCambio(getEstadoProgreso(p), p);
    }
  }, [p, onEstadoCambio]);

  // Función para determinar el color basado en el porcentaje
  const getColorProgreso = (porcentajeEspecifico = null) => {
    const porcentaje = porcentajeEspecifico !== null ? porcentajeEspecifico : p;
    if (porcentaje === 0) return "#ff4444"; // Rojo para 0%
    if (porcentaje < 30) return "#ff6b6b"; // Naranja rojizo
    if (porcentaje < 70) return "#ffc107"; // NARANJA/AMARILLO para en progreso
    if (porcentaje < 100) return "#32cd32"; // Verde claro
    return "#28a428"; // Verde oscuro para 100%
  };

  // Función para determinar el estado basado en el porcentaje
  const getEstadoProgreso = (porcentaje) => {
    if (porcentaje === 0) return "prog-proy-sin-progreso";
    if (porcentaje < 30) return "prog-proy-inicio";
    if (porcentaje < 70) return "prog-proy-progreso";
    if (porcentaje < 100) return "prog-proy-casi-listo";
    return "prog-proy-completado";
  };

  // Función para obtener el texto del estado
  const getTextoEstado = (porcentaje) => {
    if (porcentaje === 0) return "Sin empezar";
    if (porcentaje < 30) return "En inicio";
    if (porcentaje < 70) return "En progreso";
    if (porcentaje < 100) return "Casi listo";
    return "Completado";
  };

  const getGradientProgreso = () => {
    if (p === 0) return "linear-gradient(135deg, #ff4444 0%, #ff6b6b 30%, #ff4444 70%, #ff3333 100%)";
    if (p < 30) return "linear-gradient(135deg, #ff4444 0%, #ff6b6b 30%, #ff4444 70%, #ff3333 100%)";
    if (p < 70) return "linear-gradient(135deg, #ffc107 0%, #ffd54f 30%, #ffc107 70%, #ffb300 100%)"; // NARANJA/AMARILLO
    if (p < 100) return "linear-gradient(135deg, #32cd32 0%, #6bff6b 30%, #32cd32 70%, #28a428 100%)";
    return "linear-gradient(135deg, #32cd32 0%, #6bff6b 30%, #32cd32 70%, #28a428 100%)";
  };

  // Configuraciones de tamaño - CÍRCULO MÁS PEQUEÑO Y GRUESO
  const getTamañoConfig = () => {
    const configs = {
      pequeño: { 
        circular: 120, // REDUCIDO de 160 a 120
        circularStrokeWidth: 20, // AUMENTADO - más grueso
        barra: "24px", 
        padding: "8px",
        icono: "18px", 
        valor: "0.9rem", 
        etiqueta: "0.65rem", 
        gap: "6px", 
        tarjetaPadding: "8px 0",
        badgeFontSize: "0.65rem",
        badgePadding: "4px 8px",
        tarjetaHeight: "auto",
        iconoMargin: "6px",
        barraWidth: "100%",
        barraContainerPadding: "0",
        fontSizePorcentaje: "1.8rem", // Reducido para círculo más pequeño
        puntoIndicador: 6
      },
      medio: { 
        circular: 150, // REDUCIDO de 200 a 150
        circularStrokeWidth: 24, // AUMENTADO - más grueso
        barra: "32px", 
        padding: "0",
        icono: "20px", 
        valor: "0.95rem", 
        etiqueta: "0.7rem", 
        gap: "8px", 
        tarjetaPadding: "6px 0",
        badgeFontSize: "0.7rem",
        badgePadding: "4px 10px",
        tarjetaHeight: "auto",
        iconoMargin: "8px",
        barraWidth: "100%",
        barraContainerPadding: "0",
        fontSizePorcentaje: "2.0rem", // Reducido para círculo más pequeño
        puntoIndicador: 7
      },
      grande: { 
        circular: 180, // REDUCIDO de 240 a 180
        circularStrokeWidth: 28, // AUMENTADO - más grueso
        barra: "40px", 
        padding: "0",
        icono: "22px", 
        valor: "1.1rem", 
        etiqueta: "0.75rem", 
        gap: "10px", 
        tarjetaPadding: "8px 0",
        badgeFontSize: "0.75rem",
        badgePadding: "6px 12px",
        tarjetaHeight: "auto",
        iconoMargin: "10px",
        barraWidth: "100%",
        barraContainerPadding: "0",
        fontSizePorcentaje: "2.2rem", // Reducido para círculo más pequeño
        puntoIndicador: 8
      }
    };
    return configs[tamaño] || configs.medio;
  };

  // Componente de Gráfica Circular - MÁS PEQUEÑO Y GRUESO
  const GraficaCircular = () => {
    const config = getTamañoConfig();
    // Cálculo del radio para círculo más grueso
    const radio = (config.circular / 2) - (config.circularStrokeWidth / 2);
    const circunferencia = 2 * Math.PI * radio;
    const offset = circunferencia - (progreso / 100) * circunferencia;

    return (
      <div className="prog-proy-contenedor-circular-mejorado">
        <div 
          className="prog-proy-marco-circular"
          style={{
            width: config.circular,
            height: config.circular
          }}
        >
          {/* ELEMENTOS DE DESTELLO PARA EL CÍRCULO */}
          <div className="prog-proy-destello-circular"></div>
          <div className="prog-proy-destello-trazo"></div>
          
          <svg 
            width={config.circular} 
            height={config.circular} 
            className="prog-proy-grafica-circular-mejorada"
          >
            <defs>
              <linearGradient id="prog-proy-progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={getColorProgreso()} />
                <stop offset="100%" stopColor={getColorProgreso()} stopOpacity="0.9" />
              </linearGradient>
              <filter id="prog-proy-shadow">
                <feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.25"/>
              </filter>
            </defs>
            
            {/* Fondo del círculo - MÁS GRUESO */}
            <circle
              cx={config.circular / 2}
              cy={config.circular / 2}
              r={radio}
              stroke="#f0f0f0"
              strokeWidth={config.circularStrokeWidth}
              fill="none"
              className="prog-proy-circulo-fondo"
            />
            
            {/* Círculo de progreso - MÁS GRUESO */}
            <circle
              cx={config.circular / 2}
              cy={config.circular / 2}
              r={radio}
              stroke="url(#prog-proy-progressGradient)"
              strokeWidth={config.circularStrokeWidth}
              fill="none"
              strokeDasharray={circunferencia}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${config.circular / 2} ${config.circular / 2})`}
              className="prog-proy-circulo-progreso-mejorado"
              filter="url(#prog-proy-shadow)"
            />
            
            {/* Punto indicador proporcional al grosor - SIEMPRE VISIBLE EN 100% */}
            {(progreso > 0 || progreso === 100) && (
              <circle
                cx={config.circular / 2 + radio * Math.cos(((progreso > 0 ? progreso : 0.01) * 3.6 - 90) * (Math.PI / 180))}
                cy={config.circular / 2 + radio * Math.sin(((progreso > 0 ? progreso : 0.01) * 3.6 - 90) * (Math.PI / 180))}
                r={config.puntoIndicador}
                fill={getColorProgreso()}
                className="prog-proy-punto-indicador"
                stroke="#ffffff"
                strokeWidth="2"
              />
            )}
          </svg>
          
          {/* Texto central */}
          <div className="prog-proy-texto-circular-mejorado">
            <span 
              className="prog-proy-porcentaje-circular-mejorado"
              data-prog-proy-progreso={getEstadoProgreso(p)}
              style={{ 
                fontSize: config.fontSizePorcentaje,
                fontWeight: 700
              }}
            >
              {progreso}%
            </span>
            <div className="prog-proy-estado-contenedor">
              <span 
                className={`prog-proy-badge-estado ${getEstadoProgreso(p)}`}
                style={{
                  fontSize: config.badgeFontSize,
                  padding: config.badgePadding
                }}
              >
                {getTextoEstado(p)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Barra de Progreso - SIN CAMBIOS
  const BarraProgreso = () => {
    const config = getTamañoConfig();
    const puntos = [0, 25, 50, 75, 100];

    return (
      <div 
        className="prog-proy-contenedor-barra-moderna"
        style={{
          width: config.barraWidth,
          padding: config.barraContainerPadding
        }}
      >
        <div className="prog-proy-barra-contenedor-moderno">
          <div 
            className="prog-proy-barra-fondo-moderna" 
            role="progressbar" 
            aria-valuemin={0} 
            aria-valuemax={100} 
            aria-valuenow={p}
            aria-label={`Progreso del proyecto: ${p}%`}
          >
            <div
              className="prog-proy-barra-progreso-moderna"
              style={{
                width: `${progreso}%`,
                background: getGradientProgreso(),
                height: config.barra
              }}
              data-prog-proy-progreso={getEstadoProgreso(p)}
            >
              <div className="prog-proy-luz-corrediza"></div>
              <div className="prog-proy-luz-secundaria"></div>
              
              <div className="prog-proy-punto-progreso-moderno"></div>
              <div 
                className="prog-proy-indicador-porcentaje"
                style={{ display: progreso > 0 ? 'block' : 'none' }}
              >
                {progreso}%
              </div>
            </div>
          </div>
          
          <div className="prog-proy-marcadores-progreso">
            {puntos.map((punto) => (
              <div 
                key={punto} 
                className="prog-proy-marcador"
                data-prog-proy-progreso={getEstadoProgreso(punto)}
              >
                <div 
                  className="prog-proy-punto-marcador"
                  style={{
                    backgroundColor: punto <= p ? getColorProgreso(punto) : '#e9ecef',
                    borderColor: punto <= p ? getColorProgreso(punto) : '#dee2e6'
                  }}
                  title={`${punto}% - ${getTextoEstado(punto)}`}
                ></div>
                <span className="prog-proy-porcentaje-marcador">{punto}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Componente de Tarjeta de Estadística - SIN FONDOS CREMA
  const TarjetaEstadistica = ({ tipoTarjeta, valor, etiqueta, Icono }) => {
    const config = getTamañoConfig();
    
    return (
      <div 
        className={`prog-proy-tarjeta-estadistica`}
        style={{
          padding: config.tarjetaPadding,
          height: config.tarjetaHeight,
        }}
      >
        <div 
          className="prog-proy-icono-estadistica"
          style={{ 
            width: config.icono, 
            height: config.icono,
            marginRight: config.iconoMargin
          }}
        >
          <Icono />
        </div>
        <div className="prog-proy-contenido-estadistica">
          <span 
            className="prog-proy-valor"
            style={{ fontSize: config.valor }}
          >
            {valor}
          </span>
          <span 
            className="prog-proy-etiqueta"
            style={{ fontSize: config.etiqueta }}
          >
            {etiqueta}
          </span>
        </div>
      </div>
    );
  };

  // Estado sin datos
  if (tareasTotales <= 0) {
    const config = getTamañoConfig();
    return (
      <div 
        className={`prog-proy-contenedor-progreso-moderno prog-proy-sin-datos ${className}`}
        style={{ padding: config.padding }}
      >
        <div className="prog-proy-icono-sin-datos">
          <IconoSinDatos />
        </div>
        <p>No hay tareas</p>
        <small>Agrega tareas para comenzar a trackear el progreso</small>
      </div>
    );
  }

  const config = getTamañoConfig();
  const estadoActual = getEstadoProgreso(p);
  const tareasPendientes = tareasTotales - tareasCompletadas;

  return (
    <div 
      className={`prog-proy-contenedor-progreso-moderno ${tipo} ${tamaño} ${className}`}
      data-prog-proy-progreso={estadoActual}
      style={{ 
        padding: config.padding,
        maxWidth: tipo === "barra" ? "800px" : "700px"
      }}
      role="region"
      aria-label="Progreso del proyecto"
    >
      {tipo === "circular" ? <GraficaCircular /> : <BarraProgreso />}
      
      {mostrarEstadisticas && (
        <div className="prog-proy-estadisticas-modernas">
          <div 
            className="prog-proy-grid-estadisticas"
            style={{ gap: config.gap }}
          >
            <TarjetaEstadistica
              tipoTarjeta="completada"
              valor={tareasCompletadas}
              etiqueta="Completadas"
              Icono={IconoCompletado}
            />
            
            <TarjetaEstadistica
              tipoTarjeta="pendiente"
              valor={tareasPendientes}
              etiqueta="Pendientes"
              Icono={IconoPendiente}
            />
            
            <TarjetaEstadistica
              tipoTarjeta="total"
              valor={tareasTotales}
              etiqueta="Total"
              Icono={IconoTotal}
            />
          </div>
        </div>
      )}
    </div>
  );
}