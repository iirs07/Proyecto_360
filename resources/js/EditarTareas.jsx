import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker, { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
// IMPORTACIONES DE ESTILOS Y COMPONENTES
import "../css/agregartareas.css";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import ErrorMensaje from "../components/ErrorMensaje";
import { useRolNavigation } from "./utils/navigation";

// IMPORTACIONES DE ICONOS
import { FaCalendarAlt, FaUser, FaUsers, FaFileAlt, FaSave, FaTimes, FaRegClock } from "react-icons/fa";
import logo3 from "../imagenes/logo3.png";

registerLocale("es", es);

// =======================================================
// COPIA: Componente para el botón de calendario
// =======================================================
const CalendarButton = React.forwardRef(({ value, onClick }, ref) => (
  <button
    type="button"
    className="btn-calendario nv-btn-calendario w-100 d-flex align-items-center gap-2"
    onClick={onClick}
    ref={ref}
  >
    <FaCalendarAlt className={!value ? "text" : ""} />
    <span className={!value ? "text" : ""}>{value || "Seleccionar fecha"}</span>
  </button>
));

// =======================================================
// COPIA: Componente TaskCard
// =======================================================
const TaskCard = ({ children, title, icon, className = "" }) => (
  <div className={`agregartareas-task-card ${className}`}>
    {title && (
      <div className="d-flex align-items-center gap-2 mb-3">
        {icon}
        <h3 className="task-card-title mb-0">{title}</h3>
      </div>
    )}
    {children}
  </div>
);

// =======================================================
// COPIA: Componente EstadoGuardado (con ajuste de clases)
// =======================================================
const EstadoGuardado = ({ tipo }) => (
  <div className={`alert d-flex align-items-center gap-2 mb-4 ${tipo === 'guardado' ? 'alert-success' : 'alert-warning'}`} role="alert">
    <FaSave />
    <div>
      {tipo === 'guardado' ? 
        '¡Cambios guardados exitosamente!' : 
        'Hay cambios sin guardar. ¡Modifica y presiona Guardar!'}
    </div>
  </div>
);

function EditarTareas() {
  const location = useLocation();
  const navigate = useNavigate();
  const tareaState = location.state?.tarea || {};
  const tareaId = tareaState.id_tarea;
  const { volverSegunRol } = useRolNavigation();
const API_URL = import.meta.env.VITE_API_URL;
  const [camposModificados, setCamposModificados] = useState({});
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [mostrarEstado, setMostrarEstado] = useState(false);
  
  const nombreTareaRef = useRef(null);
  const descripcionTareaRef = useRef(null);
  
  const ajustarAltura = (ref) => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  };
  
  // =======================================================
  // Funciones de manejo de estado
  // =======================================================
  const handleInputChange = (campo) => {
    setErrores((prev) => ({ ...prev, [campo]: "" }));
    setGuardadoExitoso(false);
    setCamposModificados(prev => ({ ...prev, [campo]: true }));
    setMostrarEstado(true);
  };
  
  const calcularDuracion = () => {
    if (fechaInicio && fechaFin) {
      const diffTime = Math.abs(fechaFin - fechaInicio);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1; 
    }
    return 0;
  };
  
  // =======================================================
  // Estados y Variables
  // =======================================================
  const minFecha = new Date();
  minFecha.setHours(0, 0, 0, 0);
  const maxFecha = new Date();
  maxFecha.setFullYear(maxFecha.getFullYear() + 1);
  
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [usuarioSeleccionadoInfo, setUsuarioSeleccionadoInfo] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [departamentos, setDepartamentos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [datosOriginales, setDatosOriginales] = useState(null);
  
  const token = sessionStorage.getItem("jwt_token");
  
  // =======================================================
  // EFECTOS
  // =======================================================

  // ===== FETCH DEPARTAMENTOS Y TAREA INICIAL (AJUSTADO PARA EL USUARIO) =====
  useEffect(() => {
    const fetchInicial = async () => {
      if (!tareaId) {
        setLoadingInicial(false);
        return;
      }
      
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
       const [depRes, tareaRes] = await Promise.all([
  axios.get(`${API_URL}/api/CatalogoDepartamentos`, { headers }), 
  axios.get(`${API_URL}/api/tareas/${tareaId}`, { headers })
]);

        
        // Cargar Departamentos
        const departamentosData = depRes.data;
        setDepartamentos(departamentosData.map(d => ({ id_departamento: d.id_departamento, d_nombre: d.d_nombre })));
        
        // Cargar Tarea
        if (tareaRes.data.success) {
          const t = tareaRes.data.tarea;
          const inicio = t.tf_inicio ? new Date(t.tf_inicio) : null;
          const fin = t.tf_fin ? new Date(t.tf_fin) : null;
          
          setNombre(t.t_nombre);
          setDescripcion(t.t_descripcion || t.descripcion || "");
          setFechaInicio(inicio);
          setFechaFin(fin);
          
          const depId = t.id_departamento || (t.usuario?.id_departamento) || "";
          const userId = t.id_usuario || (t.usuario?.id_usuario) || "";

          setDepartamentoSeleccionado(depId);
          setUsuarioSeleccionado(userId);

          // 🟢 AJUSTE CLAVE: Inicializar usuarioSeleccionadoInfo con los datos de la tarea si existen
          if (t.usuario) {
            setUsuarioSeleccionadoInfo({
              id_usuario: userId,
              // Usamos las claves que sabemos que devuelve la API: nombre, apaterno, amaterno
              nombre: t.usuario.nombre || t.usuario.u_nombre,
              apaterno: t.usuario.apaterno || t.usuario.a_paterno,
              amaterno: t.usuario.amaterno || t.usuario.a_materno,
            });
          }

          // Inicializar datos originales
          setDatosOriginales({
            nombre: t.t_nombre,
            descripcion: t.t_descripcion || t.descripcion || "",
            fechaInicio: inicio?.getTime() || null,
            fechaFin: fin?.getTime() || null,
            usuario: userId,
            departamento: depId
          });
        }
      } catch (err) {
        if (err.response?.status === 401) navigate("/login");
      } finally {
        setLoadingInicial(false);
      }
    };
    fetchInicial();
  }, [tareaId, token, navigate]);

  // ===== FETCH USUARIOS SEGÚN DEPARTAMENTO =====
  useEffect(() => {
    if (!departamentoSeleccionado) return;
    
    const fetchUsuarios = async () => {
      try {
        const res = await axios.get(
  `${API_URL}/api/departamentos/${departamentoSeleccionado}/usuarios`,
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

        
        const usuariosMapeados = res.data.map(u => ({
          id_usuario: u.id_usuario,
          // Unificación de claves para el renderizado consistente
          nombre: u.nombre || u.u_nombre, 
          apaterno: u.apellido_paterno || u.a_paterno || u.apaterno, 
          amaterno: u.apellido_materno || u.a_materno || u.amaterno
        }));
        
        setUsuarios(usuariosMapeados);
        
        // Limpiar selección de usuario si el departamento cambia y el usuario no pertenece
        if (datosOriginales && parseInt(departamentoSeleccionado) !== datosOriginales.departamento) {
          setUsuarioSeleccionado("");
        }

      } catch (err) {
        setUsuarios([]);
        setUsuarioSeleccionado("");
        if (err.response?.status === 401) navigate("/login");
      }
    };
    
    fetchUsuarios();
  }, [departamentoSeleccionado, token, navigate, datosOriginales]);


  // ===== ACTUALIZAR INFORMACIÓN DEL USUARIO SELECCIONADO =====
  useEffect(() => {
    if (usuarioSeleccionado && usuarios.length > 0) {
      const usuario = usuarios.find(u => u.id_usuario == usuarioSeleccionado);
      // Aseguramos que el objeto de información tenga las claves correctas para el renderizado
      if (usuario) {
          setUsuarioSeleccionadoInfo({
              id_usuario: usuario.id_usuario,
              nombre: usuario.nombre || usuario.u_nombre,
              apaterno: usuario.apaterno || usuario.a_paterno,
              amaterno: usuario.amaterno || usuario.a_materno,
          });
      } else {
        setUsuarioSeleccionadoInfo(null);
      }
    } else {
      setUsuarioSeleccionadoInfo(null);
    }
  }, [usuarioSeleccionado, usuarios]);


  // ===== DETECTAR CAMBIOS =====
  useEffect(() => {
    if (!datosOriginales) return;

    const cambios = {};
    if (nombre !== datosOriginales.nombre) cambios.nombre = true;
    if (descripcion !== datosOriginales.descripcion) cambios.descripcion = true;
    if (fechaInicio?.getTime() !== datosOriginales.fechaInicio) cambios.fechaInicio = true;
    if (fechaFin?.getTime() !== datosOriginales.fechaFin) cambios.fechaFin = true;
    if (parseInt(usuarioSeleccionado) !== datosOriginales.usuario) cambios.usuario = true;
    if (parseInt(departamentoSeleccionado) !== datosOriginales.departamento) cambios.departamento = true;

    setCamposModificados(cambios);
    setMostrarEstado(Object.keys(cambios).length > 0 || guardadoExitoso);
  }, [nombre, descripcion, fechaInicio, fechaFin, usuarioSeleccionado, departamentoSeleccionado, guardadoExitoso, datosOriginales]);

  // ===== PREVENIR CIERRE CON CAMBIOS =====
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (Object.keys(camposModificados).length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [camposModificados]);

  // ===== AJUSTAR ALTURA DE TEXTAREAS AL CARGAR =====
  useEffect(() => {
    ajustarAltura(nombreTareaRef);
    ajustarAltura(descripcionTareaRef);
  }, [nombre, descripcion]);

  // =======================================================
  // HANDLERS
  // =======================================================

  // ===== MODIFICAR TAREA =====
  const handleModificar = async () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const nuevosErrores = {};
    if (!nombre) nuevosErrores.nombre = "El nombre de la tarea es obligatorio.";
    if (!descripcion) nuevosErrores.descripcion = "La descripción es obligatoria.";
    if (!fechaInicio) nuevosErrores.inicio = "Selecciona la fecha de inicio.";
    else if (fechaInicio < hoy) nuevosErrores.inicio = "La fecha de inicio no puede ser anterior a hoy.";
    if (!fechaFin) nuevosErrores.fin = "Selecciona la fecha de fin.";
    else if (fechaInicio && fechaFin < fechaInicio) nuevosErrores.fin = "La fecha de fin no puede ser anterior a la fecha de inicio.";
    if (!usuarioSeleccionado) nuevosErrores.usuario = "Selecciona un usuario.";
    
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;
    
    try {
      setLoading(true);
      const tareaActualizada = {
        t_nombre: nombre,
        t_descripcion: descripcion,
        tf_inicio: fechaInicio.toISOString().split("T")[0],
        tf_fin: fechaFin.toISOString().split("T")[0],
        id_usuario: parseInt(usuarioSeleccionado),
        id_departamento: parseInt(departamentoSeleccionado),
      };
      
      const res = await axios.put(`/api/tareas/${tareaId}`, tareaActualizada, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.data.success) {
        const nuevosDatosOriginales = {
          nombre,
          descripcion,
          fechaInicio: fechaInicio ? fechaInicio.getTime() : null,
          fechaFin: fechaFin ? fechaFin.getTime() : null,
          usuario: parseInt(usuarioSeleccionado),
          departamento: parseInt(departamentoSeleccionado)
        };
        setDatosOriginales(nuevosDatosOriginales);
        setCamposModificados({});
        setGuardadoExitoso(true);
        
        setTimeout(() => {
          setGuardadoExitoso(false);
          setMostrarEstado(false);
        }, 3000);
      }
      
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelar = () => {
    if (Object.keys(camposModificados).length > 0) {
      const confirmar = window.confirm("Tienes cambios sin guardar. ¿Seguro que quieres cancelar?");
      if (!confirmar) return;
    }
    navigate(-1);
  };
  
  // =======================================================
  // LOADER
  // =======================================================
  if (loadingInicial) {
    return (
      <div className="loader-container">
        <div className="loader-logo">
          <img src={logo3} alt="Cargando" />
        </div>
        <div className="loader-texto">CARGANDO...</div>
        <div className="loader-spinner"></div>
      </div>
    );
  }
  
  // =======================================================
  // RENDER
  // =======================================================
  return (
    <Layout titulo="MODIFICAR TAREA" sidebar={<MenuDinamico activeRoute="Lista de Tareas" />}>
      <div className="agregartareas-contenedor">
        <div className="agregartareas-project-header d-flex align-items-center gap-3 mb-4 p-3 rounded">
          <div className="flex-grow-1">
            <h1 className="agregartareas-titulo mb-1">Modificar Tarea</h1>
            <div className="agregartareas-project-info d-flex flex-wrap gap-3 align-items-center">
              
            </div>
          </div>
        </div>
        
        {/* Mostrar estado de guardado o de cambios sin guardar */}
        {mostrarEstado && (
          <EstadoGuardado tipo={guardadoExitoso ? "guardado" : "no-guardado"} />
        )}
        
        <div className="agregartareas-form-content-panel p-4 rounded">
          
          {/* ======================================================= */}
          {/* TaskCard 1: Información de la Tarea */}
          {/* ======================================================= */}
          <TaskCard 
            title={<span className="agregartareas-task-card-title">Información de la Tarea</span>}
            icon={<FaFileAlt color="#861542" />} 
            className="mb-4"
          >
            {/* Nombre */}
            <div className="mb-4">
              <label htmlFor="nombreTarea" className="agregartareas-label d-flex align-items-center gap-2 mb-2">
                <span className="agregartareas-required-field">*</span>
                Nombre de la tarea
              </label>
              <textarea
                id="nombreTarea"
                ref={nombreTareaRef}
                className="form-control agregartareas-input"
                placeholder="Ingrese un nombre para la tarea"
                rows={1}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onInput={() => {
                  ajustarAltura(nombreTareaRef);
                  handleInputChange("nombre");
                }}
              />
              <ErrorMensaje mensaje={errores.nombre} />
            </div>
            
            {/* Descripción */}
            <div className="mb-0">
              <label htmlFor="descripcionTarea" className="agregartareas-label d-flex align-items-center gap-2 mb-2">
                <span className="agregartareas-required-field">*</span>
                Descripción detallada
              </label>
              <textarea
                id="descripcionTarea"
                ref={descripcionTareaRef}
                className="form-control agregartareas-input"
                placeholder="Describa la tarea"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                onInput={() => {
                  ajustarAltura(descripcionTareaRef);
                  handleInputChange("descripcion");
                }}
              />
              <ErrorMensaje mensaje={errores.descripcion} />
            </div>
          </TaskCard>
          
          
          {/* ======================================================= */}
          {/* TaskCard 2: Usuarios */}
          {/* ======================================================= */}
          <TaskCard 
            title={<span className="agregartareas-task-card-title">Usuarios</span>}
            icon={<FaUsers color="#861542" />} 
            className="mb-4"
          >
            <div className="row g-3">
              
              {/* Departamento */}
              <div className="col-12 mb-3">
                <label htmlFor="departamento" className="agregartareas-label d-flex align-items-center gap-2 mb-2">
                  <span className="agregartareas-required-field">*</span>
                  Departamento
                </label>
                <div className="input-group">
                  <span className="agregartareas-input-group-text bg-light">
                    <FaUsers />
                  </span>
                  <select
                    id="departamento"
                    value={departamentoSeleccionado}
                    onChange={(e) => {
                      setDepartamentoSeleccionado(parseInt(e.target.value));
                      handleInputChange("departamento");
                    }}
                    className="form-select"
                  >
                    <option value="">Seleccionar departamento</option>
                    {departamentos.map((d) => (
                      <option key={d.id_departamento} value={d.id_departamento}>
                        {d.d_nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Usuario asignado */}
              <div className="col-12 mb-3">
                <label htmlFor="usuario" className="agregartareas-label d-flex align-items-center gap-2 mb-2">
                  <span className="agregartareas-required-field">*</span>
                  Usuario asignado
                </label>
                <div className="input-group">
                  <span className="agregartareas-input-group-text bg-light">
                    <FaUser />
                  </span>
                  <select
                    id="usuario"
                    value={usuarioSeleccionado}
                    onChange={(e) => {
                      setUsuarioSeleccionado(e.target.value);
                      handleInputChange("usuario");
                    }}
                    className="form-select"
                  >
                    <option value="">Seleccionar usuario</option>
                    {usuarios.map((u) => (
                      <option key={u.id_usuario} value={u.id_usuario}>
                        {`${u.nombre} ${u.apaterno} ${u.amaterno}`
                          .split(" ")
                          .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
                          .join(" ")}
                      </option>
                    ))}
                  </select>
                </div>
                <ErrorMensaje mensaje={errores.usuario} />
              </div>
            </div>

            {/* Tarjeta de información del usuario */}
            {usuarioSeleccionadoInfo && (
              <div className="agregartareas-user-info-card p-3 mt-3 rounded mb-0">
                <div className="d-flex align-items-center gap-3">
                  <div className="agregartareas-user-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                    {usuarioSeleccionadoInfo.nombre?.charAt(0).toUpperCase()}
                    {usuarioSeleccionadoInfo.apaterno?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h6 className="mb-1">
                      {`${usuarioSeleccionadoInfo.nombre} ${usuarioSeleccionadoInfo.apaterno} ${usuarioSeleccionadoInfo.amaterno}`
                        .split(" ")
                        .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
                        .join(" ")}
                    </h6>
                    <p className="agregartareas-text-muted mb-0 small">Usuario asignado</p>
                  </div>
                </div>
              </div>
            )}
          </TaskCard>
          
          
          {/* ======================================================= */}
          {/* TaskCard 3: Cronograma */}
          {/* ======================================================= */}
          <TaskCard 
            title={<span className="agregartareas-task-card-title">Cronograma</span>}
            icon={<FaRegClock color="#861542" />} 
            className="mb-0"
          >
            <div className="row g-4">
              {/* Fecha de inicio */}
              <div className="col-12 col-md-6">
                <div className="agregartareas-fecha-container">
                  <label className="agregartareas-label d-flex align-items-center gap-2 mb-2">
                    <span className="agregartareas-required-field">*</span>
                    Fecha de inicio
                  </label>
                  <DatePicker
                    selected={fechaInicio}
                    onChange={(date) => {
                      setFechaInicio(date);
                      handleInputChange("inicio");
                    }}
                    dateFormat="dd/MM/yyyy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    locale="es"
                    minDate={minFecha}
                    maxDate={fechaFin || maxFecha}
                    customInput={<CalendarButton />}
                    className="w-100"
                  />
                  {fechaInicio && (
                    <small className="agregartareas-text-muted mt-1 d-block">
                      {fechaInicio.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </small>
                  )}
                  <ErrorMensaje mensaje={errores.inicio} />
                </div>
              </div>
              
              {/* Fecha de fin */}
              <div className="col-12 col-md-6">
                <div className="agregartareas-fecha-container">
                  <label className="agregartareas-label d-flex align-items-center gap-2 mb-2">
                    <span className="agregartareas-required-field">*</span>
                    Fecha de fin
                  </label>
                  <DatePicker
                    selected={fechaFin}
                    onChange={(date) => {
                      setFechaFin(date);
                      handleInputChange("fin");
                    }}
                    dateFormat="dd/MM/yyyy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    locale="es"
                    minDate={fechaInicio || minFecha}
                    maxDate={maxFecha}
                    customInput={<CalendarButton />}
                    className="w-100"
                  />
                  {fechaFin && (
                    <small className="agregartareas-text-muted mt-1 d-block">
                      {fechaFin.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </small>
                  )}
                  <ErrorMensaje mensaje={errores.fin} />
                </div>
              </div>
            </div>

            {/* Indicador de duración */}
            {fechaInicio && fechaFin && (
              <div className="agregartareas-project-range mt-3 p-2 rounded small">
                <span className="agregartareastext-muted">
                  {calcularDuracion()} días
                </span>
                <p className="agregartareas-text-muted small mb-0">Duración estimada</p>
              </div>
            )}
            
            
          </TaskCard>
        </div>
  
        <div className="agregartareas-actions-panel p-4 rounded mt-4">
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            
            <button
              type="button"
              className="agregartareas-btn-action agregartareas-btn-cancel d-flex align-items-center justify-content-center gap-2"
              onClick={handleCancelar}
              disabled={loading}
            >
              <FaTimes />
              Cancelar
            </button>
            
            <button
              type="button"
              className="agregartareas-btn-action agregartareas-btn-save d-flex align-items-center justify-content-center gap-2"
              onClick={handleModificar}
              disabled={loading || Object.keys(camposModificados).length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Guardando…
                </>
              ) : (
                <>
                  <FaSave />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
          
          {/* Pie de página de acciones */}
          <div className="mt-4 pt-3 border-top">
            <div className="agregartareas-form-status d-flex justify-content-between align-items-center">
              <small className="agregartareas-text-muted">
                <span className="agregartareas-required-field me-1">*</span> Obligatorio
              </small>
            </div>
          </div>
        </div>
        
      </div>
    </Layout>
  );
}

export default EditarTareas;



