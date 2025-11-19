import React, { useState, useEffect } from "react";
import "../css/DesbloquearProyectos.css"; 
import "../css/formulario.css"; 
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaCheckCircle, FaSearch } from "react-icons/fa";
import { LuClock3 } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";

function DesbloquearProyectos() {
  const [busqueda, setBusqueda] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proyectosDesbloqueados, setProyectosDesbloqueados] = useState([]);
  const navigate = useNavigate();

  // Modal de evidencias
  const [modalVisible, setModalVisible] = useState(false);
  const [tareaActual, setTareaActual] = useState(null);
  const [evidencias, setEvidencias] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [imagenCargando, setImagenCargando] = useState(true);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario?.id_usuario) return;

    const obtenerProyectosCompletados = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/proyectos/completados?usuario_id=${usuario.id_usuario}`);
        const data = await res.json();
        if (data.success) setProyectos(data.proyectos);
      } catch (error) {
        console.error("Error al obtener proyectos:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerProyectosCompletados();
  }, []);

  const proyectosFiltrados = proyectos.filter(p =>
    p.p_nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleDesbloquearProyecto = async (idProyecto) => {
    if (proyectosDesbloqueados.includes(idProyecto)) {
      setProyectosDesbloqueados(prev => prev.filter(id => id !== idProyecto));
    } else {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/proyectos/${idProyecto}/cambiar-status`, {
          method: 'PUT',
        });
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
    }
  };

  const handleCompletarTarea = async (id, idProyecto) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/tareas/${id}/cambiar-estatus-enproceso`, {
        method: 'PUT',
        headers: { 'Accept': 'application/json' },
      });

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
      <div className="container my-4">

        <h1 className="titulo-global">Proyectos finalizados</h1>

        {proyectosFiltrados.length > 0 && (
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
              const porcentajeCompletado = Math.round(((p.tareas_completadas || 0) / (p.total_tareas || 1)) * 100);
              const tareasPendientes = (p.total_tareas || 0) - (p.tareas_completadas || 0);

              return (
                <div key={p.id_proyecto} className="dp-card mb-4">

                  {/* Header con ícono, estatus y checkbox de proyecto */}
                  <div className="dp-card-header">
                    <div className="dp-estado-container">
                      <FaCheckCircle className="dp-icono-estado en-proceso" />
                      <span className={`dp-estatus-badge ${p.p_estatus?.toLowerCase().replace(' ', '-')}`}>
                        {p.p_estatus}
                      </span>
                    </div>

                    <div className="dp-checkbox-completar">
                      <input
                        type="checkbox"
                        id={`check-${p.id_proyecto}`}
                        checked={proyectosDesbloqueados.includes(p.id_proyecto)}
                        onChange={() => handleDesbloquearProyecto(p.id_proyecto)}
                      />
                      <label htmlFor={`check-${p.id_proyecto}`}>Desbloquear Proyecto</label>
                    </div>
                  </div>

                  <div className="dp-proyecto-nombre">{p.p_nombre}</div>

                  {/* Barra de progreso */}
                  <div className="dp-progress-container">
                    <div className="dp-progress-header">
                      <span>Progreso del proyecto</span>
                      <span className="porcentaje">{porcentajeCompletado}%</span>
                    </div>
                    <div className="dp-progress-bar">
                      <div className="dp-progress-fill" style={{ width: `${porcentajeCompletado}%` }}></div>
                    </div>
                    <div className="dp-progress-stats">
                      <span>{p.tareas_completadas || 0} completadas</span>
                      <span>{tareasPendientes} pendientes</span>
                    </div>
                  </div>

                  {/* Tareas: se muestran solo si el proyecto está desbloqueado */}
                  {proyectosDesbloqueados.includes(p.id_proyecto) && (
                    <div className="dp-tareas-lista mt-3">
                      {p.tareas.map(t => (
                        <div key={t.id_tarea} className="dp-tarea-item">
                          <span>{t.t_nombre}</span>
                          <input
                            type="checkbox"
                            checked={t.t_estatus === "En proceso"}
                            onChange={() => handleCompletarTarea(t.id_tarea, p.id_proyecto)}
                          />

                          {t.evidencias?.length > 0 && (
                            <button className="dp-btn-evidencias" onClick={() => handleVerEvidencias(t)}>
                              Ver Evidencias ({t.evidencias.length})
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="empty-state-global">
  <LuClock3 className="empty-icon-global" />
  <h3 className="empty-title-global">No hay proyectos finalizados</h3>
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

