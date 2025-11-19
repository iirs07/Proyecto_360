import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { LuClock3 } from "react-icons/lu";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "../css/VerTareasPendientes.css";
import logo3 from "../imagenes/logo3.png"; 
import { FiCheck } from "react-icons/fi";

function VerTareasPendientes() {
  const [tareaCompletada, setTareaCompletada] = useState(false);

  const [proyecto, setProyecto] = useState(null);
  const [tareaActual, setTareaActual] = useState(null);
  const [evidencias, setEvidencias] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [indiceActual, setIndiceActual] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [imagenCargando, setImagenCargando] = useState(true);
  const [cargandoProyecto, setCargandoProyecto] = useState(true);
  const navigate = useNavigate();

  const obtenerProyectoActualizado = async () => {
  const proyectoGuardado = sessionStorage.getItem("proyectoSeleccionado");
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const token = localStorage.getItem("jwt_token"); // <-- obtenemos el token

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
            t_estatus: "Finalizada",
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
  ?.filter(t => t.t_estatus.toLowerCase() !== "finalizada")
  ?.filter(t => t.t_nombre.toLowerCase().includes(busqueda.toLowerCase()));


 const handleCompletarTarea = async (idTarea) => {
  if (!idTarea) return;

  const token = localStorage.getItem("jwt_token");
  if (!token) return alert("No hay token de autenticación, inicia sesión.");

  try {
    setCargando(true);

    const response = await fetch(
      `http://127.0.0.1:8000/api/proyectos/${proyecto.id_proyecto}/finalizar`,
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
            ? { ...tarea, t_estatus: "Finalizada" }
            : tarea
        );
        
        const proyectoActualizado = { ...prevProyecto, tareas: tareasActualizadas };
        
        sessionStorage.setItem("proyectoSeleccionado", JSON.stringify(proyectoActualizado));
        
        return proyectoActualizado;
      });
      
      handleCerrarModal();
      
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
        <h1 className="titulo-global">
          Tareas del proyecto: <span >{proyecto.p_nombre}</span>
        </h1>

        <div className="vtp-contenedor-buscador-y-tarjetas">
          <div className="vtp-lista-tareas">
            {tareasFiltradas?.length > 0 ? (
              tareasFiltradas.map(t => (
                <div key={t.id_tarea} className="vtp-item-tarea">
  {/* HEADER */}
  <div className="vtp-tarea-header">
    <div className="vtp-tarea-header-left">
      <LuClock3 className="vtp-icono-pendiente" />
      <span className="vtp-tarea-nombre">{t.t_nombre}</span>
    </div>
    {t.t_estatus !== "Finalizada" && (
      <label className="vtp-checkbox-completar">
        <input
          type="checkbox"
          onChange={() => handleCompletarTarea(t.id_tarea)}
          disabled={cargando}
        />
        Marcar como Finalizada
      </label>
    )}
  </div>

  {/* FOOTER */}
  <div className="vtp-tarea-footer">
    <span className={`vtp-tarea-estatus ${getStatusClass(t.t_estatus)}`}>
      {t.t_estatus}
    </span>
    <span className="vtp-tarea-fecha">Vence: {t.tf_fin || t.fechaVencimiento}</span>
    <button
      className="vtp-btn-evidencias"
      onClick={() => handleVerEvidencias(t)}
    >
      Ver Evidencias ({t.evidencias?.length || 0})
    </button>
  </div>
</div>

              ))
            ) : (
              <div className="vtp-no-tareas-mensaje">
                <LuClock3 style={{ fontSize: '3rem', color: '#861542', marginBottom: '15px' }} />
                <h3 style={{ color: '#861542', marginBottom: '10px' }}>
                  {busqueda ? 'No hay tareas que coincidan con la búsqueda' : 'No hay tareas pendientes'}
                </h3>
                <p style={{ color: '#6c757d' }}>
                  {busqueda
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Todas las tareas están completadas o no hay tareas asignadas'}
                </p>
              </div>
            )}
          </div>
        </div>

        {modalVisible && tareaActual && (
          <div className="vtp-modal">
            <div className="vtp-modal-content">
              <button className="vtp-modal-cerrar" onClick={handleCerrarModal}>
                <FiX />
              </button>
              
              <div className="vtp-modal-header">
                <h3>{tareaActual.t_nombre}</h3>
                <span className={`vtp-modal-estatus ${getStatusClass(tareaActual.t_estatus)}`}>
                  {tareaActual.t_estatus}
                </span>
              </div>

              {evidencias.length > 0 ? (
                <div className="vtp-evidencias-container">
                  <div className="vtp-evidencias-navegacion">
                    <div className="vtp-imagen-container">
                      {imagenCargando && <div className="vtp-imagen-cargando"></div>}
                      {console.log("URL de la evidencia:", evidencias[indiceActual].archivo_url)}
                      <img
  src={evidencias[indiceActual].archivo_url}
  alt={`Evidencia ${indiceActual + 1} de ${tareaActual.t_nombre}`}
  className="vtp-imagen-evidencia"
  onLoad={handleImageLoad}
  onError={handleImageError}
  style={{ display: imagenCargando ? 'none' : 'block' }}
/>

                    </div>

                    {evidencias.length > 1 && (
                      <>
                        <button className="vtp-btn-navegacion vtp-btn-prev" onClick={handlePrev}>
                          <FiChevronLeft size={28} />
                        </button>
                        <button className="vtp-btn-navegacion vtp-btn-next" onClick={handleNext}>
                          <FiChevronRight size={28} />
                        </button>
                      </>
                    )}
                  </div>

                  {evidencias.length > 1 && (
                    <div className="vtp-contador">
                      <span>{indiceActual + 1} / {evidencias.length}</span>
                    </div>
                  )}

                  <div className="vtp-evidencias-info">
                    <span className="vtp-tarea-fecha">
                      Subido: {evidencias[indiceActual]?.created_at || 'Fecha no disponible'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="vtp-sin-evidencias"></div>
              )}
            </div>
          </div>
        )}
        {tareaCompletada && (
  <div className="vtp-toast">
    <FiCheck style={{ marginRight: "8px" }} />
    Tarea completada correctamente
  </div>
)}


      </div>
  </Layout>
  );
}

export default VerTareasPendientes;