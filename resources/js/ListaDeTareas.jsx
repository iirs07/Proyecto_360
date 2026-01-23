import React, { useState, useEffect } from "react";
import "../css/global.css";
import "../css/ListaDeTareas.css";
import logo3 from "../imagenes/logo3.png";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import {
    FaSearch,
    FaCalendarAlt,
    FaUser,
    FaBuilding,
    FaFilter,
    FaListUl,
    FaChevronDown,
    FaChevronRight,
    FaExclamationTriangle,
    FaExclamationCircle,
    FaClock,
    FaCheckCircle,
    FaTasks
} from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import EmptyState from "../components/EmptyState";
import SelectDinamico from "../components/SelectDinamico";
import { useLocation } from "react-router-dom";

const PRIMARY_COLOR = "#861542";
const PRIMARY_LIGHT_BG = "#fef0f8";

const OPCIONES_FILTRO = [
    { value: "all", label: "Todos los estados" },
    { value: "finalizado", label: "Finalizado" },
    { value: "en proceso", label: "En proceso" },
    { value: "pendiente", label: "Pendiente" },
];

/**
 * FUNCIÓN PARA CALCULAR DÍAS RESTANTES
 */
const calcularDiasRestantes = (fechaFin) => {
    if (!fechaFin) return Infinity;
    const hoy = new Date();
    const fin = new Date(fechaFin);
    hoy.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);
    return Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24))+1;
};

/**
 * FUNCIÓN DE ESTADO VISUAL PARA LOS 3 ESTADOS
 */
const getEstadoVisual = (estado, fechaFin) => {
    const est = estado?.toLowerCase().trim();
    
    // 1. FINALIZADO (Verde fijo)
    if (est === "finalizado" || est === "completada") {
        return {
            icon: <FaCheckCircle />,
            color: "#059669",        
            bgColor: "#d1fae5",      
            texto: "Finalizado"
        };
    }
    
    // 2. EN PROCESO (Amarillo fijo)
    if (est === "en proceso") {
        return {
            icon: <FaClock />,
            color: "#f59e0b",        
            bgColor: "#fef3c7",     
            texto: "En proceso"
        };
    }
    
    // 3. PENDIENTE (Lógica de vencimiento)
    if (est === "pendiente") {
        const diasRestantes = calcularDiasRestantes(fechaFin);
        
        if (diasRestantes < 0) return { 
            icon: <FaExclamationTriangle />,
            color: "#dc2626",       
            bgColor: "#fee2e2",     
            texto: "Vencida"
        };
        
        if (diasRestantes === 0) return { // VENCE HOY
            icon: <FaExclamationCircle />,
            color: "#ea580c",        // NARANJA
            bgColor: "#ffedd5",      // Fondo naranja claro
            texto: "Vence hoy"
        };
        
        if (diasRestantes <= 3) return { // PRÓXIMA A VENCER
            icon: <FaExclamationCircle />,
            color: "#f59e0b",        // AMARILLO
            bgColor: "#fef9c3",      // Fondo amarillo muy claro
            texto: "Próxima a vencer"
        };
        
        // PENDIENTE NORMAL (Más de 3 días)
        return {
            icon: <FaClock />,
            color: "#94a3b8",        // GRIS
            bgColor: "#f1f5f9",      // Fondo gris claro
            texto: "Pendiente"
        };
    }
    
    // Estado por defecto
    return {
        icon: <FaClock />,
        color: "#6b7280",
        bgColor: "#f3f4f6",
        texto: estado || "Desconocido"
    };
};

function ListaDeTareasProyecto() {
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("all");
    const [tareas, setTareas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tareaExpandida, setTareaExpandida] = useState(null);
    const [nombreProyecto, setNombreProyecto] = useState("");
    const location = useLocation();
 const API_URL = import.meta.env.VITE_API_URL;
   // 1. Modifica cargarTareas para aceptar un parámetro opcional
const cargarTareas = async (sinLoading = false) => {
    let idProyecto = location.state?.id_proyecto || sessionStorage.getItem("id_proyecto");
    if (idProyecto) sessionStorage.setItem("id_proyecto", idProyecto);

    const token = sessionStorage.getItem("jwt_token");
    if (!idProyecto || !token) {
        if (!sinLoading) setLoading(false);
        return;
    }

    if (!sinLoading) setLoading(true); 
    try {
        const res = await fetch(
            `${API_URL}/api/proyectos/${idProyecto}/lista-tareas`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        const data = await res.json();
        if (res.ok && data.tareas) {
            setTareas(data.tareas);
            setNombreProyecto(data.tareas[0]?.proyectoNombre || "Proyecto");
        } else {
            setTareas([]);
        }
    } catch (err) {
        console.error(err);
        setTareas([]);
    } finally {
        if (!sinLoading) setLoading(false);
    }
};

useEffect(() => {
    cargarTareas();
}, [location.state]);

useAutoRefresh(() => cargarTareas(true), 5000);


    const getTextoDiasRestantes = (dias) => {
        if (dias === Infinity || dias === undefined) return "Sin fecha";
        if (dias < 0) return `Vencida hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`;
        if (dias === 0) return "Vence hoy";
        if (dias === 1) return "1 día restante";
        return `${dias} días restantes`;
    };

    const tareasFiltradasYBuscadas = tareas
        .map(tarea => {
            const estado = tarea.t_estatus?.toLowerCase().trim();
            const diasRestantes = calcularDiasRestantes(tarea.tf_fin);
            
            return {
                ...tarea,
                estadoVisual: getEstadoVisual(estado, tarea.tf_fin),
                diasRestantes,
                textoDias: getTextoDiasRestantes(diasRestantes),
                fechaFormateada: tarea.tf_fin 
                    ? new Date(tarea.tf_fin).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                    })
                    : "—"
            };
        })
        .filter(tarea => {

            if (filtroEstado !== "all") {
                const est = tarea.t_estatus?.toLowerCase().trim();
                if (filtroEstado === "pendiente" && est !== "pendiente") return false;
                if (filtroEstado === "en proceso" && est !== "en proceso") return false;
                if (filtroEstado === "finalizado" && !(est === "finalizado" || est === "completada")) return false;
            }
    
            if (busqueda.trim()) {
                const termino = busqueda.toLowerCase();
                return tarea.t_nombre?.toLowerCase().includes(termino);
            }
            
            return true;
        });

    const totalResultados = tareasFiltradasYBuscadas.length;

    const handleSelectChange = (label) => {
        const opcion = OPCIONES_FILTRO.find((o) => o.label === label);
        if (opcion) setFiltroEstado(opcion.value);
    };

    return (
        <Layout 
            titulo="TAREAS DEL PROYECTO" 
            sidebar={<MenuDinamico activeRoute="Vertareas" />}
        >
            <div className="container my-4">
                {loading && (
                    <div className="loader-container">
                        <div className="loader-logo">
                            <img src={logo3} alt="Cargando" />
                        </div>
                        <div className="loader-texto">CARGANDO TAREAS...</div>
                        <div className="loader-spinner"></div>
                    </div>
                )}

                {!loading && tareas.length === 0 && (
                    <EmptyState
                        titulo="TAREAS DEL PROYECTO"
                        mensaje="No hay tareas registradas en este proyecto."
                        botonTexto="Volver al Tablero"
                        onVolver={() => window.history.back()}
                        icono={logo3}
                    />
                )}

                {!loading && tareas.length > 0 && (
                    <>
                     <div className="ltp-filtros-container mb-4">
                        <div className="ltp-search-filter-wrapper">
                        <div className="ltp-search-box">
                            <FaSearch className="ltp-search-icon" />                                    <input
                            type="text"
                            placeholder="Buscar tarea por nombre..."
                            value={busqueda}
                             onChange={(e) => setBusqueda(e.target.value)}                              className="ltp-search-input"
                                    />
                                    {busqueda && (
                            <button
              className="ltp-search-clear-btn"
               onClick={() => setBusqueda("")}
             aria-label="Limpiar búsqueda"
                                        >    <FiX />
                    </button>
                                    )}
 </div>
<div className="ltp-filter-box">
 <FaFilter className="ltp-filter-icon" />
<SelectDinamico opciones={OPCIONES_FILTRO.map((o) => o.label)}                                
valor={OPCIONES_FILTRO.find((o) => o.value === filtroEstado)?.label}
setValor={handleSelectChange}
                        />
                        </div>
                    </div>

                            {(busqueda || filtroEstado !== "all") && (
                     <div className="ltp-search-results-info">                                    <span className="ltp-results-count">{totalResultados}</span>{" "}
{totalResultados === 1 ? "tarea" : "tareas"} encontrada(s).
                        </div>
                      )}
                </div>

                        <div className="ltp-tareas-contenedor">
                            <div className="ltp-proyecto-card">
                  <div className="ltp-proyecto-header" 
                  style={{ backgroundColor: PRIMARY_LIGHT_BG }}>
           <div className="ltp-proyecto-info">
             <h3 className="ltp-proyecto-nombre" style={{ color: PRIMARY_COLOR }}>                                            {nombreProyecto}
                                        </h3>
                            <div className="ltp-proyecto-meta">
                         <div className="ltp-proyecto-meta-icon" style={{ color: PRIMARY_COLOR }}>
                                    <FaTasks />
                                        </div>
                                    <span className="ltp-proyecto-tareas-count" style={{ 
                                    color: PRIMARY_COLOR, 
                                backgroundColor: 'rgba(134, 21, 66, 0.1)'                                     }}>
           {tareasFiltradasYBuscadas.length} {tareasFiltradasYBuscadas.length === 1 ? "tarea registrada" : "tareas registradas"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="ltp-tareas-lista">
                      {tareasFiltradasYBuscadas.length === 0 ? (
                           <div className="ltp-no-resultados">
                                        <div className="ltp-no-resultados-icon">
                                                <FaSearch />                                            </div>
                                            <h3>No se encontraron resultados</h3>
                     <p>Intenta con otros términos de búsqueda o cambia el filtro de estado</p>
                                        </div>
                                    ) : (
                                        tareasFiltradasYBuscadas.map((tarea) => {
                                            const isExpanded = tareaExpandida === tarea.id_tarea;
                                            const estadoVisual = tarea.estadoVisual;

                                            return (
                                                <div
                      key={tarea.id_tarea}
                    className={`ltp-tarea-item ${isExpanded ? "active" : ""}`}
             style={{ borderLeftColor: estadoVisual.color }}
                                                >
                                                    <div 
                className="ltp-tarea-header"
                        onClick={() => setTareaExpandida(isExpanded ? null : tarea.id_tarea)}
                                                    >
                                        
                                    <div className="ltp-tarea-estado-container">
                                                            <div
                    className="ltp-tarea-estado-indicador"
                                        style={{ 
                    color: estadoVisual.color, 
                    backgroundColor: estadoVisual.bgColor 
                                                                }}
                                                            >
                    {estadoVisual.icon}
                                                            </div>
                                 </div> <div className="ltp-tarea-info-contenido">
                              <div className="ltp-tarea-titulo-wrapper">
                         <h4 className="ltp-tarea-nombre">{tarea.t_nombre}</h4>
                         <span
                             className="ltp-tarea-estatus-header"
                            style={{
                          backgroundColor: estadoVisual.bgColor,
                                     color: estadoVisual.color,
                                                                    }}
                                                                >
                                                                    {estadoVisual.texto}
                                                                </span>
                                                            </div>
                                                        </div>
                           <div className="ltp-tarea-acciones-header">
                               <div className="ltp-tarea-info-dias" style={{ 
                                 borderColor: estadoVisual.color, 
                              backgroundColor: estadoVisual.bgColor 
                                                            }}>
                                    <div className="ltp-tarea-dias-restantes">
                                     <span className="ltp-dias-label">
            {tarea.t_estatus?.toLowerCase().trim() === "pendiente" ? "VENCE:" : "ESTADO:"}
                 </span> <div
                                     className="ltp-dias-texto"
                            style={{ color: estadoVisual.color }}
                                                                    >
                         {tarea.t_estatus?.toLowerCase().trim() === "pendiente" 
                                ? tarea.textoDias 
                             : estadoVisual.texto}
                        </div>
                            </div>
                                </div>
               <div className="ltp-tarea-expand-icon">
                   {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isExpanded && (
                  <div className="ltp-tarea-detalles-wrapper">
                    <div className="ltp-tarea-detalles">
                         <div className="ltp-detalles-grid">
                         <div className="ltp-detalle-item">
                        <div className="ltp-detalle-icono-container-column">
                             <FaUser className="ltp-detalle-icono" />
                          </div>
                            <div className="ltp-detalle-content">
                             <p className="ltp-detalle-label">Asignado a</p>
                                  <p className="ltp-detalle-value">
                        {tarea.nombre_usuario_asignado || "No asignado"}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                           <div className="ltp-detalle-item">
                                  <div className="ltp-detalle-icono-container-column">
                                           <FaCalendarAlt className="ltp-detalle-icono" />
                                                 </div>
                                               <div className="ltp-detalle-content">
                                             <p className="ltp-detalle-label">
                                         {tarea.t_estatus?.toLowerCase().trim() === "pendiente" 
                                              ? "Fecha de vencimiento" 
                                                 : "Fecha de finalización"}
                                                                            </p>
                 <div className="ltp-fecha-detalle">
    <p className="ltp-detalle-value">
        {tarea.tf_fin || "—"}
    </p>
</div> </div>
                           </div>
                   {tarea.nombre_departamento_usuario_asignado && (
                                  <div className="ltp-detalle-item">
                                 <div className="ltp-detalle-icono-container-column">
                                          <FaBuilding className="ltp-detalle-icono" />
                                         </div>
                                       <div className="ltp-detalle-content">
                                             <p className="ltp-detalle-label">Departamento</p>
                                             <p className="ltp-detalle-value">
                                            {tarea.nombre_departamento_usuario_asignado}
                                        </p>
                                    </div>
                                      </div>
                               )}
                         </div>
                     </div>
            </div>
                 )}
            </div>
              );
           })
           )}
          </div>
            </div>
         </div>
    </>
    )}
            </div>
        </Layout>
    );
}

export default ListaDeTareasProyecto;










