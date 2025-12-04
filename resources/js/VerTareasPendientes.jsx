import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LuClock3 } from "react-icons/lu";
import "../css/formulario.css";
import "../css/VerTareasPendientes.css";
import logo3 from "../imagenes/logo3.png"; 
import { FiX, FiCheck, FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ConfirmModal from "../components/ConfirmModal"; 

function VerTareasPendientes() {
  const [tareaCompletada, setTareaCompletada] = useState(false);

  const [proyecto, setProyecto] = useState(null);
  const [tareaActual, setTareaActual] = useState(null); 
  const [evidencias, setEvidencias] = useState([]);
  const [modalVisible, setModalVisible] = useState(false); 
  
  // 2. Estados para el Modal de Confirmación
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [tareaAFinalizar, setTareaAFinalizar] = useState(null); 

  const [indiceActual, setIndiceActual] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [imagenCargando, setImagenCargando] = useState(true);
  const [cargandoProyecto, setCargandoProyecto] = useState(true);
  const navigate = useNavigate();
  const { volverSegunRol } = useRolNavigation();

  const obtenerProyectoActualizado = async () => {
    const proyectoGuardado = sessionStorage.getItem("proyectoSeleccionado");
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    const token = sessionStorage.getItem("jwt_token"); 

    if (!proyectoGuardado || !usuario?.id_usuario) {
      return navigate("/tareas-en-proceso");
    }

    if (!token) {
      return alert("No hay token de autenticación, inicia sesión.");
    }

    try {
      setCargandoProyecto(true);
      const response = await fetch(
        `http://127.0.0.1:8000/api/tareas-proyectos-jefe?usuario=${usuario.id_usuario}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, 
          },
        }
      );

      const data = await response.json();
      console.log("Datos recibidos del backend:", data);

      if (data.success) {
        const proyectoSeleccionado = JSON.parse(proyectoGuardado);
        const proyectoCompleto = data.proyectos.find(
          p => p.id_proyecto === proyectoSeleccionado.id_proyecto
        );

        if (proyectoCompleto) {
          setProyecto(proyectoCompleto);
          sessionStorage.setItem("proyectoSeleccionado", JSON.stringify(proyectoCompleto));
        } else {
          const proyectoActualizado = {
            ...proyectoSeleccionado,
            tareas: (proyectoSeleccionado.tareas || []).map(t => ({
              ...t,
              t_estatus: "Completada",
            })),
          };
          setProyecto(proyectoActualizado);
          sessionStorage.setItem("proyectoSeleccionado", JSON.stringify(proyectoActualizado));
        }
      }
    } catch (error) {
      console.error("Error al obtener tareas:", error);
      const proyectoSeleccionado = JSON.parse(proyectoGuardado);
      setProyecto(proyectoSeleccionado);
    } finally {
      setCargandoProyecto(false);
    }
  };

  useEffect(() => {
    obtenerProyectoActualizado();
  }, [navigate]);

  if (cargandoProyecto) {
    return (
      <div className="container-fluid p-0 vtp-global">
        <div className="loader-container">
          <div className="loader-logo">
            <img src={logo3} alt="Cargando" />
          </div>
          <div className="loader-texto">CARGANDO...</div>
          <div className="loader-spinner"></div>
        </div>
      </div>
    );
  }

  const tareasFiltradas = proyecto?.tareas
    ?.filter(t => t.t_estatus.toLowerCase() !== "completada")
    ?.filter(t => t.t_nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const ejecutarFinalizacionTarea = async () => {
   
    const idTarea = tareaAFinalizar?.id_tarea; 
    if (!idTarea) return;

    const token = sessionStorage.getItem("jwt_token");
    if (!token) return alert("No hay token de autenticación, inicia sesión.");

    try {
      setCargando(true);

      const response = await fetch(`http://127.0.0.1:8000/api/tareas/${idTarea}/completar`, 
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json', 
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success || response.ok) {
        setProyecto(prevProyecto => {
          if (!prevProyecto?.tareas) return prevProyecto;
          
          const tareasActualizadas = prevProyecto.tareas.map(tarea =>
            tarea.id_tarea === idTarea 
              ? { ...tarea, t_estatus: "Completada" }
              : tarea
          );
          
          const proyectoActualizado = { ...prevProyecto, tareas: tareasActualizadas };
          
          sessionStorage.setItem("proyectoSeleccionado", JSON.stringify(proyectoActualizado));
          
          return proyectoActualizado;
        });
        
        // Cerramos el modal de confirmación y limpiamos
        setConfirmModalOpen(false);
        setTareaAFinalizar(null);
        setTareaCompletada(true);
         navigate("/TareasenProceso");
        setTimeout(() => setTareaCompletada(false), 3000); // Ocultar toast después
        
      } else {
        alert(`Error: ${data.mensaje || 'No se pudo completar la tarea'}`);
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
      alert('Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  // 4. Función para abrir el modal (se llama al dar click en el checkbox)
  const abrirModalConfirmacion = (tarea) => {
    setTareaAFinalizar(tarea);
    setConfirmModalOpen(true);
  };

  const handleVerEvidencias = (tarea) => {
    setTareaActual(tarea);
    setEvidencias(tarea.evidencias || []);
    console.log("Evidencias de la tarea:", tarea.evidencias);
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

  if (!proyecto) return null;

  return (
    <Layout
      titulo="TAREAS POR REVISAR"
      sidebar={<MenuDinamico activeRoute="enproceso" />}
    >
      <div className="contenedor-global">
        {/* TÍTULO DEL PROYECTO SOLO SI HAY TAREAS */}
        {tareasFiltradas?.length > 0 && (
          <div className="vtp-titulo-proyecto">
            <span className="vtp-label-proyecto">Proyecto</span>
            <h1 className="vtp-nombre-proyecto">{proyecto?.p_nombre}</h1>
          </div>
        )}

        <div className="vtp-lista-tareas">
          {tareasFiltradas?.length > 0 ? (
            tareasFiltradas.map(t => (
              <div key={t.id_tarea} className="vtp-item-tarea">
                {/* HEADER SIMPLE */}
                <div className="vtp-tarea-header">
                  <h3 className="vtp-tarea-nombre">{t.t_nombre}</h3>
                  <p className="vtp-tarea-descripcion">
                    {t.descripcion || "Sin descripción detallada para esta tarea."}
                  </p>
                </div>

                {/* ACCIONES */}
                <div className="vtp-acciones-tarea">
                  {t.t_estatus !== "Completada" && (
                    <div className="vtp-accion-finalizar">
                      <input
                        type="checkbox"
                        id={`check-${t.id_tarea}`}
                        
                        onChange={() => abrirModalConfirmacion(t)}
                        checked={false} // Mantener desmarcado visualmente hasta que se confirme y desaparezca de la lista
                        disabled={cargando}
                      />
                      <label htmlFor={`check-${t.id_tarea}`}>
                        Marcar como finalizada
                      </label>
                    </div>
                  )}
                </div>

                {/* FOOTER REDISEÑADO */}
                <div className="vtp-tarea-footer">
                  <div className="vtp-info-adicional">
                    <span className={`vtp-badge-estatus ${getStatusClass(t.t_estatus)}`}>
                      {t.t_estatus}
                    </span>

                    <span className="vtp-fecha-limpia">
                      <FiCalendar className="vtp-icono-fecha" /> 
                      Vence: {t.tf_fin || t.fechaVencimiento}
                    </span>
                  </div>

                  <button
                    className="vtp-btn-evidencias"
                    onClick={() => handleVerEvidencias(t)}
                  >
                    Ver Evidencias
                    <span className="vtp-contador-evidencias">
                      {t.evidencias?.length || 0}
                    </span>
                  </button>
                </div>
              </div>
            ))
          ) : busqueda ? (
            <div className="vtp-no-tareas-mensaje">
              <LuClock3
                style={{ fontSize: '3rem', color: '#861542', marginBottom: '15px' }}
              />
              <h3 style={{ color: '#861542', marginBottom: '10px' }}>
                No hay tareas que coincidan con la búsqueda
              </h3>
              <p style={{ color: '#6c757d' }}>
                Intenta con otros términos de búsqueda
              </p>
            </div>
          ) : (
            <EmptyState
              titulo="TAREAS POR REVISAR"
              mensaje="No hay tareas por revisar."
              botonTexto="Volver al Tablero"
              onVolver={volverSegunRol}
              icono={logo3}
            />
          )}
        </div>
      </div>

      {/* Modal de Evidencias (Interfaz VTP) */}
{modalVisible && tareaActual && (
  <div className="vtp-modal">
    <div className="vtp-modal-content">
      
      {/* HEADER MODIFICADO: Botón ahora está dentro para alineación */}
      <div className="vtp-modal-header">
        
        {/* Lado Izquierdo: Título y Estatus */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tareaActual.t_nombre}
          </h3>
          <span className={`vtp-modal-estatus ${getStatusClass(tareaActual.t_estatus)}`}>
            {tareaActual.t_estatus}
          </span>
        </div>

        {/* Lado Derecho: Botón Cerrar (Con estilo nuevo) */}
        <button className="vtp-modal-cerrar" onClick={handleCerrarModal}>
          <FiX />
        </button>
      </div>

      {/* BODY */}
      {evidencias.length > 0 ? (
        <div className="vtp-evidencias-container">
          <div className="vtp-evidencias-navegacion">
            
            {/* Botón Anterior */}
            {evidencias.length > 1 && (
              <button className="vtp-btn-navegacion vtp-btn-prev" onClick={handlePrev}>
                <FiChevronLeft size={24} />
              </button>
            )}

            {/* Imagen Container */}
            <div className="vtp-imagen-container">
              {imagenCargando && <div className="vtp-imagen-cargando"></div>}
              <img
                src={evidencias[indiceActual].archivo_url}
                alt={`Evidencia ${indiceActual + 1} de ${tareaActual.t_nombre}`}
                className="vtp-imagen-evidencia"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ display: imagenCargando ? 'none' : 'block' }}
              />
            </div>

            {/* Botón Siguiente */}
            {evidencias.length > 1 && (
              <button className="vtp-btn-navegacion vtp-btn-next" onClick={handleNext}>
                <FiChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Footer Info Unificado */}
          <div className="vtp-evidencias-info">
             {evidencias.length > 1 && (
               <span style={{fontWeight:'bold', marginRight:'10px'}}>
                 {indiceActual + 1} / {evidencias.length}
               </span>
             )}
             <span className="vtp-tarea-fecha">
               Subido: {evidencias[indiceActual]?.created_at || 'Fecha no disponible'}
             </span>
          </div>

        </div>
      ) : (
        <div className="vtp-sin-evidencias">No hay evidencias disponibles</div>
      )}
    </div>
  </div>
)}

      {/* 6. Modal de Confirmación para Finalizar Tarea (Nuevo) */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        title="Confirmar"
        message={`¿Estás seguro que deseas marcar como finalizada la tarea "${tareaAFinalizar?.t_nombre}"?`}
        onConfirm={ejecutarFinalizacionTarea}
        onCancel={() => {
          setConfirmModalOpen(false);
          setTareaAFinalizar(null);
        }}
      />


    </Layout>
  );
}

export default VerTareasPendientes;