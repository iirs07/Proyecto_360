import React, { useState, useEffect } from "react";
import "../css/global.css";
import "../css/TareasCJ.css";
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
    FaCheckCircle
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

// Opciones de orden alfabético
const OPCIONES_FILTRO = [
    { value: "az", label: "A-Z" },
    { value: "za", label: "Z-A" },
];

// Color para estado "Finalizado"
const ESTADO_FINALIZADO = {
    icon: <FaCheckCircle />,
    color: "#27ae60",       
    bgColor: "#c4ffddff",     
    texto: "Finalizado"
};

function TareasFinalizadas() {
    useAuthGuard();
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("az");
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tareaExpandida, setTareaExpandida] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL;

    const { volverSegunRol } = useRolNavigation();

    useEffect(() => {
        const fetchTareasFinalizadas = async () => {
            try {
                const usuario = JSON.parse(sessionStorage.getItem("usuario"));
                const token = sessionStorage.getItem("jwt_token");

                if (!usuario?.id_usuario || !token) {
                    setLoading(false);
                    return;
                }

                const res = await fetch(
  `${API_URL}/api/tareasFinalizadas/departamento?usuario=${usuario.id_usuario}`,
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
                    console.error("Error al cargar proyectos y tareas finalizadas:", data.mensaje);
                }
            } catch (error) {
                console.error("Error al cargar proyectos y tareas finalizadas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTareasFinalizadas();
    }, []);

    const getFechaCompletada = (fechaFin) => {
        if (!fechaFin) return "—";
        return new Date(fechaFin)
            .toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });
    };

    const proyectosFiltradosYBuscados = proyectos
        .map(({ proyecto, tareas }) => {
            if (!proyecto || !tareas) return { proyecto: null, tareas: [] };

            const termino = busqueda.trim().toLowerCase();
            if (!termino) return { proyecto, tareas };

            const proyectoCoincide = proyecto.p_nombre?.toLowerCase().includes(termino);
            const tareasCoinciden = tareas.filter(t =>
                proyectoCoincide || t.t_nombre?.toLowerCase().includes(termino)
            );

            return { proyecto, tareas: tareasCoinciden };
        })
        .filter(({ proyecto, tareas }) => proyecto && tareas.length > 0)
        .map(({ proyecto, tareas }) => {
            // Ordenar tareas alfabéticamente
            const tareasOrdenadas = [...tareas].sort((a, b) => {
                if (filtroEstado === "az") return a.t_nombre.localeCompare(b.t_nombre);
                if (filtroEstado === "za") return b.t_nombre.localeCompare(a.t_nombre);
                return 0;
            });
            return { proyecto, tareas: tareasOrdenadas };
        })
        // Ordenar proyectos alfabéticamente también
        .sort((a, b) => {
            if (!a.proyecto || !b.proyecto) return 0;
            if (filtroEstado === "az") return a.proyecto.p_nombre.localeCompare(b.proyecto.p_nombre);
            if (filtroEstado === "za") return b.proyecto.p_nombre.localeCompare(a.proyecto.p_nombre);
            return 0;
        });

    const totalResultados = proyectosFiltradosYBuscados.reduce(
        (acc, cur) => acc + cur.tareas.length,
        0
    );

    const handleSelectChange = (label) => {
        const opcion = OPCIONES_FILTRO.find((o) => o.label === label);
        if (opcion) setFiltroEstado(opcion.value);
    };

    const handleVerTarea = (tareaId) => {
        console.log(`Ver detalles de tarea finalizada: ${tareaId}`);
    };

    return (
        <Layout titulo="TAREAS FINALIZADAS" sidebar={<MenuDinamico activeRoute="enproceso" />}>
            <div className="container my-4">

                {loading && (
                    <div className="loader-container">
                        <div className="loader-logo">
                            <img src={logo3} alt="Cargando" />
                        </div>
                        <div className="loader-texto">CARGANDO TAREAS FINALIZADAS...</div>
                        <div className="loader-spinner"></div>
                    </div>
                )}

                {!loading && proyectos.length === 0 && (
                    <EmptyState
                        titulo="TAREAS FINALIZADAS"
                        mensaje="No hay tareas finalizadas en tu departamento."
                        botonTexto="Volver al Tablero"
                        onVolver={volverSegunRol}
                        icono={logo3}
                    />
                )}

                {!loading && proyectos.length > 0 && (
                    <>
                 
                        <div className="tf-filtros-container mb-4">
                            <div className="tf-search-filter-wrapper">
                                <div className="tf-search-box">
                                    <FaSearch className="tf-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Buscar tarea o proyecto..."
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                        className="tf-search-input"
                                    />
                                    {busqueda && (
                                        <button
                                            className="tf-search-clear-btn"
                                            onClick={() => setBusqueda("")}
                                            aria-label="Limpiar búsqueda"
                                        >
                                            <FiX />
                                        </button>
                                    )}
                                </div>

                                <div className="tf-filter-box">
                                    <FaFilter className="tf-filter-icon" />
                                    <SelectDinamico
                                        opciones={OPCIONES_FILTRO.map((o) => o.label)}
                                        valor={OPCIONES_FILTRO.find((o) => o.value === filtroEstado)?.label}
                                        setValor={handleSelectChange}
                                    />
                                </div>
                            </div>

                            {busqueda && (
                                <div className="tf-search-results-info">
                                    <span className="tf-results-count">{totalResultados}</span>{" "}
                                    {totalResultados === 1 ? "tarea" : "tareas"} encontrada(s).
                                </div>
                            )}
                        </div>

                        <div className="tf-tareas-contenedor">
                            {proyectosFiltradosYBuscados.length === 0 ? (
                                
                                    null
                            ) : (
                                proyectosFiltradosYBuscados.map(({ proyecto, tareas }) => {
                                    const proyectoColor = PRIMARY_COLOR;
                                    const proyectoBg = PRIMARY_LIGHT_BG;

                                    return (
                                        <div key={proyecto.id_proyecto} className="tf-proyecto-card">
                                            {/* HEADER DEL PROYECTO */}
                                          <div className="tf-proyecto-header">
    <div className="tf-proyecto-info">
        <h3 className="tf-proyecto-nombre">{proyecto.p_nombre}</h3>

        <div className="tf-proyecto-meta">
            <span className="tf-proyecto-tareas-count">
                <FaListUl className="tf-proyecto-tareas-icon" />
               {proyecto.tareas_finalizadas} finalizadas / {proyecto.total_tareas} tareas
            </span>
        </div>
    </div>
</div>


                                            {/* LISTA DE TAREAS */}
                                            <div className="tf-tareas-lista">
                                                {tareas.map((tarea) => {
                                                    const fechaCompletada = getFechaCompletada(tarea.tf_fin || tarea.fechaFinalizacion);
                                                    const isExpanded = tareaExpandida === tarea.id_tarea;

                                                    return (
                                                        <div
                                                            key={tarea.id_tarea}
                                                            className={`tf-tarea-item ${isExpanded ? "active" : ""}`}
                                                            style={{ borderLeftColor: ESTADO_FINALIZADO.color }}
                                                        >
                                                            {/* HEADER DE TAREA */}
                                                            <div 
                                                                className="tf-tarea-header"
                                                                onClick={() => setTareaExpandida(isExpanded ? null : tarea.id_tarea)}
                                                            >
                                                                {/* ÍCONO DE ESTADO FINALIZADO */}
                                                                <div className="tf-tarea-estado-container">
                                                                    <div
                                                                        className="tf-tarea-estado-indicador"
                                                                        style={{ color: ESTADO_FINALIZADO.color, backgroundColor: ESTADO_FINALIZADO.bgColor }}
                                                                    >
                                                                        {ESTADO_FINALIZADO.icon}
                                                                    </div>
                                                                </div>

                                                                {/* TÍTULO Y ESTATUS */}
                                                                <div className="tf-tarea-info-contenido">
                                                                    <div className="tf-tarea-titulo-wrapper">
                                                                        <h4 className="tf-tarea-nombre">{tarea.t_nombre}</h4>
                                                                        <span
                                                                            className="tf-tarea-estatus-header"
                                                                            style={{
                                                                                backgroundColor: ESTADO_FINALIZADO.bgColor,
                                                                                color: ESTADO_FINALIZADO.color,
                                                                            }}
                                                                        >
                                                                            {ESTADO_FINALIZADO.texto}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                
                                                                <div className="tf-tarea-acciones-header">
                                                                    <div className="tf-tarea-info-fecha" style={{ borderColor: ESTADO_FINALIZADO.color, backgroundColor: ESTADO_FINALIZADO.bgColor }}>
                                                                        <div className="tf-tarea-fecha-completada">
                                                                            <span className="tf-fecha-label">FECHA LIMITE:</span>
                                                                            <div
                                                                                className="tf-fecha-texto"
                                                                                style={{ color: ESTADO_FINALIZADO.color }}
                                                                            >
                                                                               {tarea.tf_fin || "—"}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="tf-tarea-expand-icon">
                                                                        {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* DETALLES EXPANDIBLES */}
                                                            {isExpanded && (
                                                                <div className="tf-tarea-detalles-wrapper">
                                                                    <div className="tf-tarea-detalles">
                                                                        <div className="tf-detalles-grid">
                                                                            {/* Asignado a */}
                                                                            <div className="tf-detalle-item">
                                                                                <div className="tf-detalle-icono-container-column">
                                                                                    <FaUser className="tf-detalle-icono" />
                                                                                </div>
                                                                                <div className="tf-detalle-content">
                                                                                    <p className="tf-detalle-label">Completada por</p>
                                                                                    <p className="tf-detalle-value">{tarea.nombre_usuario_asignado || "No asignado"}</p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Fecha de finalización */}
                                                                            <div className="tf-detalle-item">
                                                                                <div className="tf-detalle-icono-container-column">
                                                                                    <FaCalendarAlt className="tf-detalle-icono" />
                                                                                </div>
                                                                                <div className="tf-detalle-content">
                                                                                    <p className="tf-detalle-label">el</p>
                                                                                    <div className="tf-fecha-detalle">
                                                                                        <p className="tf-detalle-value">{tarea.tf_completada || "—"}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                            
                                                                            {tarea.nombre_departamento_usuario_asignado && (
                                                                       <div className="tf-detalle-item">
                                                                       <div className="tf-detalle-icono-container-column">
                                                                               <FaBuilding className="tf-detalle-icono" />
                                                                                    </div>
                                                                         <div className="tf-detalle-content">
                                                                             <p className="tf-detalle-label">Departamento</p>
                                                                                        <p className="tf-detalle-value">{tarea.nombre_departamento_usuario_asignado}</p>
                                                                                    </div>
                                                                       </div>
                                                                            )}
                                                              </div>
                                                                </div>
                                                            </div>
                                                            )}
                                                    </div>
                                                    );
                                                })}
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

export default TareasFinalizadas;





