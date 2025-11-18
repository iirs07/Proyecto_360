import React, { useState, useEffect } from "react";
import '../css/global.css';
import "../css/TareasPendientes.css";
import logo3 from "../imagenes/logo3.png";
import { FaExclamationCircle, FaBars,FaSearch } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import MenuDinamico from "../components/MenuDinamico";

function TareasPendientes() {
  const [busqueda, setBusqueda] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

 useEffect(() => {
  const fetchTareasPendientes = async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      const token = localStorage.getItem("jwt_token");

      if (!usuario?.id_usuario || !token) {
        console.warn("Usuario o token no encontrado en localStorage");
        setLoading(false);
        return;
      }

      const res = await fetch(
        `http://127.0.0.1:8000/api/tareaspendientesusuario?usuario=${usuario.id_usuario}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 401) {
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("usuario");
        navigate("/Login", { replace: true });
        return;
      }

      const data = await res.json();

      if (data.success) {
        setProyectos(data.proyectos || []);
      } else {
        console.error("Error al cargar proyectos y tareas:", data.mensaje);
      }

    } catch (error) {
      console.error("Error al cargar proyectos y tareas:", error);
    } finally {
      setLoading(false);
    }
  };

    fetchTareasPendientes();
  }, []);

  const proyectosFiltrados = (proyectos || [])
    .map(({ proyecto, tareas }) => {
      if (!proyecto || !tareas) return { proyecto: null, tareas: [], mostrar: false };
      const proyectoCoincide = proyecto.p_nombre?.toLowerCase().includes(busqueda.toLowerCase());
      const tareasFiltradas = proyectoCoincide
        ? tareas
        : tareas.filter((t) => t.t_nombre?.toLowerCase().includes(busqueda.toLowerCase()));
      return {
        proyecto,
        tareas: tareasFiltradas,
        mostrar: proyectoCoincide || tareasFiltradas.length > 0,
      };
    })
    .filter(({ mostrar }) => mostrar);

  return (
    <div className="main-layout">
          {/* ===== MENU LATERAL ===== */}
          <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
            <MenuDinamico 
              collapsed={sidebarCollapsed}
              departamentoId={localStorage.getItem('last_depId')} 
              departamentoNombre={localStorage.getItem('last_depNombre')} 
              departamentoSlug={localStorage.getItem('last_depSlug')} 
              activeRoute="tareas-pendientes"
            />
          </div>
    
          {/* ===== CONTENIDO PRINCIPAL ===== */}
          <div className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
            {/* Fondo semitransparente */}
            <div className="logo-fondo">
              <img src={logo3} alt="Fondo" />
            </div>
    
            {/* ===== BARRA SUPERIOR ===== */}
            <div className="header-global">
              <div className="header-left" onClick={toggleSidebar}>
                <FaBars className="icono-hamburguesa-global" />
              </div>
              <div className="barra-center">
                <span className="titulo-barra-global">
                  TAREAS PENDIENTES
                </span>
              </div>
            </div>

      <div className="container my-4">
  <div className="text-center">
    <h1 className="form-titulo">Tareas Pendientes</h1>
  </div>

         {/* BARRA FUERA DEL CONTENEDOR RESTRICTIVO */}
  <div className="barra-busqueda-global-container mb-4">
    <div className="barra-busqueda-global-wrapper">
      <FaSearch className="barra-busqueda-global-icon" />
      <input
        type="text"
        placeholder="Buscar proyectos por nombre..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="barra-busqueda-global-input"
      />
      {busqueda && (
        <button
          className="buscador-clear-global"
          onClick={() => setBusqueda("")}
        >
          <FiX />
        </button>
      )}
    </div>
  </div>

  {busqueda && (
    <div className="buscador-resultados-global">
      {proyectos.filter((p) =>
        p.proyecto?.p_nombre?.toLowerCase().includes(busqueda.toLowerCase())
      ).length} resultado(s) para "{busqueda}"
    </div>
  )}

 <div className="tareas-pendientes-filtros">
    <div className="tareaspendientesj-contenedor-buscador-y-tarjetas">
             {loading ? (
  <div className="loader-container">
    <div className="loader-logo">
      <img src={logo3} alt="Cargando" />
    </div>
    <div className="loader-texto">CARGANDO TAREAS PENDIENTES...</div>
    <div className="loader-spinner"></div>
  </div>
) : proyectos.length === 0 ? (
  // Solo si el backend no devolvió proyectos
  <p className="loading-tareas text-center">
    No hay proyectos o tareas pendientes.
  </p>
) : (
  proyectosFiltrados.map(({ proyecto, tareas }) =>
    proyecto ? (
      <div key={proyecto.id_proyecto} className="tareaspendientesj-proyectos-card">
        <h3 className="tareaspendientesj-nombre-proyecto">{proyecto.p_nombre}</h3>
        {tareas.map((tarea) => (
          <li key={tarea.id_tarea} className="tareaspendientesj-item-tarea-pendiente">
            <div className="tareaspendientesj-info-tarea-TP">
              <div className="tareaspendientesj-tarea-header">
                <FaExclamationCircle className="tareaspendientesj-icono-pendiente" />
                <label className="tareaspendientesj-tarea-nombre-TP">{tarea.t_nombre}</label>
              </div>
              <div className="tareaspendientesj-tarea-footer">
                <span className="tareaspendientesj-tarea-estatus-Pendiente">{tarea.t_estatus}</span>
                <span className="tareaspendientesj-tarea-fecha-TP">
                  Vence: {tarea.tf_fin || tarea.fechaVencimiento}
                </span>
              </div>
            </div>
          </li>
        ))}
      </div>
    ) : null
  )
)}

          </div>
        </div>
      </div>
    </div>
      </div>
  );
}

export default TareasPendientes;











