import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
    FaCaretDown, 
    FaSortAlphaDown, 
    FaSortAlphaUp, 
    FaSortNumericDown, 
    FaSortNumericUp,
    FaCalendarAlt,
    FaFlagCheckered,
    FaUser,
    FaChartLine,
    FaTasks,
    FaChartBar,
    FaChartPie
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

// Función para obtener el color del porcentaje
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
    const savedDepId = localStorage.getItem('last_depId');
    const savedDepNombre = localStorage.getItem('last_depNombre');
    const savedDepSlug = localStorage.getItem('last_depSlug');

    const depId = stateDepId || savedDepId;
    const departamentoNombre = stateDepNombre || depNombreSlug?.replace(/-/g, ' ') || savedDepNombre || "Departamento";
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

    // --- Cerrar dropdowns al hacer clic fuera ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Cerrar dropdown de ordenamiento
            if (isMenuOpen && !event.target.closest('.procom-sort-button-wrapper')) {
                setIsMenuOpen(false);
            }
            
            // Cerrar dropdown de visualización
            if (showVisualizacionDropdown && !event.target.closest('.visualizacion-control-container')) {
                setShowVisualizacionDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen, showVisualizacionDropdown, setIsMenuOpen]);

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
                `http://127.0.0.1:8000/api/departamentos/${depId}/progresos`,
                {
                    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
                }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const proyectosEnProceso = data.filter(
                p => p.p_estatus === "En proceso" &&
                    (p.total_tareas === 0 || p.tareas_completadas < p.total_tareas)
            );
            setProyectos(proyectosEnProceso);
        } catch (err) {
            console.error("Error al cargar proyectos:", err);
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
                <div className="proyectos-linea" style={{ zIndex: 5 }}>
                    {proyectosOrdenados.length === 0 ? (
                        <div className="proyecto-sin-tareas" style={{ zIndex: 6 }}>
                            <div className="sin-tareas-icon">
                                <FaChartLine className="no-data-icon" />
                            </div>
                            <p>No hay proyectos en proceso con tareas pendientes</p>
                            <small>Todos los proyectos están completados o no tienen tareas asignadas</small>
                        </div>
                    ) : (
                        proyectosOrdenados.map((proyecto, index) => (
                            <div 
                                key={proyecto.id_proyecto} 
                                className="proyecto-linea-item"
                                style={{ 
                                    zIndex: 10 + index,
                                    animationDelay: `${index * 0.1}s` 
                                }}
                                onClick={() => {
                                    const proyectoSlug = slugify(proyecto.p_nombre);
                                    navigate(`/proyecto/${proyectoSlug}`, {
                                        state: {
                                            idProyecto: proyecto.id_proyecto,
                                            nombreProyecto: proyecto.p_nombre,
                                            descripcionProyecto: proyecto.descripcion
                                        }
                                    });
                                }}
                            >
                                {/* HEADER DEL PROYECTO */}
                                <div className="proyecto-header">
                                    <div className="proyecto-nombre">
                                        <span className="proyecto-valor">{proyecto.p_nombre}</span>
                                    </div>
                                    <div className="proyecto-badges">
                                        <span className="badge-estado" data-estado={proyecto.p_estatus}>
                                            {proyecto.p_estatus}
                                        </span>
                                    </div>
                                </div>

                                {/* INFORMACIÓN DEL PROYECTO */}
                                <div className="proyecto-columnas">
                                    <div className="proyecto-linea-columna">
                                        <span className="proyecto-label">
                                            <FaCalendarAlt className="proyecto-icon" />
                                            Inicio
                                        </span>
                                        <span className="proyecto-valor">{proyecto.pf_inicio}</span>
                                    </div>
                                    <div className="proyecto-linea-columna">
                                        <span className="proyecto-label">
                                            <FaFlagCheckered className="proyecto-icon" />
                                            Fin
                                        </span>
                                        <span className="proyecto-valor">{proyecto.pf_fin}</span>
                                    </div>
                                    <div className="proyecto-linea-columna">
                                        <span className="proyecto-label">
                                            <FaUser className="proyecto-icon" />
                                            Encargado
                                        </span>
                                        <span className="proyecto-valor">{proyecto.responsable}</span>
                                    </div>
                                    <div className="proyecto-linea-columna">
                                        <span className="proyecto-label">
                                            <FaChartLine className="proyecto-icon" />
                                            Progreso
                                        </span>
                                        <span 
                                            className="proyecto-valor porcentaje-proyecto"
                                            style={{ color: getColorPorcentaje(proyecto.porcentaje) }}
                                        >
                                            {proyecto.porcentaje}%
                                        </span>
                                    </div>
                                </div>

                                {/* COMPONENTE DE PROGRESO */}
                                <div className="proyecto-linea-progreso-container">
                                    {proyecto.total_tareas > 0 ? (
                                        <div className="proyecto-linea-progreso">
                                            <ProgresoProyecto
                                                progresoInicial={proyecto.porcentaje}
                                                tareasTotales={proyecto.total_tareas}
                                                tareasCompletadas={proyecto.tareas_completadas}
                                                tipo={tipoVisualizacionGlobal}
                                                tamaño="medio"
                                            />
                                        </div>
                                    ) : (
                                        <div className="proyecto-sin-tareas-mini">
                                            <FaTasks className="sin-tareas-mini-icon" />
                                            <span>Sin tareas asignadas</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Layout>
    );
}