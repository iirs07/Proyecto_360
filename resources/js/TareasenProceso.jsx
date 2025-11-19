import React, { useState, useEffect } from "react";
import "../css/tareasenProceso.css";
import { FiX } from "react-icons/fi";
import { LuClock3 } from "react-icons/lu";
import { FaBars, FaSearch } from "react-icons/fa";
import { FaRegCalendarAlt } from "react-icons/fa";
import { FaChartBar } from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import '../css/global.css';
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";

function TareasenProceso() {
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  useEffect(() => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const idUsuario = usuario?.id_usuario;
  const token = localStorage.getItem("jwt_token");

  if (!idUsuario || !token) {
    setLoading(false);
    return;
  }

  const obtenerProyectos = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/tareas-proyectos-jefe?usuario=${idUsuario}`,
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

      const text = await res.text();
      if (!text || text.trim() === "") {
        setProyectos([]);
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        setProyectos([]);
        return;
      }

      if (data?.success) {
        setProyectos(data.proyectos || []);
      } else {
        setProyectos([]);
      }

    } catch (error) {
      setProyectos([]);
    } finally {
      setLoading(false);
    }
  };

  obtenerProyectos();
}, [navigate]);


  const todasLasTareasFinalizadas = (proyecto) => {
    if (!proyecto.tareas || proyecto.tareas.length === 0) return false;
    return (proyecto.total_tareas || 0) === (proyecto.tareas_completadas || 0);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calcularDiasRestantes = (fechaFin) => {
    if (!fechaFin) return null;
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diferencia = fin.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
  };

  const totalProyectos = proyectos.length;
  const totalTareas = proyectos.reduce((total, p) => total + (p.total_tareas || 0), 0);
  const tareasCompletadas = proyectos.reduce((total, p) => total + (p.tareas_completadas || 0), 0);

  const proyectosFiltrados = proyectos.filter(p =>
    p.p_nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleVerTareas = (proyecto) => {
    sessionStorage.setItem("proyectoSeleccionado", JSON.stringify(proyecto));
    navigate("/VerTareasPendientes");
  };

  

  return (
     <Layout
          titulo="TAREAS PENDIENTES POR REVISAR"
          sidebar={<MenuDinamico activeRoute="enproceso" />}
        >
        {proyectosFiltrados.length > 0 && (
          <>
            <div className="contenedor-global">
              <h1 className="titulo-global">Proyectos en Proceso</h1>
              {/* Estadísticas */}
              <div className="tareas-proceso-stats-container mb-4">
                <div className="tareas-proceso-stat-card">
                  <div className="stat-number">{totalProyectos}</div>
                  <div className="stat-label-tp">Número de proyectos</div>
                </div>
                <div className="tareas-proceso-stat-card">
                  <div className="stat-number">{totalTareas}</div>
                  <div className="stat-label-tp">Total de tareas</div>
                </div>
                <div className="tareas-proceso-stat-card">
                  <div className="stat-number">{tareasCompletadas}</div>
                  <div className="stat-label-tp">Tareas completadas</div>
                </div>
              </div>
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
                      onClick={() => setBusqueda("")}>
                      <FiX />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Lista de proyectos o estado vacío */}
        <div className="tareas-proceso-lista">
          {loading ? (
            <div className="loader-container">
              <div className="loader-logo">
                <img src={logo3} alt="Cargando" />
              </div>
              <div className="loader-texto">CARGANDO...</div>
              <div className="loader-spinner"></div>
            </div>
          ) : proyectosFiltrados.length > 0 ? (
            proyectosFiltrados.map(p => {
              const porcentajeCompletado = Math.round(((p.tareas_completadas || 0) / (p.total_tareas || 1)) * 100);
              const diasRestantes = calcularDiasRestantes(p.pf_fin);
              return (
                <div key={p.id_proyecto} className="tareas-proceso-card">
                  <div className="tareas-proceso-card-header">
                    <div className="tareas-proceso-estado-container">
                      <LuClock3 className="tareas-proceso-icono-estado en-proceso" />
                      <span className={`tareas-proceso-estatus-badge ${p.p_estatus?.toLowerCase().replace(' ', '-')}`}>
                        {p.p_estatus}
                      </span>
                    </div>
                  </div>
                  <div className="tareas-proceso-proyecto-nombre">{p.p_nombre}</div>

                  {/* Información del proyecto */}
                  <div className="tareas-proceso-meta-item">
  <span className="meta-label">
    <FaRegCalendarAlt className="meta-icon" />
    Fecha límite
  </span>
  <span className="meta-value">{formatearFecha(p.pf_fin)}</span>
  {diasRestantes <= 3 && diasRestantes >= 0 && (
    <span className="dias-restantes urgente">{diasRestantes} días</span>
  )}
</div>


                  {/* Barra de progreso */}
                  <div className="tareas-proceso-progress-container">
                    <div className="tareas-proceso-progress-header">
                      <span>
    <FaChartBar className="progress-icon" />
    Progreso del proyecto
  </span>
                      <span className="porcentaje">{porcentajeCompletado}%</span>
                    </div>
                    <div className="tareas-proceso-progress-bar">
                      <div 
                        className="tareas-proceso-progress-fill" 
                        style={{ width: `${porcentajeCompletado}%` }}
                      ></div>
                    </div>
                    <div className="tareas-proceso-progress-stats">
                      <span>{p.tareas_completadas || 0} completadas</span>
                      <span>{p.total_tareas - (p.tareas_completadas || 0)} pendientes</span>
                    </div>
                  </div>

                  {/* Información de tareas */}
                  <div className="tareas-proceso-tareas-info">
                    <div className="tarea-stats">
                      <div className="stat">
                        <span className="stat-number">{p.total_tareas || 0}</span>
                        <span className="stat-label">Total de tareas</span>
                      </div>
                      <div className="stat">
                        <span className="stat-number">{p.tareas_completadas || 0}</span>
                        <span className="stat-label">Tareas Completadas</span>
                      </div>
                      <div className="stat">
                        <span className="stat-number">{p.tareas_a_revisar || 0}</span>
                        <span className="stat-label">Tareas pendientes por revisar</span>
                      </div>
                    </div>
                  </div>

                  <div className="tareas-proceso-acciones">
                    <button className="tareas-proceso-btn-ver" onClick={() => handleVerTareas(p)}>
                      <LuClock3 className="btn-icon" />
                      Ver Tareas Pendientes
                    </button>

                    {p.p_estatus !== "Finalizada" && todasLasTareasFinalizadas(p) && (
                      <label className="vtp-checkbox-completar">
                        <input
                          type="checkbox"
                          onChange={() => handleCompletarTareaProyecto(p.id_proyecto)}
                          disabled={cargando}
                        />
                        Marcar Proyecto como Finalizado
                      </label>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state-global">
              <LuClock3 className="tareas-proceso-empty-icon" />
              <h3 className="empty-title-global">No hay proyectos en proceso</h3>
               <p className="empty-text-global">
                {busqueda
                  ? 'No se encontraron proyectos con ese nombre'
                  : 'Todos los proyectos están completados o no hay proyectos asignados'}
              </p>
            </div>
          )}
        </div>
    
   </Layout>
  );
}

export default TareasenProceso;













 