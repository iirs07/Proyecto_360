import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
    FaCaretDown, 
    FaSortAlphaDown, 
    FaSortAlphaUp, 
    FaSortNumericDown, 
    FaSortNumericUp,
    FaChartPie,
    FaChartBar,
    FaCalendarAlt,
    FaFlagCheckered,
    FaUser,
    FaChartLine,
    FaTasks
} from "react-icons/fa";

import "../css/DepProSuperUsuario.css";
import "../css/global.css";
import "../css/useOrdenamiento.css";

import logo3 from "../imagenes/logo3.png";
import ProgresoProyecto from "./ProgresoProyecto";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import { slugify } from "./utils/slugify";
import { useProyectosOrdenados } from '../hooks/useProyectosOrdenados';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

// Obtener la URL base desde las variables de entorno de Vite
const API_URL = import.meta.env.VITE_API_URL;

// --- Dropdown de Ordenamiento Mejorado ---
const SortDropdown = ({ sortBy, sortDirection, handleSelectSort, isMenuOpen }) => {
    const sortOptions = [
        ["Nombre (A-Z)", "nombre", "asc", FaSortAlphaDown],
        ["Nombre (Z-A)", "nombre", "desc", FaSortAlphaUp],
        ["Progreso (Menor %)", "porcentaje", "asc", FaSortNumericUp],
        ["Progreso (Mayor %)", "porcentaje", "desc", FaSortNumericDown],
        ["Inicio (Más Antiguo)", "fechaInicio", "asc", FaSortNumericUp],
        ["Inicio (Más Reciente)", "fechaInicio", "desc", FaSortNumericDown],
        ["Fin (Más Antiguo)", "fechaFin", "asc", FaSortNumericUp],
        ["Fin (Más Reciente)", "fechaFin", "desc", FaSortNumericDown],
    ];

    if (!isMenuOpen) return null;

    return (
        <div className="procom-dropdown-menu-sort" style={{ zIndex: 1000 }}>
            {sortOptions.map(([text, newSortBy, newSortDirection, Icon]) => (
                <button
                    key={`${newSortBy}-${newSortDirection}`}
                    className={`procom-dropdown-item-sort ${sortBy === newSortBy && sortDirection === newSortDirection ? 'procom-active' : ''}`}
                    onClick={() => handleSelectSort(newSortBy, newSortDirection)}
                    style={{ zIndex: 1001 }}
                >
                    <Icon className="procom-sort-icon" />
                    {text}
                </button>
            ))}
        </div>
    );
};

// Función para determinar la clase según el porcentaje de progreso
const getColorClassByProgress = (porcentaje) => {
    if (porcentaje < 30) return 'proyecto-bajo';
    if (porcentaje < 70) return 'proyecto-medio';
    return 'proyecto-alto';
};

// Función para obtener el color del porcentaje (para el texto)
const getColorPorcentaje = (porcentaje) => {
    if (porcentaje < 30) return "#dc3545"; // Rojo
    if (porcentaje < 70) return "#ffc107"; // Amarillo
    return "#28a745"; // Verde
};

export default function DepProProceso() {
    const { depNombreSlug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // --- Persistencia del departamento ---
    const stateDepId = location.state?.depId;
    const stateDepNombre = location.state?.nombre;
    const savedDepId = localStorage.getItem("last_depId");
    const savedDepNombre = localStorage.getItem("last_depNombre");
    const savedDepSlug = localStorage.getItem("last_depSlug");

    const depId = stateDepId || savedDepId;
    const departamentoNombre = stateDepNombre || depNombreSlug?.replace(/-/g, " ") || savedDepNombre || "Departamento";
    const currentDepartamentoSlug = slugify(departamentoNombre) || savedDepSlug || "departamento";

    useEffect(() => {
        if (depId) localStorage.setItem('last_depId', depId);
        if (departamentoNombre) localStorage.setItem('last_depNombre', departamentoNombre);
        if (currentDepartamentoSlug) localStorage.setItem('last_depSlug', currentDepartamentoSlug);
    }, [depId, departamentoNombre, currentDepartamentoSlug]);

    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tipoVisualizacionGlobal, setTipoVisualizacionGlobal] = useState("barra");
    const [showVisualizacionDropdown, setShowVisualizacionDropdown] = useState(false);

    // --- Hook de ordenamiento ---
    const {
        proyectosOrdenados,
        sortBy,
        sortDirection,
        isMenuOpen,
        setIsMenuOpen,
        handleSelectSort,
        getSortButtonText,
    } = useProyectosOrdenados(proyectos);

    // --- Cerrar dropdown al hacer clic fuera ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMenuOpen && !event.target.closest('.procom-sort-button-wrapper')) {
                setIsMenuOpen(false);
            }
            if (showVisualizacionDropdown && !event.target.closest('.visualizacion-control-container')) {
                setShowVisualizacionDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen, showVisualizacionDropdown]);

    // --- Función para obtener proyectos ---
    const fetchDatos = async (initialLoad = false) => {
        const token = localStorage.getItem("jwt_token");
        if (!token) {
            navigate("/", { replace: true });
            return;
        }

        if (!depId) {
            console.error("ID de departamento no disponible. Redirigiendo.");
            navigate("/PrincipalSuperusuario", { replace: true });
            return;
        }

        try {
            if (initialLoad) setLoading(true);
            const res = await fetch(
                `${API_URL}/api/departamentos/${depId}/progresos`,
                {
                    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
                }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            
            // Filtrado más flexible para "En Proceso"
            const proyectosEnProceso = data.filter(
                p => p.p_estatus && 
                    p.p_estatus.toLowerCase().includes("proceso") && 
                    (p.total_tareas === 0 || p.tareas_completadas < p.total_tareas)
            );
            
            console.log("Proyectos en proceso encontrados:", proyectosEnProceso.length);
            console.log("Estatus encontrados:", [...new Set(data.map(p => p.p_estatus))]);
            
            setProyectos(proyectosEnProceso);
        } catch (err) {
            console.error("Error al cargar proyectos en proceso:", err);
            setProyectos([]);
        } finally {
            if (initialLoad) setLoading(false);
        }
    };

    // --- Carga inicial ---
    useEffect(() => {
        fetchDatos(true);
    }, [depId, navigate]);

    // --- Actualización automática cada 5s ---
    useAutoRefresh(() => fetchDatos(false), 5000);

    if (loading) {
        return (
            <div className="loader-container" style={{ zIndex: 50 }}>
                <div className="loader-logo"><img src={logo3} alt="Cargando" /></div>
                <div className="loader-texto">CARGANDO PROYECTOS EN PROCESO...</div>
                <div className="loader-spinner"></div>
            </div>
        );
    }

    return (
        <Layout
            titulo={`PROYECTOS EN PROCESO - ${departamentoNombre.toUpperCase()}`}
            sidebar={
                <MenuDinamico
                    departamentoId={depId}
                    departamentoNombre={departamentoNombre}
                    departamentoSlug={currentDepartamentoSlug}
                    activeRoute="proceso"
                />
            }
        >
            <div className="procom-proceso-container" style={{ zIndex: 1 }}>
                {/* HEADER CON CONTROLES EN LÍNEA HORIZONTAL */}
                {proyectosOrdenados.length > 0 && (
                    <div className="resumen-metricas-container" style={{ zIndex: 10 }}>
                        {/* IZQUIERDA - Solo contador */}
                        <div className="controles-izquierdo">
                            <div className="conteo-proyectos-card" style={{ zIndex: 15 }}>
                                <span className="conteo-valor">
                                    {proyectosOrdenados.length}
                                </span>
                                <span className="conteo-label">
                                    TOTAL
                                </span>
                            </div>
                        </div>

                        {/* DERECHA - Visualización + Ordenar (pegados) */}
                        <div className="controles-derecho">
                            {/* SELECTOR DE VISUALIZACIÓN - UN SOLO BOTÓN DESPLEGABLE */}
                            <div 
                                className={`visualizacion-control-container ${showVisualizacionDropdown ? 'dropdown-open' : ''}`}
                                onClick={() => setShowVisualizacionDropdown(!showVisualizacionDropdown)}
                                style={{ zIndex: 20, position: 'relative' }}
                            >
                                {/* CONTENIDO PRINCIPAL DEL BOTÓN */}
                                <div className="visualizacion-contenido">
                                    <div className="visualizacion-icon-texto">
                                        {/* ICONO DINÁMICO - MANTIENE TAMAÑO CONSISTENTE */}
                                        <div className="visualizacion-icon-wrapper">
                                            {tipoVisualizacionGlobal === 'barra' ? 
                                                <FaChartBar className="visualizacion-icon fa-chart-bar" /> : 
                                                <FaChartPie className="visualizacion-icon fa-chart-pie" />
                                            }
                                        </div>
                                        <span className="visualizacion-texto">
                                            {tipoVisualizacionGlobal === 'barra' ? 'Barra' : 'Circular'}
                                        </span>
                                    </div>
                                    <FaCaretDown className="visualizacion-caret" />
                                </div>

                                {/* DROPDOWN PERSONALIZADO */}
                                {showVisualizacionDropdown && (
                                    <div className="visualizacion-dropdown-menu">
                                        <div 
                                            className={`visualizacion-dropdown-item ${tipoVisualizacionGlobal === 'barra' ? 'visualizacion-active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTipoVisualizacionGlobal('barra');
                                                setShowVisualizacionDropdown(false);
                                            }}
                                        >
                                            <div className="visualizacion-dropdown-icon-container">
                                                <FaChartBar className="visualizacion-dropdown-icon fa-chart-bar" />
                                            </div>
                                            <span className="visualizacion-dropdown-texto">Barra</span>
                                        </div>
                                        <div 
                                            className={`visualizacion-dropdown-item ${tipoVisualizacionGlobal === 'circular' ? 'visualizacion-active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTipoVisualizacionGlobal('circular');
                                                setShowVisualizacionDropdown(false);
                                            }}
                                        >
                                            <div className="visualizacion-dropdown-icon-container">
                                                <FaChartPie className="visualizacion-dropdown-icon fa-chart-pie" />
                                            </div>
                                            <span className="visualizacion-dropdown-texto">Circular</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* CONTROL DE ORDENAMIENTO */}
                            <div className="procom-sort-control-container">
                                <div className="procom-sort-button-wrapper" style={{ zIndex: 100 }}>
                                    <button 
                                        className="procom-sort-button" 
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        style={{ zIndex: 101 }}
                                    >
                                        <FaSortAlphaDown className="procom-sort-button-icon" />
                                        {getSortButtonText()} 
                                        <FaCaretDown className={`procom-caret-icon ${isMenuOpen ? 'procom-rotate' : ''}`} />
                                    </button>
                                    
                                    <SortDropdown
                                        sortBy={sortBy}
                                        sortDirection={sortDirection}
                                        handleSelectSort={handleSelectSort}
                                        isMenuOpen={isMenuOpen}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* LISTA DE PROYECTOS */}
                <div className="proyectos-proceso-lista" style={{ zIndex: 5 }}>
                    {proyectosOrdenados.length === 0 ? (
                        <div className="proyecto-sin-tareas" style={{ zIndex: 6 }}>
                            <div className="sin-tareas-icon">
                                <FaChartLine className="no-data-icon" />
                            </div>
                            <p>No hay proyectos en proceso en este departamento</p>
                            <small>Todos los proyectos están finalizados o no han sido iniciados</small>
                        </div>
                    ) : (
                        proyectosOrdenados.map((proyecto, index) => {
                            const slugProyecto = slugify(proyecto.p_nombre);
                            const porcentaje = proyecto.porcentaje || 0;
                            const progressClass = getColorClassByProgress(porcentaje);
                            // Asegurar que el estatus se muestre correctamente
                            const estadoMostrar = proyecto.p_estatus || "En Proceso";
                            // IMPORTANTE: El data-estado debe ser "En proceso" (con minúscula 'p') para que coincida con el CSS
                            const dataEstado = "En proceso";
                            
                            // FUNCIÓN DE NAVEGACIÓN
                            const handleNavigateToProject = () => {
                                navigate(`/proyecto/${slugProyecto}`, {
                                    state: {
                                        idProyecto: proyecto.id_proyecto,
                                        nombreProyecto: proyecto.p_nombre,
                                        descripcionProyecto: proyecto.descripcion,
                                        porcentaje: porcentaje,
                                        totalTareas: proyecto.total_tareas,
                                        tareasCompletadas: proyecto.tareas_completadas,
                                    },
                                });
                            };

                            return (
                                <div 
                                    key={proyecto.id_proyecto} 
                                    className={`proyecto-enprogreso-item ${progressClass}`}
                                    data-progreso={porcentaje}
                                    data-estado="en-proceso"
                                    style={{ 
                                        zIndex: 10 + index,
                                        animationDelay: `${index * 0.1}s` 
                                    }}
                                >
                                    {/* HEADER DEL PROYECTO */}
                                    <div className="proyecto-enprogreso-header">
                                        <div className="proyecto-enprogreso-nombre">
                                            <span className="proyecto-enprogreso-valor">{proyecto.p_nombre}</span>
                                        </div>
                                        <div className="proyecto-enprogreso-badges">
                                            <span 
                                                className="badge-estado-enprogreso" 
                                                data-estado={dataEstado} // Usamos el valor fijo "En proceso"
                                            >
                                                {estadoMostrar} 
                                            </span>
                                        </div>
                                    </div>

                                    {/* INFORMACIÓN DEL PROYECTO */}
                                    <div className="proyecto-enprogreso-columnas">
                                        <div className="proyecto-enprogreso-columna">
                                            <span className="proyecto-enprogreso-label">
                                                <FaCalendarAlt className="proyecto-enprogreso-icon" />
                                                Inicio
                                            </span>
                                            <span className="proyecto-enprogreso-valor">{proyecto.pf_inicio}</span>
                                        </div>
                                        <div className="proyecto-enprogreso-columna">
                                            <span className="proyecto-enprogreso-label">
                                                <FaFlagCheckered className="proyecto-enprogreso-icon" />
                                                Fin
                                            </span>
                                            <span className="proyecto-enprogreso-valor">{proyecto.pf_fin}</span>
                                        </div>
                                        <div className="proyecto-enprogreso-columna">
                                            <span className="proyecto-enprogreso-label">
                                                <FaUser className="proyecto-enprogreso-icon" />
                                                Encargado
                                            </span>
                                            <span className="proyecto-enprogreso-valor">{proyecto.responsable}</span>
                                        </div>
                                        <div className="proyecto-enprogreso-columna">
                                            <span className="proyecto-enprogreso-label">
                                                <FaChartLine className="proyecto-enprogreso-icon" />
                                                Progreso
                                            </span>
                                            <span 
                                                className="proyecto-enprogreso-valor" 
                                                style={{ color: getColorPorcentaje(porcentaje), fontWeight: 'bold' }}
                                            >
                                                {porcentaje}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* COMPONENTE DE PROGRESO */}
                                    <div className="proyecto-proceso-progreso-container">
                                        {proyecto.total_tareas > 0 ? (
                                            <div 
                                                className="proyecto-proceso-progreso"
                                                onClick={handleNavigateToProject}
                                                style={{ cursor: 'pointer' }} 
                                            >
                                                <ProgresoProyecto
                                                    progresoInicial={porcentaje}
                                                    tareasTotales={proyecto.total_tareas}
                                                    tareasCompletadas={proyecto.tareas_completadas}
                                                    tipo={tipoVisualizacionGlobal}
                                                    tamaño="medio"
                                                />
                                            </div>
                                        ) : (
                                            <div className="proyecto-proceso-sin-tareas">
                                                <FaTasks className="sin-tareas-mini-icon" />
                                                <span>Sin tareas asignadas</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Layout>
    );
}