import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
// CAMBIO 1: Importamos FaBars para la hamburguesa
import { FaBars } from "react-icons/fa"; 
import "../css/TareasProgreso.css";
import "../css/global.css";
import logo3 from "../imagenes/logo3.png";
import folderIcon from "../imagenes/folder.png";
import MenuDinamico from "../components/MenuDinamico";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

export default function TareasProgreso() {
    const { proyectoSlug } = useParams(); 
    const navigate = useNavigate();
    const location = useLocation();

    // -------------------- ESTADO BASE --------------------
    const [idProyecto, setIdProyecto] = useState(location.state?.idProyecto || localStorage.getItem("last_idProyecto"));
    const [nombreProyecto, setNombreProyecto] = useState(
        location.state?.nombreProyecto || 
        localStorage.getItem("last_nombreProyecto") || 
        proyectoSlug.replace(/-/g, " ")
    );
    const [descripcionProyecto, setDescripcionProyecto] = useState(
        location.state?.descripcionProyecto || 
        localStorage.getItem("last_descripcionProyecto") || 
        "Sin descripción"
    );

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [tareas, setTareas] = useState([]);
    const [loading, setLoading] = useState(true); // loader solo al inicio
    const [expandedTask, setExpandedTask] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [imagenActual, setImagenActual] = useState("");
    const [evidenciasUrls, setEvidenciasUrls] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // -------------------- GUARDAR EN LOCALSTORAGE --------------------
    useEffect(() => {
        if (proyectoSlug) localStorage.setItem("last_proyectoSlug", proyectoSlug);
        if (idProyecto) localStorage.setItem("last_idProyecto", idProyecto);
        if (nombreProyecto) localStorage.setItem("last_nombreProyecto", nombreProyecto);
        if (descripcionProyecto) localStorage.setItem("last_descripcionProyecto", descripcionProyecto);
    }, [proyectoSlug, idProyecto, nombreProyecto, descripcionProyecto]);

    // -------------------- MODAL EVIDENCIAS --------------------
    const abrirModal = (urls, index) => {
        if (!urls || urls.length === 0) return;
        setEvidenciasUrls(urls);
        setCurrentIndex(index);
        setImagenActual(urls[index]);
        setModalOpen(true);
    };

    const cerrarModal = () => {
        setModalOpen(false);
        setImagenActual("");
        setEvidenciasUrls([]);
        setCurrentIndex(0);
    };

    const goToPrevious = () => setCurrentIndex(prev => prev === 0 ? evidenciasUrls.length - 1 : prev - 1);
    const goToNext = () => setCurrentIndex(prev => prev === evidenciasUrls.length - 1 ? 0 : prev + 1);
    const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
    const toggleExpand = (id) => setExpandedTask(expandedTask === id ? null : id);

    useEffect(() => {
        if (evidenciasUrls.length > 0 && modalOpen) setImagenActual(evidenciasUrls[currentIndex]);
    }, [currentIndex, evidenciasUrls, modalOpen]);

    // -------------------- FUNCION PARA CARGAR TAREAS --------------------
    const fetchTareas = useCallback(async () => {
        const token = localStorage.getItem("jwt_token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            let proyectoId = idProyecto;

            // Si no hay idProyecto, buscarlo por slug
            if (!proyectoId && proyectoSlug) {
                const resProyecto = await fetch(`http://127.0.0.1:8000/api/proyectos/slug/${proyectoSlug}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (resProyecto.ok) {
                    const dataProyecto = await resProyecto.json();
                    proyectoId = dataProyecto.id_proyecto;
                    setIdProyecto(dataProyecto.id_proyecto);
                    setNombreProyecto(dataProyecto.nombre);
                    setDescripcionProyecto(dataProyecto.descripcion || "Sin descripción");
                } else {
                    console.error("No se encontró el proyecto por slug");
                    return;
                }
            }

            if (!proyectoId) {
                console.error("No se recibió ni se pudo obtener el id del proyecto");
                return;
            }

            // Obtener tareas
            const resTareas = await fetch(`http://127.0.0.1:8000/api/proyectos/${proyectoId}/tareas`, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            });

            if (!resTareas.ok) throw new Error(`HTTP ${resTareas.status}`);
            const data = await resTareas.json();

            // Ordenar por fecha de inicio
            data.sort((a, b) => {
                const fechaA = a.tf_inicio ? new Date(a.tf_inicio) : new Date(0);
                const fechaB = b.tf_inicio ? new Date(b.tf_inicio) : new Date(0);
                return fechaA - fechaB;
            });

            setTareas(data);
        } catch (err) {
            console.error("Error al cargar tareas:", err);
            setTareas([]);
        } finally {
            setLoading(false); // solo al inicio
        }
    }, [idProyecto, proyectoSlug, navigate]);

    // -------------------- CARGA INICIAL --------------------
    useEffect(() => {
        fetchTareas();
    }, [fetchTareas]);

    // -------------------- ACTUALIZACION AUTOMATICA --------------------
    useAutoRefresh(fetchTareas, 5000);

    // -------------------- LOADER INICIAL --------------------
    if (loading) {
        return (
            <div className="loader-container">
                <div className="loader-logo"><img src={logo3} alt="Cargando" /></div>
                <div className="loader-texto">CARGANDO TAREAS...</div>
                <div className="loader-spinner"></div>
            </div>
        );
    }

    // -------------------- RENDER --------------------
    return (
        <div className="main-layout">
            {/* Sidebar dinámico */}
            <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
                <MenuDinamico 
                    collapsed={sidebarCollapsed} 
                    departamentoId={localStorage.getItem('last_depId')} 
                    departamentoNombre={localStorage.getItem('last_depNombre')} 
                    departamentoSlug={localStorage.getItem('last_depSlug')} 
                    activeRoute="proceso"
                />
            </div>

            {/* Contenido principal */}
            <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
                <div className="logo-fondo">
                    <img src={logo3} alt="Fondo" />
                </div>

                <div className="header-global">
                    {/* CAMBIO 2: Usamos FaBars para la hamburguesa */}
                    <div className="header-left" onClick={toggleSidebar}>
                        <FaBars className="icono-hamburguesa-global" />
                    </div>
                    <div className="barra-center">
                        <span className="titulo-barra-global">
                            TAREAS DEL PROYECTO {nombreProyecto.toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="proyecto-descripcion-contenedor">
                    <strong>Descripción del proyecto:</strong>
                    <p>{descripcionProyecto}</p>
                </div>

                {/* Lista de tareas */}
                <div className="tareas-acordeon">
                    {tareas.length === 0 ? (
                        <p>No hay tareas asignadas.</p>
                    ) : (
                        tareas.map((tarea, index) => {
                            const isExpanded = expandedTask === tarea.id_tarea;
                            const estatusClass = tarea.t_estatus.toLowerCase().replace(" ", "-");
                            const currentEvidenciaUrls = tarea.evidencias ? tarea.evidencias.map(e => e.url) : [];

                            return (
                                <div key={tarea.id_tarea} className={`tarea-item ${estatusClass}`}>
                                    <div className="tarea-titulo" onClick={() => toggleExpand(tarea.id_tarea)}>
                                        <span>{index + 1}. {tarea.t_nombre}</span>
                                        <div className="tarea-titulo-derecha">
                                            <span className={`tarea-estatus ${estatusClass}`}>{tarea.t_estatus}</span>
                                            <span className={`flecha ${isExpanded ? "abierta" : ""}`}>&#9654;</span>
                                        </div>
                                    </div>

                                    <div className={`tarea-detalle ${isExpanded ? "abierta" : ""}`}>
                                        <div className="detalle-columna detalle-descripcion">
                                            <span className="detalle-label">Descripción:</span>
                                            <span className="detalle-valor">{tarea.descripcion || "Sin descripción"}</span>
                                        </div>
                                        <div className="tarea-datos-grid">
                                            <div className="detalle-columna">
                                                <span className="detalle-label">Inicio:</span>
                                                <span className="detalle-valor">{tarea.tf_inicio || "No definido"}</span>
                                            </div>
                                            <div className="detalle-columna">
                                                <span className="detalle-label">Fin:</span>
                                                <span className="detalle-valor">{tarea.tf_fin || "No definido"}</span>
                                            </div>
                                            <div className="detalle-columna">
                                                <span className="detalle-label">Responsable:</span>
                                                <span className="detalle-valor">{tarea.responsable || "No definido"}</span>
                                            </div>
                                            {tarea.evidencias && tarea.evidencias.length > 0 && (
                                                <div className="detalle-columna detalle-evidencia-seccion">
                                                    <div className="detalle-Evidencia-container">
                                                        <span className="detalle-label">Evidencia:</span>
                                                        <div className="evidencias-container">
                                                            <div className="detalle-Evidencia-galeria">
                                                                <img
                                                                    src={folderIcon}
                                                                    alt={`Abrir ${tarea.evidencias.length} evidencias`}
                                                                    className="evidencia-icono"
                                                                    onClick={() => abrirModal(currentEvidenciaUrls, 0)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* MODAL CON CARRUSEL */}
                {modalOpen && (
                    <div className="modal-overlay" onClick={cerrarModal}>
                        <div className="modal-content-carrusel" onClick={(e) => e.stopPropagation()}>
                            {evidenciasUrls.length > 1 && (
                                <button className="modal-nav-btn prev" onClick={goToPrevious}>&#10094;</button>
                            )}

                            <div className="carrusel-slide">
                                <img src={imagenActual} alt={`Evidencia ${currentIndex + 1}`} className="modal-img" />
                                {evidenciasUrls.length > 1 && (
                                    <div className="carrusel-index">{currentIndex + 1} / {evidenciasUrls.length}</div>
                                )}
                            </div>

                            {evidenciasUrls.length > 1 && (
                                <button className="modal-nav-btn next" onClick={goToNext}>&#10095;</button>
                            )}

                            <button className="modal-close" onClick={cerrarModal}>X</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}