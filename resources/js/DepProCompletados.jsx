import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaCaretDown, FaSortAlphaDown, FaSortAlphaUp, FaSortNumericDown, FaSortNumericUp } from "react-icons/fa";

// Asegúrate de que los estilos para las nuevas métricas estén aquí o en global.css
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


// --- Dropdown de Ordenamiento ---
const SortDropdown = ({ sortBy, sortDirection, handleSelectSort }) => {
    const sortOptions = [
        ["Nombre (A-Z)", "nombre", "asc", FaSortAlphaDown],
        ["Nombre (Z-A)", "nombre", "desc", FaSortAlphaUp],
        ["Fecha Fin (Más Antiguo)", "fechaFin", "asc", FaSortNumericUp],
        ["Fecha Fin (Más Reciente)", "fechaFin", "desc", FaSortNumericDown],
        ["Fecha Inicio (Más Antiguo)", "fechaInicio", "asc", FaSortNumericUp],
        ["Fecha Inicio (Más Reciente)", "fechaInicio", "desc", FaSortNumericDown],
        ["Progreso (Mayor %)", "porcentaje", "desc", FaSortNumericDown],
        ["Progreso (Menor %)", "porcentaje", "asc", FaSortNumericUp],
    ];

    return (
        <div className="dropdown-menu-sort">
            {sortOptions.map(([text, newSortBy, newSortDirection, Icon]) => (
                <button
                    key={`${newSortBy}-${newSortDirection}`}
                    className={`dropdown-item-sort ${sortBy === newSortBy && sortDirection === newSortDirection ? 'active' : ''}`}
                    onClick={() => handleSelectSort(newSortBy, newSortDirection)}
                >
                    <Icon className="icon" />
                    {text}
                </button>
            ))}
        </div>
    );
};

export default function DepProCompletados() {
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

    // --- Función para obtener proyectos ---
    const fetchDatos = async (initialLoad = false) => {
        const token = localStorage.getItem("jwt_token");
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        if (!depId) {
            console.error("ID de departamento no disponible. Redirigiendo.");
            navigate("/Principal", { replace: true });
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
            const proyectosFinalizados = data.filter(
                // Filtro solo para proyectos Finalizados que tengan tareas (asumiendo 100% de progreso)
                p => p.p_estatus === "Finalizado" && p.total_tareas > 0
            );
            setProyectos(proyectosFinalizados);
        } catch (err) {
            console.error("Error al cargar proyectos finalizados:", err);
            setProyectos([]);
        } finally {
            if (initialLoad) setLoading(false);
        }
    };

    // --- Carga inicial + actualización automática cada 5s ---
    useEffect(() => {
        fetchDatos(true); // carga inicial
    }, [depId, navigate]);

    useAutoRefresh(() => fetchDatos(false), 5000);

    if (loading) {
        return (
            <div className="loader-container">
                <div className="loader-logo"><img src={logo3} alt="Cargando" /></div>
                <div className="loader-texto">CARGANDO PROYECTOS FINALIZADOS...</div>
                <div className="loader-spinner"></div>
            </div>
        );
    }

    return (
        <Layout
            titulo={`PROYECTOS FINALIZADOS DE ${departamentoNombre}`}
            sidebar={
                <MenuDinamico
                    departamentoId={depId}
                    departamentoNombre={departamentoNombre}
                    departamentoSlug={currentDepartamentoSlug}
                    activeRoute="completados"
                />
            }
        >
            {/* 🆕 CONTENEDOR DE MÉTRICAS Y ORDENAMIENTO (Renderizado Condicional) */}
            {proyectosOrdenados.length > 0 && (
                <div className="resumen-metricas-container">
                    
                    {/* 1. Tarjeta de Conteo de Proyectos (order: -1 para ir a la izquierda) */}
                    <div className="conteo-proyectos-card">
                        <span className="conteo-valor">
                            {proyectosOrdenados.length}
                        </span>
                        <span className="conteo-label">
                            FINALIZADOS {/* 👈 Etiqueta cambiada */}
                        </span>
                    </div>

                    {/* 2. Control de Ordenamiento (order: 1 para ir a la derecha) */}
                    <div className="sort-control-container">
                        <div className="sort-button-wrapper">
                            <button className="sort-button" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                Ordenar por: {getSortButtonText()} <FaCaretDown />
                            </button>
                            {isMenuOpen && (
                                <SortDropdown
                                    sortBy={sortBy}
                                    sortDirection={sortDirection}
                                    handleSelectSort={handleSelectSort}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="proyectos-linea">
                {proyectosOrdenados.length === 0 ? (
                    <p className="proyecto-sin-tareas">
                        No hay proyectos finalizados en este departamento.
                    </p>
                ) : (
                    proyectosOrdenados.map((proyecto) => {
                        const slugProyecto = slugify(proyecto.p_nombre);
                        return (
                            <div 
                                key={slugProyecto} 
                                className="proyecto-linea-item completado"
                                onClick={() =>
                                    navigate(`/proyecto/${slugProyecto}`, {
                                        state: {
                                            idProyecto: proyecto.id_proyecto,
                                            nombreProyecto: proyecto.p_nombre,
                                            descripcionProyecto: proyecto.descripcion,
                                            porcentaje: proyecto.porcentaje,
                                            totalTareas: proyecto.total_tareas,
                                            tareasCompletadas: proyecto.tareas_completadas,
                                        },
                                    })
                                }
                                style={{ cursor: "pointer" }}
                            >
                                <div className="proyecto-nombre">
                                    <span className="proyecto-label">Nombre: </span>
                                    <span className="proyecto-valor">{proyecto.p_nombre}</span>
                                </div>

                                <div className="proyecto-columnas">
                                    <div className="proyecto-linea-columna">
                                        <span className="proyecto-label">Fecha inicio:</span>
                                        <span className="proyecto-valor">{proyecto.pf_inicio}</span>
                                    </div>
                                    <div className="proyecto-linea-columna">
                                        <span className="proyecto-label">Fecha fin:</span>
                                        <span className="proyecto-valor">{proyecto.pf_fin}</span>
                                    </div>
                                    <div className="proyecto-linea-columna">
                                        <span className="proyecto-label">Estatus:</span>
                                        {/* El estatus "Finalizado" se verá bien con los estilos CSS existentes */}
                                        <span className="proyecto-valor" style={{ color: '#28A745' }}>{proyecto.p_estatus}</span>
                                    </div>
                                    <div className="proyecto-linea-columna">
                                        <span className="proyecto-label">Responsable:</span>
                                        <span className="proyecto-valor">{proyecto.responsable}</span>
                                    </div>
                                </div>

                                <div className="proyecto-linea-progreso-container">
                                    <div className="proyecto-linea-progreso">
                                        <ProgresoProyecto
                                            progresoInicial={proyecto.porcentaje}
                                            tareasTotales={proyecto.total_tareas}
                                            tareasCompletadas={proyecto.tareas_completadas}
                                            descripcion={proyecto.descripcion}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </Layout>
    );
}