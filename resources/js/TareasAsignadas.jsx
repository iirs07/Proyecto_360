import React, { useState, useEffect, useRef } from "react";
import { FaBars, FaUpload, FaClock, FaExclamationTriangle, FaFileAlt, FaCalendarDay, FaAngleDown } from "react-icons/fa";
// IMPORTANTE: Agregamos useLocation
import { useNavigate, useLocation } from "react-router-dom";
import logo3 from "../imagenes/logo3.png";
import "../css/global.css";
import "../css/formulario.css";
import "../css/TareasAsignadas.css"; 
import SelectDinamico from "../components/SelectDinamico";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";

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
  
  const refs = useRef({});
  const navigate = useNavigate();
  const location = useLocation(); // Hook para recibir los datos

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  // ---------------------------------------------------------
  // VALIDACIÓN DE ACCESO Y CONFIGURACIÓN INICIAL
  // ---------------------------------------------------------
  useEffect(() => {
    // 1. Verificamos Autenticación (Token)
    // Buscamos en ambos storages por seguridad, priorizando sessionStorage como usas
    const token = sessionStorage.getItem("jwt_token");
    
    if (!token) {
      navigate("/Login", { replace: true });
      return;
    }

    // 2. Verificamos Origen (Datos del Proyecto)
    // location.state trae los datos enviados por navigate desde la lista.
    // Si entran por URL directa, location.state es null.
    if (location.state && location.state.id_proyecto) {
      
      // Acceso Permitido: Cargamos los datos del estado
      setProyectoActual({ id_proyecto: location.state.id_proyecto });
      setNombreProyecto(location.state.nombre_proyecto || "Proyecto");

    } else {
      navigate("/ListaDeProyectos", { replace: true });
    
    }
  }, [navigate, location]); 
  // ---------------------------------------------------------


  const fetchTareas = async () => {
    const token = sessionStorage.getItem("jwt_token");
    const usuarioString = sessionStorage.getItem("usuario");
    
    // Si falta algo esencial, no hacemos el fetch (la redirección del otro useEffect se encargará)
    if (!token || !usuarioString || !proyectoActual) return;

    const usuario = JSON.parse(usuarioString);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/tareas/${proyectoActual.id_proyecto}/usuario/${usuario.id_usuario}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );

      if (res.status === 401) {
        sessionStorage.removeItem("jwt_token");
        sessionStorage.removeItem("usuario");
        navigate("/Login", { replace: true });
        return;
      }

      const data = await res.json();
      if (data.success) setTareas(data.tareas);
    } catch (err) {
      console.error("Error al cargar tareas:", err);
    }
  };

  // Este efecto reacciona cuando "proyectoActual" se establece exitosamente en el primer useEffect
  useEffect(() => {
    if (proyectoActual) {
      setLoading(true);
      fetchTareas().finally(() => setLoading(false));
    }
  }, [proyectoActual]);


  const getUrgenciaTarea = (fechaFin) => {
    const ahora = new Date();
    const fin = new Date(fechaFin);

    if (fin < ahora) return { nivel: "vencida", icono: <FaExclamationTriangle />, texto: "Vencida" };
    if (fin.toDateString() === ahora.toDateString()) return { nivel: "venceHoy", icono: <FaClock />, texto: "Vence hoy" };
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
      const res = await fetch("http://127.0.0.1:8000/api/evidencias", {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        handleCancelar();    
        await fetchTareas();  // Recarga tareas
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

    // Si no hay proyecto (está redirigiendo o falló), no mostramos nada
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
                    <span className="tu-detalle-texto">Vence: <strong>{new Date(tarea.tf_fin).toLocaleDateString('es-ES')}</strong></span>
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
       <div className="container my-4">
         <div className="row justify-content-center">
           <div className="col-12 col-lg-10 col-xl-8">
             <div className="tu-proyecto-header-section"><h1 className="titulo-global">{nombreProyecto}</h1></div>
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
