import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaCaretDown, FaSortAlphaDown, FaSortAlphaUp, FaSortNumericDown, FaSortNumericUp } from "react-icons/fa";

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
        ["Progreso (Menor %)", "porcentaje", "asc", FaSortNumericUp],
        ["Progreso (Mayor %)", "porcentaje", "desc", FaSortNumericDown],
        ["Inicio (Más Antiguo)", "fechaInicio", "asc", FaSortNumericUp],
        ["Inicio (Más Reciente)", "fechaInicio", "desc", FaSortNumericDown],
        ["Fin (Más Antiguo)", "fechaFin", "asc", FaSortNumericUp],
        ["Fin (Más Reciente)", "fechaFin", "desc", FaSortNumericDown],
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
            <div className="loader-container">
                <div className="loader-logo"><img src={logo3} alt="Cargando" /></div>
                <div className="loader-texto">CARGANDO PROYECTOS EN PROCESO...</div>
                <div className="loader-spinner"></div>
            </div>
        );
    }

    return (
        <Layout
            titulo={`PROYECTOS EN PROCESO DE ${departamentoNombre}`}
            sidebar={
                <MenuDinamico
                    departamentoId={depId}
                    departamentoNombre={departamentoNombre}
                    departamentoSlug={currentDepartamentoSlug}
                    activeRoute="proceso"
                />
            }
        >
            {/* Ordenamiento solo si hay proyectos */}
            {proyectosOrdenados.length > 0 && (
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
            )}

            {/* Lista de proyectos */}
            <div className="proyectos-linea">
                {proyectosOrdenados.length === 0 ? (
                    <p className="proyecto-sin-tareas">
                        No hay proyectos en proceso con tareas pendientes o sin tareas asignadas.
                    </p>
                ) : (
                    proyectosOrdenados.map(proyecto => (
                        <div key={proyecto.id_proyecto} className="proyecto-linea-item">
                            <div className="proyecto-nombre">
                                <span className="proyecto-label">Proyecto: </span>
                                <span className="proyecto-valor">{proyecto.p_nombre}</span>
                            </div>
                            <div className="proyecto-columnas">
                                <div className="proyecto-linea-columna">
                                    <span className="proyecto-label">Inicio:</span>
                                    <span className="proyecto-valor">{proyecto.pf_inicio}</span>
                                </div>
                                <div className="proyecto-linea-columna">
                                    <span className="proyecto-label">Fin:</span>
                                    <span className="proyecto-valor">{proyecto.pf_fin}</span>
                                </div>
                                <div className="proyecto-linea-columna">
                                    <span className="proyecto-label">Estado:</span>
                                    <span className="proyecto-valor">{proyecto.p_estatus}</span>
                                </div>
                                <div className="proyecto-linea-columna">
                                    <span className="proyecto-label">Encargado:</span>
                                    <span className="proyecto-valor">{proyecto.responsable}</span>
                                </div>
                            </div>
                            <div className="proyecto-linea-progreso-container">
                                {proyecto.total_tareas > 0 ? (
                                    <div
                                        className="proyecto-linea-progreso"
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
                                        style={{ cursor: "pointer" }}
                                    >
                                        <ProgresoProyecto
                                            progresoInicial={proyecto.porcentaje}
                                            tareasTotales={proyecto.total_tareas}
                                            tareasCompletadas={proyecto.tareas_completadas}
                                            descripcion={proyecto.descripcion}
                                        />
                                    </div>
                                ) : (
                                    <span className="proyecto-sin-tareas">Sin tareas asignadas</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Layout>
    );
}
