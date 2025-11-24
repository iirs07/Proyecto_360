import React, { useState, useEffect } from "react";
import "../css/DesbloquearProyectos.css"; 
import "../css/formulario.css"; 
import { FiX, FiChevronLeft, FiChevronRight, FiArchive, FiUnlock } from "react-icons/fi";
import { FaCheckCircle, FaSearch, FaTasks } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";

function DesbloquearProyectos() {
  const [busqueda, setBusqueda] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proyectosDesbloqueados, setProyectosDesbloqueados] = useState([]); 
  const navigate = useNavigate();

  const [modalVisible, setModalVisible] = useState(false);
  const [tareaActual, setTareaActual] = useState(null);
  const [evidencias, setEvidencias] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [imagenCargando, setImagenCargando] = useState(true);
  const { volverSegunRol } = useRolNavigation();

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario?.id_usuario) return;

    const obtenerProyectosCompletados = async () => {
      const token = localStorage.getItem("jwt_token");

      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/proyectos/completados?usuario_id=${usuario.id_usuario}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
          }
        );

        if (res.status === 401) {
          localStorage.removeItem("jwt_token");
          navigate("/Login", { replace: true });
          return;
        }

        const data = await res.json();
        if (data.success) setProyectos(data.proyectos);
      } catch (error) {
        console.error("Error al obtener proyectos:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerProyectosCompletados();
  }, [navigate]);

  const proyectosFiltrados = proyectos.filter(p =>
    p.p_nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleDesbloquearProyecto = async (idProyecto) => {
    const token = localStorage.getItem("jwt_token");
    const estaDesbloqueado = proyectosDesbloqueados.includes(idProyecto);

    if (estaDesbloqueado) {
        const exitoBloqueo = await handleBloquearProyecto(idProyecto); 
        if (exitoBloqueo) {
            setProyectosDesbloqueados(prev => prev.filter(id => id !== idProyecto));
        }
        return; 
    } 
    
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/proyectos/${idProyecto}/cambiar-status`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        if (res.status === 401) {
            localStorage.removeItem("jwt_token");
            navigate("/Login", { replace: true });
            return;
        }

        const data = await res.json();
        if (data.success) {
            setProyectosDesbloqueados(prev => [...prev, idProyecto]); 
            setProyectos(prev =>
                prev.map(p =>
                    p.id_proyecto === idProyecto ? { ...p, p_estatus: "En proceso" } : p
                )
            );
        }
    } catch (error) {
        console.error("Error al desbloquear proyecto:", error);
    }
  };

  const handleBloquearProyecto = async (idProyecto) => {
    const token = localStorage.getItem("jwt_token");
    
    if (!token) {
        navigate("/Login", { replace: true });
        return false;
    }

    try {
        const res = await fetch(`http://127.0.0.1:8000/api/proyectos/${idProyecto}/finalizar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                Authorization: `Bearer ${token}` 
            },
        });

        if (res.status === 401) {
            localStorage.removeItem("jwt_token");
            navigate("/Login", { replace: true });
            return false;
        }
        
        if (!res.ok) {
            console.error("Error al archivar proyecto:", await res.json());
            return false;
        }

        const data = await res.json();

        if (data.success) {
            setProyectos(prev =>
                prev.map(p =>
                    p.id_proyecto === idProyecto ? { ...p, p_estatus: "Finalizado" } : p
                )
            );
            return true;
        } else {
            console.error(data.mensaje || "No se pudo archivar el proyecto");
            return false;
        }
    } catch (error) {
        console.error("Error de red al archivar proyecto:", error);
        return false;
    }
  };

  const handleCompletarTarea = async (id, idProyecto) => {
    const token = localStorage.getItem("jwt_token");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/tareas/${id}/cambiar-estatus-enproceso`, {
        method: 'PUT',
        headers: { 
          'Accept': 'application/json',
          "Authorization": `Bearer ${token}` 
        },
      });
      
      if (res.status === 401) {
        localStorage.removeItem("jwt_token");
        navigate("/Login", { replace: true });
        return;
      }
      
      if (!res.ok) {
        let errorMsg = `HTTP error! status: ${res.status}`;
        try {
          const errorData = await res.json();
          if (errorData.mensaje) errorMsg += ` - ${errorData.mensaje}`;
        } catch {}
        throw new Error(errorMsg);
      }

      const data = await res.json();

      if (data.success) {
        setProyectos(prev =>
          prev.map(proy => {
            if (proy.id_proyecto === idProyecto) {
              const tareasActualizadas = proy.tareas.map(t =>
                t.id_tarea === id ? { ...t, t_estatus: "En proceso" } : t
              );
              return { ...proy, tareas: tareasActualizadas };
            }
            return proy;
          })
        );
      } else {
        console.warn("No se pudo actualizar la tarea:", data.mensaje);
      }
    } catch (error) {
      console.error("Error al actualizar tarea:", error.message);
    }
  };

  // ----- Modal de evidencias -----
  const handleVerEvidencias = (tarea) => {
    setTareaActual(tarea);
    setEvidencias(tarea.evidencias || []);
    setIndiceActual(0);
    setImagenCargando(true);
    setModalVisible(true);
  };

  const handleCerrarModal = () => {
    setModalVisible(false);
    setTareaActual(null);
    setEvidencias([]);
    setIndiceActual(0);
    setImagenCargando(false);
  };

  const handlePrev = () => {
    if (evidencias.length <= 1) return;
    setImagenCargando(true);
    setIndiceActual(prev => (prev === 0 ? evidencias.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (evidencias.length <= 1) return;
    setImagenCargando(true);
    setIndiceActual(prev => (prev === evidencias.length - 1 ? 0 : prev + 1));
  };

  const handleImageLoad = () => setImagenCargando(false);
  const handleImageError = (e) => {
    console.error("Error cargando imagen:", evidencias[indiceActual]);
    setImagenCargando(false);
    e.target.style.display = 'none';
  };

  const getStatusClass = (estatus) => {
    if (!estatus) return '';
    return estatus.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <Layout
      titulo="PROYECTOS FINALIZADOS"
      sidebar={<MenuDinamico activeRoute="modificar" />}
    >
      <div className="contenedor-global">

        {proyectosFiltrados.length > 0 && (
          <div className="barra-busqueda-global-container mb-4">
             <p className="subtitulo-global">Gestiona y reactiva proyectos finalizados</p>
            <div className="barra-busqueda-global-wrapper">
              <FaSearch className="barra-busqueda-global-icon" />
              <input
                type="text"
                placeholder="Buscar proyectos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="barra-busqueda-global-input"
              />
              {busqueda && (
                <button className="buscador-clear-global" onClick={() => setBusqueda("")}>
                  <FiX />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lista de proyectos */}
        <div className="dp-lista">
          {loading ? (
            <div className="loader-container">
              <div className="loader-logo"><img src={logo3} alt="Cargando" /></div>
              <div className="loader-texto">CARGANDO...</div>
              <div className="loader-spinner"></div>
            </div>
          ) : proyectosFiltrados.length > 0 ? (
            proyectosFiltrados.map(p => {
              const estaDesbloqueado = proyectosDesbloqueados.includes(p.id_proyecto);

              return (
                <div key={p.id_proyecto} className={`dp-card ${estaDesbloqueado ? 'dp-card-desbloqueado' : ''}`}>
                  
                  {/* Header del proyecto */}
                  <div className="dp-card-header">
                    <div className="dp-proyecto-info">
                      <h3 className="dp-proyecto-nombre">{p.p_nombre}</h3>
                      <div className="dp-proyecto-meta">
                       
                        <div className="dp-tareas-count">
                          <FaTasks className="dp-tareas-icon" />
                          {p.tareas_completadas || 0} / {p.total_tareas || 0} tareas
                        </div>
                      </div>
                    </div>
                    
                    {/* Estado del proyecto */}
                    <div className="dp-estado-container">
                      <div className={`dp-status-badge ${estaDesbloqueado ? 'dp-status-desbloqueado' : 'dp-status-bloqueado'}`}>
                        {estaDesbloqueado ? (
                          <>
                            <FiUnlock className="dp-status-icon" />
                            <span>REABIERTO</span>
                          </>
                        ) : (
                          <>
                            <FiArchive className="dp-status-icon" />
                            <span>ARCHIVADO</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                 {/* Tareas: se muestran solo si el proyecto está desbloqueado */}
{estaDesbloqueado && (
  <div className="dp-tareas-section">
    <div className="dp-tareas-header">
      <h4 className="dp-tareas-titulo">Tareas para reabrir</h4>
      <span className="dp-tareas-subtitulo">Marca las tareas que deseas reactivar</span>
    </div>
    
    <div className="dp-tareas-lista">
      {p.tareas.map(t => (
        <div key={t.id_tarea} className="dp-tarea-item">
          <div className="dp-tarea-content">
            <div className="dp-tarea-info">
              <span className="dp-tarea-nombre">{t.t_nombre}</span>
            </div>
            
            <div className="dp-tarea-actions">
              {t.evidencias?.length > 0 && (
                <button className="dp-btn-evidencias" onClick={() => handleVerEvidencias(t)}>
                  Ver Evidencias ({t.evidencias.length})
                </button>
              )}
              
              <label className="dp-checkbox-container">
                <input
                  type="checkbox"
                  checked={t.t_estatus === "En proceso"}
                  onChange={() => handleCompletarTarea(t.id_tarea, p.id_proyecto)}
                />
                <span className="dp-checkbox-checkmark"></span>
                <span className="dp-checkbox-label">
                  {t.t_estatus === "En proceso" ? "En Proceso" : "Marcar"}
                </span>
              </label>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
                  

                  {/* Botón de acción principal */}
                  <div className="dp-accion-container">
                    <button 
                      className={`dp-btn-accion-principal ${estaDesbloqueado ? 'dp-btn-bloqueado' : 'dp-btn-desbloqueado'}`}
                      onClick={() => handleDesbloquearProyecto(p.id_proyecto)}
                    >
                      {estaDesbloqueado ? (
                        <>
                          <FiArchive className="dp-btn-icon" />
                          ARCHIVAR PROYECTO
                        </>
                      ) : (
                        <>
                          <FiUnlock className="dp-btn-icon" />
                          REABRIR PROYECTO
                        </>
                      )}
                    </button>
                    
                    {estaDesbloqueado && (
                      <p className="dp-accion-nota">
                        Al archivar el proyecto, las tareas marcadas como "En proceso" permanecerán activas
                      </p>
                    )}
                  </div>

                </div>
              );
            })
          ) : (
            <div className="empty-state-global">
               <EmptyState
    titulo="LISTA DE PROYECTOS"
    mensaje="Actualmente no tienes proyectos finalizados o disponibles para desbloquear."
    botonTexto="Volver al Tablero"
    onVolver={volverSegunRol} 
    icono={logo3}
  />
              <p className="empty-text-global">
                {busqueda
                  ? "No se encontraron proyectos que coincidan con tu búsqueda."
                  : "Actualmente no tienes proyectos finalizados o disponibles para desbloquear."}
              </p>
            </div>
          )}
        </div>
      </div>

      {modalVisible && tareaActual && (
        <div className="dp-modal">
          <div className="dp-modal-content">
            <button className="dp-modal-cerrar" onClick={handleCerrarModal}>
              <FiX />
            </button>
            <div className="dp-modal-header">
              <h3>{tareaActual.t_nombre}</h3>
              <span className={`dp-modal-estatus ${getStatusClass(tareaActual.t_estatus)}`}>
                {tareaActual.t_estatus}
              </span>
            </div>

            {evidencias.length > 0 ? (
              <div className="dp-evidencias-container">
                <div className="dp-evidencias-navegacion">
                  <div className="dp-imagen-container">
                    {imagenCargando && <div className="dp-imagen-cargando"></div>}
                    <img
                      src={`http://127.0.0.1:8000/storage/${evidencias[indiceActual].ruta_archivo}`}
                      alt={`Evidencia ${indiceActual + 1} de ${tareaActual.t_nombre}`}
                      className="dp-imagen-evidencia"
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      style={{ display: imagenCargando ? 'none' : 'block' }}
                    />
                  </div>

                  {evidencias.length > 1 && (
                    <>
                      <button className="dp-btn-navegacion dp-btn-prev" onClick={handlePrev}>
                        <FiChevronLeft size={28} />
                      </button>
                      <button className="dp-btn-navegacion dp-btn-next" onClick={handleNext}>
                        <FiChevronRight size={28} />
                      </button>
                    </>
                  )}
                </div>

                {evidencias.length > 1 && (
                  <div className="dp-contador">
                    <span>{indiceActual + 1} / {evidencias.length}</span>
                  </div>
                )}

                <div className="dp-evidencias-info">
                  <span className="dp-tarea-fecha">
                    Subido: {evidencias[indiceActual]?.created_at || 'Fecha no disponible'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="dp-sin-evidencias">No hay evidencias disponibles</div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

export default DesbloquearProyectos;

