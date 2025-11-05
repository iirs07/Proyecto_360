import React from "react";
// Importamos los iconos que ya usas
import { FaHome, FaFileAlt, FaUsers, FaTasks, FaProjectDiagram } from "react-icons/fa";
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
        // Aquí se agregarían Jefe, Usuario, etc.
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
        // 🚩 Es bueno añadir la clase 'collapsed' al UL aquí también si es necesario
        <ul className={`menu-dinamico-list ${collapsed ? 'collapsed' : ''}`}>
            {menuItems.map(item => {
                const IconComponent = item.icon;
                return (
                    <li 
                        key={item.key} 
                        className={`menu-item ${activeRoute === item.key ? 'active' : ''}`} 
                        onClick={() => handleClick(item)}
                    >
                        <IconComponent className="icon" />
                        {/* 🟢 Esto asegura que el texto se oculte cuando collapsed es true */}
                        {!collapsed && <span className="label">{item.label}</span>} 
                    </li>
                );
            })}
        </ul>
    );
}