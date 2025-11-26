import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiLayers, FiCheckCircle, FiList, FiX } from "react-icons/fi";
import { LuClock3 } from "react-icons/lu";
import { FaSearch, FaRegCalendarAlt, FaArrowRight } from "react-icons/fa";
import "../css/tareasenProceso.css";
import "../css/global.css";
import logo3 from "../imagenes/logo3.png"; 
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";

function TareasenProceso() {
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
   const { volverSegunRol } = useRolNavigation();

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario?.id_usuario) return;

    const obtenerProyectos = async () => {
      const token = localStorage.getItem("jwt_token");
      if (!token) return;

      setLoading(true);
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/tareas-proyectos-jefe?usuario=${usuario.id_usuario}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          console.error("Error al obtener proyectos:", errorData);
          return;
        }

        const data = await res.json();
        if (data.success) setProyectos(data.proyectos);
      } catch (error) {
        console.error("Error de red:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerProyectos();
  }, []);

  const handleCompletarTareaProyecto = async (idProyecto) => {
    const token = localStorage.getItem("jwt_token");
    if (!token) return;

    setCargando(true);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/proyectos/${idProyecto}/finalizar`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setProyectos((prev) => prev.filter((p) => p.id_proyecto !== idProyecto));
      } else {
        alert(data.mensaje || "No se pudo finalizar el proyecto");
      }
    } catch (error) {
      console.error("Error de red:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleVerTareas = (proyecto) => {
    sessionStorage.setItem("proyectoSeleccionado", JSON.stringify(proyecto));
    navigate("/VerTareasPendientes");
  };

  const confirmarFinalizacion = async () => {
    if (!proyectoSeleccionado) return;

    await handleCompletarTareaProyecto(proyectoSeleccionado.id_proyecto);
    setModalOpen(false);
    setProyectoSeleccionado(null);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "2-digit", month: "short", year: "numeric"
    });
  };

  const todasLasTareasFinalizadas = (p) => {
    if (!p.tareas || p.tareas.length === 0) return false;
    return (p.total_tareas || 0) === (p.tareas_completadas || 0);
  };

  const proyectosFiltrados = proyectos.filter((p) =>
    p.p_nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalProyectos = proyectos.length;
  const totalTareas = proyectos.reduce((acc, p) => acc + (p.total_tareas || 0), 0);
  const tareasListas = proyectos.reduce((acc, p) => acc + (p.tareas_completadas || 0), 0);

  return (
    <Layout
      titulo="TAREAS PENDIENTES POR REVISAR"
      sidebar={<MenuDinamico activeRoute="enproceso" />}
    >
      <div className="tep-contenedor-global">

        {proyectos.length > 0 && (
          <div className="tep-kpi-dashboard">
            <div className="tep-kpi-card">
              <div className="tep-kpi-icon-wrapper vino">
                <FiLayers />
              </div>
              <div className="tep-kpi-content">
                <span className="tep-kpi-number">{totalProyectos}</span>
                <span className="tep-kpi-label">Proyectos Activos</span>
              </div>
            </div>
            
            <div className="tep-kpi-card">
              <div className="tep-kpi-icon-wrapper azul">
                <FiList />
              </div>
              <div className="tep-kpi-content">
                <span className="tep-kpi-number">{totalTareas}</span>
                <span className="tep-kpi-label">Total Tareas</span>
              </div>
            </div>

            <div className="tep-kpi-card">
              <div className="tep-kpi-icon-wrapper verde">
                <FiCheckCircle />
              </div>
              <div className="tep-kpi-content">
                <span className="tep-kpi-number">{tareasListas}</span>
                <span className="tep-kpi-label">Tareas completadas</span>
              </div>
            </div>
             
          </div>
          
        )}

{proyectos.length > 0 && (
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
)}

        <div className="tep-lista-proyectos">
          {loading ? (
            <div className="loader-container">
              <div className="loader-logo">
                <img src={logo3} alt="Cargando proyectos" />
              </div>
              <div className="loader-texto">CARGANDO...</div>
              <div className="loader-spinner"></div>
            </div>
          ) : proyectosFiltrados.length > 0 ? (
            proyectosFiltrados.map((p) => {
              const porcentaje = Math.round(((p.tareas_completadas || 0) / (p.total_tareas || 1)) * 100);
              const listoParaFinalizar = p.p_estatus !== "Finalizada" && todasLasTareasFinalizadas(p);

              return (
                <div key={p.id_proyecto} className="tep-project-card-horizontal">
                  <div className={`tep-status-stripe ${p.p_estatus === 'Finalizada' ? 'completed' : ''}`}></div>

                  <div className="tep-col-info">
                    <div className="tep-header-badges">
                      <span className={`tep-badge-status ${p.p_estatus === 'Finalizada' ? 'completed' : 'process'}`}>
                        {p.p_estatus}
                      </span>
                      <span className="tep-badge-date">
                        <FaRegCalendarAlt /> {formatearFecha(p.pf_fin)}
                      </span>
                    </div>
                    <h3 className="tep-project-title">{p.p_nombre}</h3>
                  </div>

                  <div className="tep-col-progress">
                    <div className="tep-progress-meta">
                      <span>Avance General</span>
                      <span className="tep-percent-text">{porcentaje}%</span>
                    </div>
                    <div className="tep-progress-track">
                      <div className="tep-progress-fill" style={{ width: `${porcentaje}%` }}></div>
                    </div>
                  </div>

                  <div className="tep-col-actions">
                    <div className="tep-mini-stats-grid">
                      <div className="tep-stat-item">
                        <span className="tep-stat-val">{p.tareas_completadas || 0}</span>
                        <span className="tep-stat-lbl">Tareas completadas</span>
                      </div>
                      <div className="tep-stat-item">
                        <span className="tep-stat-val">{p.total_tareas || 0}</span>
                        <span className="tep-stat-lbl">Total tareas</span>
                      </div>
                      <div className="tep-stat-item">
                        <span className={`tep-stat-val ${p.tareas_a_revisar}`}>
                          {p.tareas_a_revisar || 0}
                        </span>
                        <span className="tep-stat-lbl">Por revisar</span>
                      </div>
                    </div>

                    <div className="tep-action-buttons">
                       {listoParaFinalizar && (
                        <label className="tep-check-finish" title="Marcar como finalizado">
                          <input 
                            type="checkbox" 
                            checked={false}
                            onChange={() => {
                              setProyectoSeleccionado(p);
                              setModalOpen(true);
                            }} 
                            disabled={cargando} 
                          />
                          <span className="tep-check-label">Finalizar</span>
                        </label>
                       )}
                       
                       <button className="tep-btn-details" onClick={() => handleVerTareas(p)}>
                         Ver detalles <FaArrowRight className="tep-icon-arrow"/>
                       </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
                        titulo="TAREAS PENDIENTES POR REVISAR"
                        mensaje="No hay tareas por revisar."
                        botonTexto="Volver al Tablero"
                        onVolver={volverSegunRol}
                        icono={logo3}
                      />
          )}
        </div>

        <ConfirmModal
          isOpen={modalOpen}
          title="Confirmar finalización"
          message={`¿Estás seguro que deseas marcar como finalizado el proyecto "${proyectoSeleccionado?.p_nombre}"?`}
          onConfirm={confirmarFinalizacion}
          onCancel={() => {
            setModalOpen(false);
            setProyectoSeleccionado(null);
          }}
        />

      </div> 
    </Layout>
  );
}

export default TareasenProceso;
