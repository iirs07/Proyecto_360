import React, { useState } from "react";
// 💡 Importamos FaBars para el menú de hamburguesa
import { FaHome, FaBars } from "react-icons/fa"; 
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";

export default function Layout({ titulo, children, sidebar, ...rest }) {
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Función para alternar el estado (abrir/cerrar)
    const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

    const handleLogout = () => {
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("last_depId");
        localStorage.removeItem("last_depNombre");
        localStorage.removeItem("last_depSlug");
        localStorage.removeItem("user_role"); // O 'rol', según tu Login.js
        navigate("/Login", { replace: true });
    };

    return (
        <div className="main-layout">
            <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
                {/* Clonamos el elemento sidebar (MenuDinamico) y le pasamos: 
                  1. El estado actual (collapsed) para que sepa si debe mostrarse completo.
                  2. La función de logout.
                  3. Las props de los componentes padres.
                */}
                {sidebar && React.cloneElement(sidebar, { ...rest, collapsed: sidebarCollapsed, onLogout: handleLogout })}
            </div>

            <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
                <div className="logo-fondo">
                    <img src={logo3} alt="Fondo" />
                </div>

                <div className="header-global">
                    {/* 👇 ZONA DE CAMBIO: Sustituimos FaHome por FaBars */}
                    <div className="header-left" onClick={toggleSidebar}>
                        <FaBars className="icono-hamburguesa-global" /> 
                    </div>
                    {/* 👆 ZONA DE CAMBIO */}
                    
                    <div className="barra-center">
                        <span className="titulo-barra-global">{titulo.toUpperCase()}</span>
                    </div>
                </div>

                <div className="page-content-wrapper">
                    {children}
                </div>
            </div>
        </div>
    );
}