import React, { useState, useEffect } from "react";
import "../css/DesbloquearProyectos.css";
import "../css/formulario.css";
import { FiX, FiChevronLeft, FiChevronRight, FiArchive, FiUnlock, FiCheck } from "react-icons/fi";
import { FaTasks, FaCalendarAlt, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import { useRolNavigation } from "./utils/navigation";

// --- FUNCIÓN AUXILIAR useDebounce (SOLUCIÓN AL PROBLEMA DE RENDIMIENTO) ---
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Establecer un temporizador (timeout) que actualizará el valor después de 'delay'
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el temporizador si el valor cambia (el usuario sigue escribiendo)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
// --- FIN FUNCIÓN AUXILIAR useDebounce ---

function DesbloquearProyectos() {
  const [busqueda, setBusqueda] = useState("");
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADO LOCAL PARA LA INTERFAZ ---
  const [proyectosExpandidos, setProyectosExpandidos] = useState([]); 
  const [tareasSeleccionadas, setTareasSeleccionadas] = useState({});

  // --- ESTADOS PARA EL MODAL DE CONFIRMACIÓN (NUEVO) ---
  const [modalConfirmacionOpen, setModalConfirmacionOpen] = useState(false);
  const [idProyectoAReactivar, setIdProyectoAReactivar] = useState(null);

  // --- FILTROS ---
  const [anio, setAnio] = useState("");
  const [mes, setMes] = useState("");

  const [searchTerm, setSearchTerm] = useState(""); // lo que se envía al fetch

  // Función que se llama cuando el usuario da clic al botón de buscar
  const handleBuscarClick = () => {
    setSearchTerm(busqueda); // actualiza el término de búsqueda que dispara el fetch
  };

  const debouncedBusqueda = useDebounce(busqueda, 500); // 500ms de retraso
  
  const navigate = useNavigate();

  // --- MODAL EVIDENCIAS ---
  const [modalVisible, setModalVisible] = useState(false);
  const [tareaActual, setTareaActual] = useState(null);
  const [evidencias, setEvidencias] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [imagenCargando, setImagenCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const { volverSegunRol } = useRolNavigation();
  const API_URL = import.meta.env.VITE_API_URL;
  const currentYear = new Date().getFullYear();
  const startYear = 2025; 
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);

  // --- LÓGICA DE PREDICCIÓN ---
  const esProyectoArchivado = (fechaFinProyecto) => {
    if (!fechaFinProyecto) return false;
    const fechaFin = new Date(fechaFinProyecto);
    const ahora = new Date();
    const mesInicioTrimestre = Math.floor(ahora.getMonth() / 3) * 3;
    const inicioTrimestre = new Date(ahora.getFullYear(), mesInicioTrimestre, 1);
    return fechaFin < inicioTrimestre;
  };

  useEffect(() => {
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    if (!usuario?.id_usuario) return;

    const obtenerProyectosCompletados = async () => {
        setLoading(true);
        const token = sessionStorage.getItem("jwt_token");

        try {
            let url;
            const usuarioIdQuery = `usuario_id=${usuario.id_usuario}`;

            if (anio || mes || searchTerm) {  // <-- usamos searchTerm
                url = `${API_URL}/api/proyectos/completados/buscar?${usuarioIdQuery}`;
                if (anio) url += `&anio=${anio}`;
                if (mes) url += `&mes=${mes}`;
                if (searchTerm) url += `&busqueda=${searchTerm}`;
            } else {
                url = `${API_URL}/api/proyectos/completados/recientes?${usuarioIdQuery}`;
            }

            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (res.status === 401) {
                sessionStorage.removeItem("jwt_token");
                navigate("/Login", { replace: true });
                return;
            }

            const data = await res.json();
            if (data.success) {
              setProyectos(data.proyectos);
            }
            else {
              setProyectos([]);
            }
        } catch (error) {
            console.error("Error al obtener proyectos:", error);
            setProyectos([]);
        } finally {
            setLoading(false);
        }
    };

    obtenerProyectosCompletados();
  }, [anio, mes, searchTerm, navigate]);


  // El filtrado en el frontend todavía es útil para una retroalimentación visual inmediata
  // mientras se escribe.
  const proyectosFiltrados = proyectos.filter(p =>
    p.p_nombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  
  // Condición para mostrar el loader
  const mostrarLoader = loading;


  // --- LÓGICA DE MANEJO DE ESTADO LOCAL (sin cambios) ---

  const handleExpandirProyecto = (idProyecto) => {
    if (!proyectosExpandidos.includes(idProyecto)) {
        setProyectosExpandidos(prev => [...prev, idProyecto]);
        setTareasSeleccionadas(prev => ({ ...prev, [idProyecto]: [] }));
    }
  };

  const handleCancelarReapertura = (idProyecto) => {
    setProyectosExpandidos(prev => prev.filter(id => id !== idProyecto));
    setTareasSeleccionadas(prev => {
        const newState = { ...prev };
        delete newState[idProyecto];
        return newState;
    });
  };

  const handleToggleTarea = (idProyecto, idTarea) => {
    setTareasSeleccionadas(prev => {
        const seleccionadasActuales = prev[idProyecto] || [];
        if (seleccionadasActuales.includes(idTarea)) {
            return { ...prev, [idProyecto]: seleccionadasActuales.filter(id => id !== idTarea) };
        } else {
            return { ...prev, [idProyecto]: [...seleccionadasActuales, idTarea] };
        }
    });
  };

  // -------------------------------------------------------------
  // --- PASO 1: ABRIR EL MODAL  ---
  // -------------------------------------------------------------
  const handlePedirConfirmacion = (idProyecto) => {
    setIdProyectoAReactivar(idProyecto);
    setModalConfirmacionOpen(true);
  };

  // -------------------------------------------------------------
  // --- PASO 2: EJECUTAR REACTIVACIÓN ---
  // -------------------------------------------------------------
  const ejecutarReactivacion = async () => {
    if (!idProyectoAReactivar) return; // Seguridad

    const token = sessionStorage.getItem("jwt_token");
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    
    // Obtenemos las tareas usando el ID guardado en el estado
    const tareasParaAbrir = tareasSeleccionadas[idProyectoAReactivar] || [];

    try {
        const res = await fetch(
  `${API_URL}/api/proyectos/${idProyectoAReactivar}/cambiar-status`,
  {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                usuario_id: usuario.id_usuario,
                tareas_ids: tareasParaAbrir 
            }) 
        });

        if (res.status === 401) {
            sessionStorage.removeItem("jwt_token");
            navigate("/Login", { replace: true });
            return;
        }

        const data = await res.json();

        if (data.success) {
            // Actualizar UI
            setProyectos(prev => prev.filter(p => p.id_proyecto !== idProyectoAReactivar));
            handleCancelarReapertura(idProyectoAReactivar);
            
            // CERRAR MODAL Y LIMPIAR
            setModalConfirmacionOpen(false);
            setIdProyectoAReactivar(null);
            
            // Opcional: Toast de éxito
            // alert("Proyecto reactivado correctamente."); 
        } else {
            alert("Error al reactivar: " + (data.mensaje || "Intente de nuevo"));
            setModalConfirmacionOpen(false); // Cerramos el modal incluso si falla para que pueda reintentar
        }

    } catch (error) {
        console.error("Error en reactivación:", error);
        alert("Error de conexión al reactivar el proyecto.");
        setModalConfirmacionOpen(false);
    }
  };


  // --- MANEJO DE IMÁGENES (sin cambios) ---
  const handleVerEvidencias = (tarea, fechaFinProyecto) => {
    setTareaActual(tarea);
    setEvidencias(tarea.evidencias || []);
    setIndiceActual(0);
    
    const esProyectoArchivado = (fechaFinProyecto) => {
      if (!fechaFinProyecto) return false;
      const fechaFin = new Date(fechaFinProyecto);
      const ahora = new Date();
      const mesInicioTrimestre = Math.floor(ahora.getMonth() / 3) * 3;
      const inicioTrimestre = new Date(ahora.getFullYear(), mesInicioTrimestre, 1);
      return fechaFin < inicioTrimestre;
    };
    
    const esAntiguo = esProyectoArchivado(fechaFinProyecto);
    if (esAntiguo) {
        setImagenCargando(false);
        setErrorCarga(true);
    } else {
        setImagenCargando(true);
        setErrorCarga(false);
    }
    setModalVisible(true);
  };

  const handleCerrarModal = () => {
    setModalVisible(false);
    setTareaActual(null);
    setEvidencias([]);
    setIndiceActual(0);
    setImagenCargando(false);
    setErrorCarga(false);
  };

  const handlePrev = () => {
    if (evidencias.length <= 1) return;
    if (!errorCarga) setImagenCargando(true);
    setIndiceActual(prev => (prev === 0 ? evidencias.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (evidencias.length <= 1) return;
    if (!errorCarga) setImagenCargando(true);
    setIndiceActual(prev => (prev === evidencias.length - 1 ? 0 : prev + 1));
  };

  const handleImageLoad = () => {
      setImagenCargando(false);
      setErrorCarga(false);
  };

  const handleImageError = () => {
    setImagenCargando(false);
    setErrorCarga(true);
  };

  const getStatusClass = (estatus) => {
    if (!estatus) return '';
    return estatus.toLowerCase().replace(/\s+/g, '-');
  };

  const limpiarFiltrosFecha = () => {
    setAnio("");
    setMes("");
    setBusqueda(""); 
    setSearchTerm(""); 
  };

  return (
    <Layout
      titulo="PROYECTOS FINALIZADOS"
      sidebar={<MenuDinamico activeRoute="modificar" />}
    >
      <div className="contenedor-global">

        {/* --- BARRA DE BÚSQUEDA Y FILTROS --- */}
        {/* Muestra la barra si hay proyectos O si la búsqueda/filtros están activos */}
        {(proyectos.length > 0 || anio !== "" || mes !== "" || searchTerm !== "") && (
          <div className="barra-busqueda-dp-container mb-4">
            <p className="subtitulo-global">Gestiona y reactiva proyectos finalizados e históricos</p>
            
            <div className="barra-busqueda-dp-wrapper" >
              <div className="barra-filtros-fecha" >
                <select 
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                  className="barra-busqueda-dp-select"
                >
                  <option value="">Año</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select 
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="barra-busqueda-dp-select mes"
                >
                  <option value="">Mes</option>
                  <option value="01">Enero</option>
                  <option value="02">Febrero</option>
                  <option value="03">Marzo</option>
                  <option value="04">Abril</option>
                  <option value="05">Mayo</option>
                  <option value="06">Junio</option>
                  <option value="07">Julio</option>
                  <option value="08">Agosto</option>
                  <option value="09">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>
                {(anio || mes) && (
                 <button onClick={limpiarFiltrosFecha} className="btn-limpiar-filtros" title="Limpiar">
                   <FiX />
                 </button>
               )}
              </div>

            
             <div className="barra-buscador-texto">
    {/* ⬅️ AÑADE ESTE ÍCONO DE LUPA DECORATIVO */}
    <span className="barra-busqueda-dp-icon">
        <FaSearch /> 
    </span>
    {/* ------------------------------------------- */}
    <input
        type="text"
        placeholder="Buscar proyectos..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="barra-busqueda-dp-input"
    />
    {busqueda && (
        <button className="buscador-clear-dp" onClick={() => {
            setBusqueda("");
            setSearchTerm("");
        }}>
            <FiX />
        </button>
    )}
</div>
<button className="dp-btn-buscar" onClick={handleBuscarClick}>
    <FaSearch />
    <span>Buscar</span> 
</button>
                
              </div>
            </div>

       
        )}

        <div className="dp-lista">
          {mostrarLoader ? ( 
            <div className="loader-container">
              <div className="loader-logo"><img src={logo3} alt="Cargando" /></div>
              <div className="loader-texto">CARGANDO...</div>
              <div className="loader-spinner"></div>
            </div>
          ) : proyectos.length > 0 ? (
            
            proyectosFiltrados.map(p => {
              const estaExpandido = proyectosExpandidos.includes(p.id_proyecto);
              const tareasMarcadas = tareasSeleccionadas[p.id_proyecto] || [];

              return (
                <div key={p.id_proyecto} className={`dp-card ${estaExpandido ? 'dp-card-desbloqueado' : ''}`}>
                
                  <div className="dp-card-header">
                    <div className="dp-proyecto-info">
                      <h3 className="dp-proyecto-nombre">{p.p_nombre}</h3>
                      <div className="dp-proyecto-meta">
                        <div className="dp-tareas-count">
                          <FaTasks className="dp-tareas-icon" />
                          {p.tareas_completadas || 0} / {p.total_tareas || 0} tareas
                        </div>
                        <div className="dp-tareas-count">
                            <FaCalendarAlt className="dp-tareas-icon" />
                            {p.pf_fin && (
                                <span>Finalizó: {new Date(p.pf_fin).toLocaleDateString()}</span>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="dp-estado-container">
                      <div className={`dp-status-badge ${estaExpandido ? 'dp-status-desbloqueado' : 'dp-status-bloqueado'}`}>
                        {estaExpandido ? (
                          <> <FiUnlock className="dp-status-icon" /> <span>EN REVISIÓN</span> </>
                        ) : (
                          <> <FiArchive className="dp-status-icon" /> <span>ARCHIVADO</span> </>
                        )}
                      </div>
                    </div>
                  </div>

                  {estaExpandido ? (
                  
                  <div className="dp-tareas-section">
                    <div className="dp-tareas-header">
                      <h4 className="dp-tareas-titulo">Tareas para reabrir</h4>
                      <span className="dp-tareas-subtitulo">
                        Marca las tareas que deseas reactivar. Si no marcas ninguna, solo se abrirá el proyecto.
                      </span>
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
                                <button className="dp-btn-evidencias" onClick={() => handleVerEvidencias(t, p.pf_fin)}>
                                  Ver Evidencias ({t.evidencias.length})
                                </button>
                              )}
                              
                              <label className="dp-checkbox-container">
                                <input
                                  type="checkbox"
                                  checked={tareasMarcadas.includes(t.id_tarea)}
                                  onChange={() => handleToggleTarea(p.id_proyecto, t.id_tarea)}
                                />
                                <span className="dp-checkbox-checkmark"></span>
                                <span className="dp-checkbox-label">
                                  {tareasMarcadas.includes(t.id_tarea) ? "Reactivar" : "Mantener Finalizada"}
                                </span>
                              </label>

                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                 
<div className="dp-accion-container">
    <button 
        className="dp-btn-accion-secundaria"
        onClick={() => handleCancelarReapertura(p.id_proyecto)}
    >
            <FiX /> CANCELAR
    </button>

    <button 
        className="dp-btn-accion-principal dp-btn-desbloqueado"
        onClick={() => handlePedirConfirmacion(p.id_proyecto)}
    >
            <FiCheck className="dp-btn-icon" /> CONFIRMAR REACTIVACIÓN
    </button>
</div>
                    
                  </div>
                  ) : (
                    <div className="dp-accion-container">
                        <button 
                          className="dp-btn-accion-principal dp-btn-bloqueado"
                          onClick={() => handleExpandirProyecto(p.id_proyecto)}
                        >
                           <FiUnlock className="dp-btn-icon" /> REABRIR PROYECTO
                        </button>
                    </div>
                  )}
                  
                </div>
              );
            })
          ) : (searchTerm !== "" || anio !== "" || mes !== "") ? (
           
              <div style={{ textAlign: 'center', marginTop: '40px', width: '100%' }}>
                 <div className="buscador-dp-resultados-info">
                    No se encontraron proyectos que coincidan con los criterios seleccionados.
                 </div>
              </div>
          ) : (
           
             <EmptyState
                titulo="LISTA DE PROYECTOS"
                mensaje="Actualmente no tienes proyectos finalizados."
                botonTexto="Volver al Tablero"
                onVolver={volverSegunRol} 
                icono={logo3}
             />        
          )}
        </div>
      </div>

{modalVisible && tareaActual && (
  <div className="dp-modal">
    <div className="dp-modal-content">
      
      <div className="dp-modal-header">

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <h3 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tareaActual.t_nombre}
          </h3>
        </div>

        <button className="dp-modal-cerrar" onClick={handleCerrarModal}>
          <FiX />
        </button>
      </div>

      {evidencias.length > 0 ? (
        <div className="dp-evidencias-container">
          <div className="dp-evidencias-navegacion">
            
            {evidencias.length > 1 && (
              <button className="dp-btn-navegacion dp-btn-prev" onClick={handlePrev}>
                <FiChevronLeft size={24} />
              </button>
            )}
            <div className="dp-imagen-container">
              {errorCarga ? (
                 <div className="dp-error-placeholder">
                    <FiArchive size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                    <h4>Evidencia Archivada</h4>
                 </div>
              ) : (
                <>
                  {imagenCargando && <div className="dp-imagen-cargando"></div>}
                  <img
                    src={`${API_URL}/storage/${evidencias[indiceActual].ruta_archivo}`}
                    alt="Evidencia"
                    className="dp-imagen-evidencia"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    style={{ display: imagenCargando ? 'none' : 'block' }}
                  />
                </>
              )}
            </div>
            {evidencias.length > 1 && (
              <button className="dp-btn-navegacion dp-btn-next" onClick={handleNext}>
                <FiChevronRight size={24} />
              </button>
            )}
          </div>

          <div className="dp-evidencias-info">
             {evidencias.length > 1 && (
               <span style={{fontWeight:'bold', marginRight:'10px'}}>
                 {indiceActual + 1} / {evidencias.length}
               </span>
             )}
             <span className="dp-tarea-fecha">Subido: {evidencias[indiceActual]?.created_at}</span>
          </div>

        </div>
      ) : (
        <div className="dp-sin-evidencias">No hay evidencias disponibles</div>
      )}
    </div>
  </div>
)}

      
      <ConfirmModal
        isOpen={modalConfirmacionOpen}
        title="Confirmar Reactivación"
        message={(() => {
            if (!idProyectoAReactivar) return "";
            
            const proyecto = proyectos.find(p => p.id_proyecto === idProyectoAReactivar);
            const nombre = proyecto ? proyecto.p_nombre : "el proyecto";
            
            const tareasMarcadas = tareasSeleccionadas[idProyectoAReactivar] || [];
            const numTareas = tareasMarcadas.length;

            if (numTareas > 0) {
            return `¿Estás seguro que deseas reactivar el proyecto "${nombre}" y ${numTareas} tarea(s) seleccionada(s)? Pasarán a estado 'En Proceso'.`;
            } else {
            return `¿Estás seguro que deseas reactivar el proyecto "${nombre}"? Solo el proyecto pasará a 'En Proceso', las tareas se mantendrán finalizadas.`;
            }
        })()}
        onConfirm={ejecutarReactivacion}
        onCancel={() => {
            setModalConfirmacionOpen(false);
            setIdProyectoAReactivar(null);
        }}
      />

    </Layout>
  );
}

export default DesbloquearProyectos;