import React from "react";
// Importamos los iconos que ya usas
import { FaHome, FaFileAlt, FaUsers, FaTasks, FaProjectDiagram } from "react-icons/fa";
import {
 
    FaFolder,
    FaPlus,
    FaEye,
    FaEdit,
    FaToggleOn,
    FaTrash,
    FaSpinner,
    FaHourglassHalf,
    FaCheckCircle
} from "react-icons/fa";

import { useNavigate, useLocation } from "react-router-dom";
import "../css/global.css";
// Ajusta la ruta de slugify si es necesario
import { slugify } from "../js/utils/slugify.jsx"; 

export default function MenuDinamico({ 
    collapsed, 
    departamentoId, 
    departamentoNombre, 
    departamentoSlug,
    onLogout, 
    activeRoute
}) {
    // 🚩 CORRECCIÓN CRUCIAL: Usamos 'rol' en lugar de 'user_role' (basado en Login.js)
    const rol = localStorage.getItem('rol') || 'Superusuario'; 
    
    const location = useLocation();
    const navigate = useNavigate();

    // Slug persistente
    const slug = departamentoSlug || (departamentoNombre ? slugify(departamentoNombre) : localStorage.getItem('last_depSlug') || '');
    if (slug) localStorage.setItem('last_depSlug', slug);

    // Menús por rol (Solo el Superusuario, usando la estructura original)
    const menus = {
        Superusuario: {
            principal: [
                { key: 'inicio', label: 'Inicio', icon: FaHome, path: '/Principal' },
                { key: 'reportes', label: 'Reportes', icon: FaFileAlt, path: '/ReporteSuperUsuario' },
                { key: 'logout', label: 'Cerrar sesión', icon: FaUsers, action: onLogout },
            ],
            departamento: [
                { key: 'inicio', label: 'Inicio', icon: FaHome, path: '/Principal' },
                { key: 'proceso', label: 'Proyectos en proceso', icon: FaTasks, path: slug ? `/proyectosenproceso/${slug}` : '#' },
                { key: 'finalizados', label: 'Proyectos finalizados', icon: FaProjectDiagram, path: slug ? `/proyectoscompletados/${slug}` : '#' },
                { key: 'logout', label: 'Cerrar sesión', icon: FaUsers, action: onLogout },
            ],
        },
        Jefe: {
        principal: [
            {
                key: 'GestionProyectos',
                label: 'INICIO',
                icon: FaHome,
                path: '/GestionProyectos'
            },
            {
                key: 'proyectos',
                label: "PROYECTOS",
                icon: FaFolder,
                subMenu: [
                    { key: 'Nuevo proyecto', label: "Nuevo Proyecto", path: "/Nuevoproyecto", icon: FaPlus },
                    { key: 'ver', label: "Ver Proyectos", path: "/VerProyecto", icon: FaEye },
                    { key: 'modificar', label: "Modificar Proyectos", path: "/ProyectosM", icon: FaEdit },
                    { key: 'estatus', label: "Cambiar estatus del proyecto", path: "/DesbloquearProyectos", icon: FaToggleOn },
                    { key: 'eliminar', label: "Eliminar Proyectos", path: "/EliminarProyectos", icon: FaTrash },
                ],
            },
            {
                key: 'tareas',
                label: "TAREAS",
                icon: FaTasks,
                subMenu: [
                    { key: 'enproceso', label: "Tareas por revisar", path: "/TareasenProceso", icon: FaSpinner },
                    { key: 'pendientes', label: "Tareas pendientes", path: "/TareasPendientes", icon: FaHourglassHalf },
                    { key: 'completadas', label: "Tareas completadas", path: "/TareasCompletadasDepartamento", icon: FaCheckCircle },
                    { key: 'agregar', label: "Agregar Tareas", path: "/AgregarT", icon: FaPlus },
                    { key: 'modificarT', label: "Modificar tarea", path: "/ModificarTareas", icon: FaEdit },
                    { key: 'eliminarT', label: "Eliminar tarea", path: "/InterfazEliminar", icon: FaTrash },
                ],
            },
            { key: 'reportes', label: "REPORTES", path: "/reporte", icon: FaFileAlt },
            { key: 'logout', label: "CERRAR SESIÓN", icon: FaUsers, action: onLogout }
        ]
    },

    Usuario: {
        principal: [
            { key: 'gestion-proyectosusuario', label: "INICIO", path: "/GestionProyectosUsuario", icon: FaHome },
            { key: 'tareas', label: "MIS TAREAS", path: "/ListaDeProyectos", icon: FaHourglassHalf },
            { key: 'reportes_tareas_completadas', label: "REPORTES", path: "/ReportesTareasCompletadas", icon: FaFileAlt },
            { key: 'logout', label: "CERRAR SESIÓN", icon: FaUsers, action: onLogout },
        ]
    }
    };

    // Detectar tipo de menú según URL
    const tipoMenu = location.pathname.includes('/proyectosenproceso') ||
                     location.pathname.includes('/proyectoscompletados') ||
                     location.pathname.includes('/proyecto') 
                     ? 'departamento'
                     : 'principal';

    const menuItems = menus[rol]?.[tipoMenu] || [];

    const handleClick = (item) => {
        if (item.key === 'logout') {
            if (typeof onLogout === 'function') {
                onLogout(); // Llamamos directamente a la prop onLogout
            } else {
                // Fallback si no se pasó onLogout (aunque Layout.js siempre la pasa)
                localStorage.clear();
                navigate("/login", { replace: true });
            }
            return;
        }

        if (!item.path || item.path === '#') return;

        // Mantener el state existente (depId, nombre, slug)
        const stateToSend = {
            ...location.state,
            depId: departamentoId,
            nombre: departamentoNombre,
            depSlug: slug
        };

        navigate(item.path, { state: stateToSend });
    };

    return (
    <ul className={`menu-dinamico-list ${collapsed ? 'collapsed' : ''}`}>
        {menuItems.map(item => {
            const IconComponent = item.icon;

            // 🔹 Caso normal (sin submenú)
            if (!item.subMenu) {
                return (
                    <li 
                        key={item.key}
                        className={`menu-item ${activeRoute === item.key ? 'active' : ''}`}
                        onClick={() => handleClick(item)}
                    >
                        <IconComponent className="icon" />
                        {!collapsed && <span className="label">{item.label}</span>}
                    </li>
                );
            }

            // 🔹 Caso con submenú
            return (
                <li key={item.key} className="menu-item submenu">
                    <div className="submenu-header">
                        <IconComponent className="icon" />
                        {!collapsed && <span className="label">{item.label}</span>}
                    </div>

                    {!collapsed && (
                        <ul className="submenu-list">
                            {item.subMenu.map(sub => {
                                const SubIcon = sub.icon;
                                return (
                                    <li 
                                        key={sub.key}
                                        className="submenu-item"
                                        onClick={() => handleClick(sub)}
                                    >
                                        <SubIcon className="icon" />
                                        <span className="label">{sub.label}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </li>
            );
        })}
    </ul>
);

}