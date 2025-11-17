import React, { useState } from "react";
// Importamos los iconos que ya usas
import { 
  FaHome, FaFileAlt, FaUsers, FaTasks, FaProjectDiagram, FaPlus, FaFolder, 
  FaEye, FaEdit, FaToggleOn, FaTrash, FaSpinner, FaHourglassHalf, 
  FaCheckCircle, FaChevronDown, FaChevronRight 
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
    const [subMenusAbiertos, setSubMenusAbiertos] = useState({});

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
    { key: 'logout', label: "CERRAR SESIÓN", path: "/logout", icon: FaUsers, action: onLogout }
  ]
},
Usuario: {
  principal: [
    { key: 'inicio', label: "INICIO", path: "/GestionProyectosUsuario", icon: FaHome },
    { key: 'tareas', label: "MIS TAREAS", path: "/ListaDeProyectos", icon: FaHourglassHalf },
    { key: 'reportes_tareas_completadas', label: "REPORTES", path: "/ReportesTareasCompletadas", icon: FaFileAlt },
    { key: 'logout', label: "CERRAR SESIÓN", icon: FaUsers, action: onLogout },
  ],
},
    };

    // Detectar tipo de menú según URL
    const tipoMenu = location.pathname.includes('/proyectosenproceso') ||
                     location.pathname.includes('/proyectoscompletados') ||
                     location.pathname.includes('/proyecto') 
                     ? 'departamento'
                     : 'principal';

     const menuItems = menus[rol]?.[tipoMenu] || [];

    // 🆕 FUNCIÓN PARA TOGGLE SUBMENÚ
    const toggleSubMenu = (itemKey, event) => {
        event.stopPropagation();
        setSubMenusAbiertos(prev => ({
            ...prev,
            [itemKey]: !prev[itemKey]
        }));
    };

     const handleClick = (item) => {
        // Si tiene submenú, solo expandir/contraer, no navegar
        if (item.subMenu) {
            return; // La navegación se maneja en los items del submenú
        }

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

    // 🆕 FUNCIÓN PARA MANEJAR CLICK EN ITEM DE SUBMENÚ
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

    // 🆕 FUNCIÓN PARA RENDERIZAR ITEMS (PRINCIPALES Y SUBMENÚS)
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
                    
                    {/* 🆕 RENDERIZAR SUBMENÚ SI ESTÁ ABIERTO */}
                    {tieneSubMenu && estaAbierto && !collapsed && (
                        <ul className="submenu">
                            {renderMenuItems(item.subMenu, nivel + 1)}
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