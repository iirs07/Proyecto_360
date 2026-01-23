import React, { useState, useEffect } from "react";
import "../css/global.css";
import "../css/TareasPendientes.css";
import logo3 from "../imagenes/logo3.png";
import {
    FaSearch,
    FaCalendarAlt,
    FaUser,
    FaBuilding,
    FaEye,
    FaFilter,
    FaListUl,
    FaChevronDown,
    FaChevronRight,
    FaExclamationTriangle,
    FaExclamationCircle,
    FaClock,
    FaTasks
} from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import EmptyState from "../components/EmptyState";
import SelectDinamico from "../components/SelectDinamico";
import { useRolNavigation } from "./utils/navigation";
import { useAuthGuard } from "../hooks/useAuthGuard";

const PRIMARY_COLOR = "#861542";
const PRIMARY_LIGHT_BG = "#fef0f8"; 

const OPCIONES_FILTRO = [
    { value: "all", label: "Todos los estados" },
    { value: "vencida", label: "Vencida" },
    { value: "vence-hoy", label: "Vence hoy" },
    { value: "proxima-vencer", label: "Próxima a vencer (1-3 días)" },
    { value: "pendiente", label: "Pendiente (Más de 3 días)" },
];


const getEstadoVisual = (estado) => {
    switch (estado) {
        case "vencida":
            return {
                icon: <FaExclamationTriangle />,
                color: "#dc2626",        // ROJO fuerte (Red-600)
                bgColor: "#fee2e2"       // Fondo rojo muy claro
            };
        case "vence-hoy":
            return {
                icon: <FaExclamationCircle />,
                color: "#ea580c",        // NARANJA vivo (Orange-600)
                bgColor: "#ffedd5"       // Fondo naranja muy claro
            };
        case "proxima-vencer":
        case "pendiente": 
        default:
            return {
                icon: <FaClock />,
                color: "#f59e0b",        // AMARILLO/Ámbar (Amber-500)
                bgColor: "#fef9c3"       // Fondo amarillo muy claro
            };
    }
};

function TareasPendientes() {
    useAuthGuard();
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("all");
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tareaExpandida, setTareaExpandida] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL;

    const { volverSegunRol } = useRolNavigation();

    useEffect(() => {
        const fetchTareasPendientes = async () => {
            try {
                const usuario = JSON.parse(sessionStorage.getItem("usuario"));
                const token = sessionStorage.getItem("jwt_token");

                if (!usuario?.id_usuario || !token) {
                    setLoading(false);
                    return;
                }

                const res = await fetch(
  `${API_URL}/api/tareasPendientes/departamento?usuario=${usuario.id_usuario}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (res.status === 401) {
                    sessionStorage.removeItem("jwt_token");
                    sessionStorage.removeItem("usuario");
                    window.location.href = "/Login";
                    return;
                }

                const data = await res.json();
                if (data.success) {
                    setProyectos(data.proyectos || []);
                } else {
                    console.error("Error al cargar proyectos y tareas:", data.mensaje);
                }
            } catch (error) {
                console.error("Error al cargar proyectos y tareas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTareasPendientes();
    }, []);

  const calcularDiasRestantes = (fechaFin) => {
    if (!fechaFin) return Infinity;

    const ahora = new Date();
    const fin = new Date(fechaFin);

    ahora.setHours(12, 0, 0, 0);
    fin.setHours(12, 0, 0, 0);

    return Math.ceil((fin - ahora) / (1000 * 60 * 60 * 24)) + 1;

};


    const getEstadoVencimiento = (fechaFin) => {
        const dias = calcularDiasRestantes(fechaFin);
        if (dias < 0) return "vencida";
        if (dias === 0) return "vence-hoy";
        if (dias <= 3) return "proxima-vencer";
        return "pendiente";
    };

    const getTextoDiasRestantes = (dias) => {
        if (dias < 0) return `Vencida hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`;
        if (dias === 0) return "Vence hoy";
        if (dias === 1) return "1 día restante";
        return `${dias} días restantes`;
    };

    const proyectosFiltradosYBuscados = proyectos
        .map(({ proyecto, tareas }) => {
            if (!proyecto || !tareas) return { proyecto: null, tareas: [] };

            const tareasConEstado = tareas.map(t => ({
                ...t,
                estadoVencimiento: getEstadoVencimiento(t.tf_fin || t.fechaVencimiento),
            }));

            const tareasFiltradas = filtroEstado === "all"
                ? tareasConEstado
                : tareasConEstado.filter(t => t.estadoVencimiento === filtroEstado);

            const termino = busqueda.trim().toLowerCase();
            if (!termino) return { proyecto, tareas: tareasFiltradas };

            const proyectoCoincide = proyecto.p_nombre?.toLowerCase().includes(termino);
            const tareasCoinciden = tareasFiltradas.filter(t =>
                proyectoCoincide || t.t_nombre?.toLowerCase().includes(termino)
            );

            return { proyecto, tareas: tareasCoinciden };
        })
        .filter(({ proyecto, tareas }) => proyecto && tareas.length > 0);

    const totalResultados = proyectosFiltradosYBuscados.reduce(
        (acc, cur) => acc + cur.tareas.length,
        0
    );

    const handleSelectChange = (label) => {
        const opcion = OPCIONES_FILTRO.find((o) => o.label === label);
        if (opcion) setFiltroEstado(opcion.value);
    };

    const handleVerTarea = (tareaId) => {
        console.log(`Navegar a la tarea: ${tareaId}`);
    };

    return (
        <Layout titulo="TAREAS PENDIENTES" sidebar={<MenuDinamico activeRoute="enproceso" />}>
            <div className="container my-4">

                {loading && (
                    <div className="loader-container">
                        <div className="loader-logo">
                            <img src={logo3} alt="Cargando" />
                        </div>
                        <div className="loader-texto">CARGANDO TAREAS PENDIENTES...</div>
                        <div className="loader-spinner"></div>
                    </div>
                )}

                {!loading && proyectos.length === 0 && (
                    <EmptyState
                        titulo="TAREAS PENDIENTES"
                        mensaje="No hay tareas pendientes asignadas a tu departamento."
                        botonTexto="Volver al Tablero"
                        onVolver={volverSegunRol}
                        icono={logo3}
                    />
                )}

                {!loading && proyectos.length > 0 && (
                    <>
                     
                        <div className="tp-filtros-container mb-4">
                            <div className="tp-search-filter-wrapper">
                                <div className="tp-search-box">
                                    <FaSearch className="tp-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Buscar tarea o proyecto..."
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                        className="tp-search-input"
                                    />
                                    {busqueda && (
                                        <button
                                            className="tp-search-clear-btn"
                                            onClick={() => setBusqueda("")}
                                            aria-label="Limpiar búsqueda"
                                        >
                                            <FiX />
                                        </button>
                                    )}
                                </div>

                                <div className="tp-filter-box">
                                    <FaFilter className="tp-filter-icon" />
                                    <SelectDinamico
                                        opciones={OPCIONES_FILTRO.map((o) => o.label)}
                                        valor={OPCIONES_FILTRO.find((o) => o.value === filtroEstado)?.label}
                                        setValor={handleSelectChange}
                                    />
                                </div>
                            </div>

                            {(busqueda || filtroEstado !== "all") && (
                                <div className="tp-search-results-info">
                                    <span className="tp-results-count">{totalResultados}</span>{" "}
                                    {totalResultados === 1 ? "tarea" : "tareas"} encontrada(s).
                                </div>
                            )}
                        </div>

                     
                        <div className="tp-tareas-contenedor">
                            {proyectosFiltradosYBuscados.length === 0 ? (
                                <div className="tp-no-resultados">
                                    <div className="tp-no-resultados-icon">
                                        <FaSearch />
                                    </div>
                                    <h3>No se encontraron resultados</h3>
                                    <p>Intenta con otros términos de búsqueda o cambia el filtro de estado</p>
                                </div>
                            ) : (
                                proyectosFiltradosYBuscados.map(({ proyecto, tareas }) => {
                                    const proyectoColor = PRIMARY_COLOR;
                                    const proyectoBg = PRIMARY_LIGHT_BG;

                                    return (
                                        <div key={proyecto.id_proyecto} className="tp-proyecto-card">
                                        
                                            <div className="tp-proyecto-header" >
                                                <div className="tp-proyecto-info">
                                                    <h3 className="tp-proyecto-nombre">{proyecto.p_nombre}</h3>
                                                    <div className="tp-proyecto-meta">
                                                       
                                                       <div className="tp-proyecto-tareas-count-oval" style={{ backgroundColor: 'rgba(134, 21, 66, 0.1)', color: proyectoColor }}>
  <FaListUl style={{ marginRight: '6px' }} />
  {tareas.length} {tareas.length === 1 ? "tarea pendiente" : "tareas pendientes"}
</div>

                                                    </div>
                                                </div>
                                            </div>

                                        
                                            <div className="tp-tareas-lista">
    {tareas.map((tarea) => {
        const estado = tarea.estadoVencimiento;
            const diasRestantes = calcularDiasRestantes(tarea.tf_fin || tarea.fechaVencimiento);
            const estadoVisual = getEstadoVisual(estado);
            const fechaFormateada = tarea.tf_fin || tarea.fechaVencimiento
                ? new Date(tarea.tf_fin || tarea.fechaVencimiento)
                    .toLocaleDateString("es-ES", {
                         day: "2-digit",
                             month: "2-digit",year: "numeric"}): "—";
                 const isExpanded = tareaExpandida === tarea.id_tarea;
                     const textoDias = getTextoDiasRestantes(diasRestantes);
                                                    return (
                          <div
                             key={tarea.id_tarea}
                                 className={`tp-tarea-item ${estado} ${isExpanded ? "active" : ""}`}
                                     style={{ borderLeftColor: estadoVisual.color }}
                                                        >
                                                            <div 
                    className="tp-tarea-header"
                         onClick={() => setTareaExpandida(isExpanded ? null : tarea.id_tarea)}
                                                            >
                        <div className="tp-tarea-estado-container"><div
                         className="tp-tarea-estado-indicador"
                                                                        style={{ color: estadoVisual.color, backgroundColor: estadoVisual.bgColor }}
                                                                    >
                                                                        {estadoVisual.icon}
                                </div>
                                                                </div>
                                                                <div className="tp-tarea-info-contenido">
                                                                    <div className="tp-tarea-titulo-wrapper">
                                                                        <h4 className="tp-tarea-nombre">{tarea.t_nombre}</h4>
                                                                        <span
                                                                            className="tp-tarea-estatus-header"
                                                                            style={{
                                                               backgroundColor: PRIMARY_LIGHT_BG,
                                                                       color: PRIMARY_COLOR,
                                                                            }}
                                                               >
                                                                            {tarea.t_estatus}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="tp-tarea-acciones-header">
                                                                <div className="tp-tarea-info-dias" style={{ borderColor: estadoVisual.color, backgroundColor: estadoVisual.bgColor }}>
                                                               <div className="tp-tarea-dias-restantes">
                                                                            <span className="tp-dias-label">VENCE:</span>
                                                                            <div
                                                                                className="tp-dias-texto"
                                                                                style={{ color: estadoVisual.color }}
                                                                            >
                                                                                {textoDias}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="tp-tarea-expand-icon">
                                                                        {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                                                                    </div>
                                                                </div>
                                                            </div>
                                             {isExpanded && (
                <div className="tp-tarea-detalles-wrapper">
                                                     <div className="tp-tarea-detalles">
              <div className="tp-detalles-grid">
                <div className="tp-detalle-item">
                     <div className="tp-detalle-icono-container-column">
                          <FaUser className="tp-detalle-icono" /></div>
                            <div className="tp-detalle-content">
                             <p className="tp-detalle-label">Asignado a</p>
                               <p className="tp-detalle-value">{tarea.nombre_usuario_asignado || "No asignado"}</p>
                                  </div>
                                  </div>
                                    <div className="tp-detalle-item">
                                          <div className="tp-detalle-icono-container-column">
                                             <FaCalendarAlt className="tp-detalle-icono" />
                                           </div>
                                            <div className="tp-detalle-content">
                                         <p className="tp-detalle-label">Fecha de vencimiento</p>
                                               <div className="tp-fecha-detalle">
                                                     <p className="tp-detalle-value">{tarea.tf_fin}</p>
                                                   </div>
                                                                                </div>
                                                                            </div>
                                                                            {tarea.nombre_departamento_usuario_asignado && (
                                                                                <div className="tp-detalle-item">
                                                                                    <div className="tp-detalle-icono-container-column">
                                                                                        <FaBuilding className="tp-detalle-icono" />
                                                                                    </div>
                                                                                    <div className="tp-detalle-content">
                                                                                        <p className="tp-detalle-label">Departamento</p>
                                                                                        <p className="tp-detalle-value">{tarea.nombre_departamento_usuario_asignado}</p>
                                                                                    </div>
                                                                                </div>
                         )}
                    </div>
             </div>
      </div>
       )}</div>);})}
 </div>
   </div>
 );
   })
  )}
</div>
 </>
)}
            </div>
        </Layout>
    );
}

export default TareasPendientes;






