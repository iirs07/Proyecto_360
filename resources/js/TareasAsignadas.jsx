import React, { useState, useEffect, useRef, useCallback } from "react"; 
import { FaBars, FaUpload, FaClock, FaExclamationTriangle, FaFileAlt, FaCalendarDay, FaAngleDown } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { FaClipboardCheck } from "react-icons/fa";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/formulario.css";
import "../css/TareasAsignadas.css"; 
import SelectDinamico from "../components/SelectDinamico";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import { useAutoRefresh } from "../hooks/useAutoRefresh"; 

function TareasAsignadas() {
  const [subiendo, setSubiendo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tareas, setTareas] = useState([]);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [tareaActual, setTareaActual] = useState(null);
  const [proyectoActual, setProyectoActual] = useState(null);
  const [nombreProyecto, setNombreProyecto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [open, setOpen] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  
  const refs = useRef({});
  const navigate = useNavigate();
  const location = useLocation(); 

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  // Efecto para verificar sesión y obtener datos del location
  useEffect(() => {
    const token = sessionStorage.getItem("jwt_token");
    
    if (!token) {
      navigate("/Login", { replace: true });
      return;
    }
    if (location.state && location.state.id_proyecto) {
      setProyectoActual({ id_proyecto: location.state.id_proyecto });
      setNombreProyecto(location.state.nombre_proyecto || "Proyecto");

    } else {
      navigate("/ListaDeProyectos", { replace: true });
    }
  }, [navigate, location]); 


  // 3. Refactorizamos fetchTareas con useCallback e isBackground
  const fetchTareas = useCallback(async (isBackground = false) => {
    const token = sessionStorage.getItem("jwt_token");
    const usuarioString = sessionStorage.getItem("usuario");
    
    if (!token || !usuarioString || !proyectoActual) return;

    const usuario = JSON.parse(usuarioString);

    try {
      // Solo mostramos el spinner si NO es background (carga inicial o manual)
      if (!isBackground) {
        setLoading(true);
      }

      const res = await fetch(
        `${API_URL}/api/tareas/${proyectoActual.id_proyecto}/usuario/${usuario.id_usuario}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );

      if (res.status === 401) {
        sessionStorage.removeItem("jwt_token");
        sessionStorage.removeItem("usuario");
        navigate("/Login", { replace: true });
        return;
      }

      const data = await res.json();
      if (data.success) {
        // console.log("RESPUESTA BACKEND:", data); // Comentado para limpiar consola
        setTareas(data.tareas);
      }
    } catch (err) {
      console.error("Error al cargar tareas:", err);
    } finally {
      // Solo quitamos el spinner si lo habíamos puesto
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, [API_URL, proyectoActual, navigate]); // Dependencias importantes

  
  // 4. Efecto para Carga Inicial (con Spinner)
  useEffect(() => {
    if (proyectoActual) {
      fetchTareas(false); 
    }
  }, [proyectoActual, fetchTareas]);

  // 5. Hook de Auto Refresco (Silencioso)
  useAutoRefresh(() => {
    if (proyectoActual) {
      fetchTareas(true);
    }
  }, 5000);


 const getUrgenciaTarea = (fechaFin) => {
  const ahora = new Date();
  const [año, mes, dia] = fechaFin.split('-');
  const fin = new Date(año, mes - 1, dia, 23, 59, 59);

  if (fin < ahora) return { nivel: "vencida", icono: <FaExclamationTriangle />, texto: "Vencida" };
  const finHoy = new Date(año, mes - 1, dia, 23, 59, 59);
  if (ahora <= finHoy && ahora >= new Date(año, mes - 1, dia, 0, 0, 0)) {
    return { nivel: "venceHoy", icono: <FaClock />, texto: "Vence hoy" };
  }

  return { nivel: "proxima", icono: <FaClock />, texto: "Próxima a vencer" };
};


  const getEstadoTarea = (estatus) => {
    switch (estatus) {
      case "En proceso": return { clase: "en-proceso", icono: <FaClock />, texto: "En Proceso" };
      default: return { clase: "completada", icono: <FaFileAlt />, texto: estatus };
    }
  };

  const handleClickArchivo = (id) => {
    setTareaActual(id);
    if (!refs.current[id]) refs.current[id] = React.createRef();
    refs.current[id].current.click();
  };

  const handleArchivoChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Solo se permiten archivos de imagen");

    setArchivoSeleccionado({ file, url: URL.createObjectURL(file), tipo: file.type });
  };

  const handleCancelar = () => {
    setArchivoSeleccionado(null);
    setTareaActual(null);
    Object.keys(refs.current).forEach(key => {
      if (refs.current[key]?.current) refs.current[key].current.value = "";
    });
  };

  const handleUpload = async () => {
    if (!archivoSeleccionado || !proyectoActual) return;

    const token = sessionStorage.getItem("jwt_token") ;
    const usuario = JSON.parse(sessionStorage.getItem("usuario") );
    
    if (!token || !usuario) return alert("Sesión expirada");

    const formData = new FormData();
    formData.append("id_proyecto", proyectoActual.id_proyecto);
    formData.append("id_tarea", tareaActual);
    formData.append("id_departamento", usuario.id_departamento);
    formData.append("id_usuario", usuario.id_usuario);
    formData.append("ruta_archivo", archivoSeleccionado.file);

    try {
      setSubiendo(true);
      const res = await fetch(`${API_URL}/api/evidencias`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        handleCancelar();    
        // Aquí dejamos el fetch normal (con loading) o background según prefieras. 
        // Normalmente tras una acción del usuario está bien ver que se actualiza.
        await fetchTareas(false); 
      } else {
        alert(`Error al subir el archivo: ${data?.error || data?.message || "Intente nuevamente"}`);
      }
    } catch (error) {
      alert("Error de conexión. Verifique su internet.");
    } finally {
      setSubiendo(false);
    }
  };


  const tareasFiltradas = tareas.filter(tarea => {
    const urgencia = getUrgenciaTarea(tarea.tf_fin);
    if (filtroEstado === "todas") return true;
    if (filtroEstado === "vencidas") return urgencia.nivel === "vencida";
    if (filtroEstado === "urgentes") return urgencia.nivel === "venceHoy";
    if (filtroEstado === "proximas") return urgencia.nivel === "proxima";
    return true;
  });

  const tareaSeleccionada = tareas.find(t => t.id_tarea === tareaActual);

  const renderContenido = () => {
    if (loading) return (
      <div className="loader-container">
        <div className="loader-logo"><img src={logo3} alt="Cargando proyectos" /></div>
        <div className="loader-texto">CARGANDO...</div>
        <div className="loader-spinner"></div>
      </div>
    );
    if (!proyectoActual) return null;

    if (tareasFiltradas.length === 0) return (
      <div className="tu-empty-state">
        <FaFileAlt className="tu-empty-icon" />
        <h3 className="tu-empty-title">
          {filtroEstado === "todas" ? "No hay tareas asignadas" : `No hay tareas ${filtroEstado.toLowerCase()}`}
        </h3>
        <p className="tu-empty-message">
          {filtroEstado === "todas" ? "No tienes tareas asignadas en este proyecto." : "No hay tareas con este estado en el proyecto."}
        </p>
      </div>
    );

    return (
      <div className="tu-tareas-contenedor">
        <div className="tu-tareas-lista">
          {tareasFiltradas.map((tarea) => {
            const urgencia = getUrgenciaTarea(tarea.tf_fin);
            const estado = getEstadoTarea(tarea.t_estatus);
            return (
              <div key={tarea.id_tarea} className={`tu-tarea-card ${tarea.t_estatus.toLowerCase().replace(' ', '-')} ${urgencia.nivel === "vencida" ? "tarea-vencida" : ""}`}>
                <div className="tu-tarea-header">
                  <div className="tu-tarea-titulo-container">
                    <h3 className="tu-tarea-nombre">{tarea.t_nombre}</h3>
                      {tarea.descripcion && (
                    <div className="tu-detalle-item">
                      <span className="tu-detalle-descripcion"> {tarea.descripcion}</span>
                    </div>
                  )}
                    <div className="tu-tarea-badges">
                      <span className={`tu-badge-estado ${estado.clase}`}>{estado.icono}{estado.texto}</span>
                      <span className={`tu-badge-urgencia ${urgencia.nivel}`}>{urgencia.icono}{urgencia.texto}</span>
                    </div>
                  </div>
                  <button className="tu-btn-subir-evidencia" onClick={() => handleClickArchivo(tarea.id_tarea)} title="Subir evidencia">
                    <FaUpload className="tu-btn-icon" /> Subir
                  </button>
                </div>
                <div className="tu-tarea-detalles">
                  <div className="tu-detalle-item">
                    <FaCalendarDay className="tu-detalle-icon" />
                   {(() => {
  const [año, mes, dia] = tarea.tf_fin.split('-');
  const fin = new Date(año, mes-1, dia); 
  return <span className="tu-detalle-texto">Vence: <strong>{fin.toLocaleDateString('es-ES')}</strong></span>;
})()}
                  </div>
                  <div className="tu-detalle-item">
                    <FaFileAlt className="tu-detalle-icon" />
                    <span className="tu-detalle-texto">Evidencias: <strong>{tarea.evidencias_count || 0}</strong></span>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={(el) => (refs.current[tarea.id_tarea] = { current: el })}
                  style={{ display: "none" }} 
                  onChange={handleArchivoChange} 
                  accept=".jpg,.jpeg,.png"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
     <Layout
       titulo="TAREAS ASIGNADAS"
       sidebar={<MenuDinamico activeRoute="tareas-asignadas" />}
     >
    
<div className="tu-banner-container">
  <div className="tu-banner-icon-bg">
    <FaClipboardCheck />
  </div>

  <div className="container"> 
    <div className="tu-banner-content">
      

      <div className="tu-titulo-wrapper">
        <h1 className="tu-banner-titulo">{nombreProyecto}</h1>
      
      </div>

      <p className="tu-banner-subtitulo">
        Panel de seguimiento y entrega de evidencias
      </p>
    </div>
  </div>
</div>
       <div className="container my-4">
      
         <div className="row justify-content-center">
           <div className="col-12 col-lg-10 col-xl-8">
            
            <div className="tu-filtros-container">
              <div className="tu-filtros-inner">
                <div className="tu-filtro-left">
                  <label className="select-etiqueta-inline">Filtrar por estado:</label>
                  <div className="tu-filtro-group">
                    <SelectDinamico
                      opciones={["Todas las tareas", "Retrasadas", "Urgentes (vence hoy)", "Próximas"]}
                      valor={filtroEstado === "todas" ? "Todas las tareas" :
                             filtroEstado === "vencidas" ? "Retrasadas" :
                             filtroEstado === "urgentes" ? "Urgentes (vence hoy)" : "Próximas"}
                      setValor={(valor) => {
                        if (valor === "Todas las tareas") setFiltroEstado("todas");
                        else if (valor === "Retrasadas") setFiltroEstado("vencidas");
                        else if (valor === "Urgentes (vence hoy)") setFiltroEstado("urgentes");
                        else setFiltroEstado("proximas");
                      }}
                    />
                  </div>
                </div>

                <div className="tu-tareas-stats">
                  <span className="tu-stat-total">Total: {tareasFiltradas.length}</span>
                </div>
              </div>
            </div>

             {renderContenido()}
           </div>
         </div>
       </div>

      {archivoSeleccionado && tareaSeleccionada && (
        <div className="tu-modal-preview">
          <div className="tu-modal-content-preview">
            <div className="tu-modal-header">
              <h2>Evidencia de: {tareaSeleccionada.t_nombre}</h2> 

              <button 
                className="tu-modal-close" 
                onClick={!subiendo ? handleCancelar : undefined}
                disabled={subiendo}
              >
                &times;
              </button>
            </div>

            <div className="tu-modal-body">
              <img 
                src={archivoSeleccionado.url} 
                alt={`Evidencia de ${tareaSeleccionada.t_nombre}`} 
              />
            </div>

            <div className="tu-modal-description">
              {archivoSeleccionado.file.name} - Vista previa del archivo seleccionado.
            </div>

            <div className="tu-modal-footer">

              <button 
                className="tu-btn-base tu-btn-cancelar" 
                onClick={!subiendo ? handleCancelar : undefined}
                disabled={subiendo}
              >
                Cancelar
              </button>

              <button 
                className="tu-btn-base tu-btn-subir" 
                onClick={handleUpload} 
                disabled={subiendo}
              >
                {subiendo ? (
                  <>
                    <span 
                      className="spinner-border spinner-border-sm me-2" 
                      role="status" 
                      aria-hidden="true"
                    ></span>
                    Subiendo...
                  </>
                ) : "Subir"}
              </button>

            </div>
          </div>
        </div>
      )}

    </Layout>  
  );
}

export default TareasAsignadas;