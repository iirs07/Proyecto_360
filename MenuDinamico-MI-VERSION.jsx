import React, { useState } from "react";

import { 
  FaHome, FaFileAlt, FaUsers, FaTasks, FaProjectDiagram, FaPlus, FaFolder, 
  FaEye, FaEdit, FaToggleOn, FaTrash, FaSpinner, FaHourglassHalf, FaLayerGroup,
  FaCheckCircle, FaChevronDown, FaChevronRight, FaUserPlus, FaUserMinus, FaSignOutAlt,
  FaBuilding, FaSitemap, FaUserFriends, FaListAlt, FaCity, FaNetworkWired, FaObjectGroup 
} from "react-icons/fa";

import { FiUsers } from "react-icons/fi";

import { useNavigate, useLocation } from "react-router-dom";
import "../css/global.css";

import { slugify } from "../js/utils/slugify.jsx"; 


export default function MenuDinamico({ 
    collapsed, 
    departamentoId, 
    departamentoNombre, 
    departamentoSlug,
    onLogout, 
    activeRoute
}) {

    // Obtener rol
    const rol = sessionStorage.getItem('rol') || localStorage.getItem('rol') || 'Superusuario';

    const location = useLocation();
    const navigate = useNavigate();
    const [subMenusAbiertos, setSubMenusAbiertos] = useState({});

    // Slug persistente
    const slug = departamentoSlug || 
                (departamentoNombre ? slugify(departamentoNombre) : localStorage.getItem('last_depSlug') || '');

    if (slug) localStorage.setItem('last_depSlug', slug);

    
    // ============================
    //     MENÚS DEFINIDOS
    // ============================
    const menus = {

        Superusuario: {
            principal: [
                { key: 'inicio', label: 'Inicio', icon: FaHome, path: '/PrincipalSuperusuario' },
                { key: 'reportes', label: 'Reportes', icon: FaFileAlt, path: '/ReporteSuperUsuario' },
                { key: 'logout', label: 'Cerrar sesión', icon: FaSignOutAlt, action: onLogout },
            ],

            departamento: [
                { key: 'inicio', label: 'Inicio', icon: FaHome, path: '/PrincipalSuperusuario' },
                { key: 'proceso', label: 'Proyectos en proceso', icon: FaTasks, path: slug ? `/proyectosenproceso/${slug}` : '#' },
                { key: 'finalizados', label: 'Proyectos finalizados', icon: FaProjectDiagram, path: slug ? `/proyectoscompletados/${slug}` : '#' },
                { key: 'logout', label: 'Cerrar sesión', icon: FaSignOutAlt, action: onLogout },
            ],
        },

        Administrador: {
            principal: [
                { key: 'Admin', label: 'Inicio', icon: FaHome, path: '/Admin' },
                {
                    key: 'usuarios',
                    label: "Usuarios",
                    icon: FiUsers,
                    subMenu: [
                        { key: 'Invitacion', label: "Agregar usuarios", path: "/Invitacion", icon: FaUserPlus },
                        { key: 'EliminarUsuario', label: "Eliminar usuarios", path: "/EliminarUsuario", icon: FaUserMinus },
                         { key: 'ModificarUsuario', label: "Modificar usuarios", path: "/ModificarUsuario", icon: FaUserMinus },
                    ],
                },
                {    
                    key: 'departamentos',
                    label: "Departamentos",
                    icon: FaBuilding,
                    subMenu: [
                        { key: 'nuevodepartamento', label: "Nuevo Área / departamento", path: "/NuevoDepartamento", icon: FaPlus },
                        { key: 'modificardepartamento', label: "Modificar Área / departamento", path: "/ModificarDepartamento", icon: FaEdit },
                    ],
                },

                { key: 'logout', label: "CERRAR SESIÓN", path: "/login", icon: FaSignOutAlt, action: onLogout },
            ]
        },
        


        Jefe: {
            principal: [
                { key: 'GestionProyectos', label: 'INICIO', icon: FaHome, path: '/GestionProyectos' },

                {
                    key: 'proyectos',
                    label: "PROYECTOS",
                    icon: FaFolder,
                    subMenu: [
                        { key: 'Nuevo proyecto', label: "Nuevo Proyecto", path: "/Nuevoproyecto", icon: FaPlus },
                        { key: 'ver', label: "Ver Proyectos", path: "/ListaProyectos", icon: FaEye },
                        { key: 'modificar', label: "Modificar Proyectos", path: "/ProyectosPorModificar", icon: FaEdit },
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
                        { key: 'eliminarT', label: "Eliminar tarea", path: "/EliminarTareas", icon: FaTrash },
                    ],
                },

                {
                    key: 'usuarios',
                    label: "Usuarios",
                    icon: FiUsers,
                    subMenu: [
                        { key: 'generarInvitacion', label: "Agregar usuarios", path: "/Invitacion", icon: FaUserPlus },
                        { key: 'EliminarUsuario', label: "Eliminar usuarios", path: "/EliminarUsuario", icon: FaUserMinus },
                    ],
                },

                { key: 'reportes', label: "REPORTES", path: "/reporte", icon: FaFileAlt },
                { key: 'logout', label: "CERRAR SESIÓN", icon: FaSignOutAlt, action: onLogout },
            ]
        },


        Usuario: {
            principal: [
                { key: 'inicio', label: "INICIO", path: "/GestionProyectosUsuario", icon: FaHome },
                { key: 'tareas', label: "MIS PROYECTOS", path: "/ListaDeProyectos", icon: FaLayerGroup },
                { key: 'reportes_tareas_completadas', label: "REPORTES", path: "/ReportesTareasCompletadas", icon: FaFileAlt },
                { key: 'logout', label: "CERRAR SESIÓN", icon: FaSignOutAlt, action: onLogout },
            ],
        }

    };


    // Detectar tipo de menú según URL
    const tipoMenu =
        location.pathname.includes('/proyectosenproceso') ||
        location.pathname.includes('/proyectoscompletados') ||
        location.pathname.includes('/proyecto')
            ? 'departamento'
            : 'principal';

    const menuItems = menus[rol]?.[tipoMenu] || [];


    // ===============================
    //    FUNCIONES DE MENU
    // ===============================

    const toggleSubMenu = (itemKey, event) => {
        event.stopPropagation();
        setSubMenusAbiertos(prev => ({
            ...prev,
            [itemKey]: !prev[itemKey]
        }));
    };

    const handleClick = (item) => {
        if (item.subMenu) return;

        if (item.key === 'logout') {
            if (typeof onLogout === 'function') {
                onLogout();
            } else {
                localStorage.clear();
                navigate("/login", { replace: true });
            }
            return;
        }

        if (!item.path || item.path === '#') return;

        const stateToSend = {
            ...location.state,
            depId: departamentoId,
            nombre: departamentoNombre,
            depSlug: slug
        };

        navigate(item.path, { state: stateToSend });
    };

    const handleSubMenuItemClick = (subItem) => {
        if (!subItem.path || subItem.path === '#') return;

        const stateToSend = {
            ...location.state,
            depId: departamentoId,
            nombre: departamentoNombre,
            depSlug: slug
        };

        navigate(subItem.path, { state: stateToSend });
    };


    // RENDERIZAR MENÚS
    const renderMenuItems = (items, nivel = 0) => {
        return items.map(item => {
            const IconComponent = item.icon;
            const tieneSubMenu = item.subMenu && item.subMenu.length > 0;
            const estaAbierto = subMenusAbiertos[item.key];

            return (
                <React.Fragment key={item.key}>
                    <li 
                        className={`menu-item ${activeRoute === item.key ? 'active' : ''} nivel-${nivel}`} 
                        onClick={(e) => {
                            if (tieneSubMenu) {
                                toggleSubMenu(item.key, e);
                            } else {
                                handleClick(item);
                            }
                        }}
                    >
                        <IconComponent className="icon" />

                        {!collapsed && (
                            <>
                                <span className="label">{item.label}</span>
                                {tieneSubMenu && (
                                    <span className="submenu-arrow">
                                        {estaAbierto ? <FaChevronDown /> : <FaChevronRight />}
                                    </span>
                                )}
                            </>
                        )}
                    </li>

                    {tieneSubMenu && estaAbierto && !collapsed && (
                        <ul className="submenu">
                            {item.subMenu.map(subItem => (
                                <li 
                                    key={subItem.key}
                                    className="submenu-item"
                                    onClick={() => handleSubMenuItemClick(subItem)}
                                >
                                    <subItem.icon className="icon" />
                                    <span>{subItem.label}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                </React.Fragment>
            );
        });
    };

    return (
        <ul className={`menu-dinamico-list ${collapsed ? 'collapsed' : ''}`}>
            {renderMenuItems(menuItems)}
        </ul>
    );
}
