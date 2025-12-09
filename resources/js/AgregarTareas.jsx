import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker, { registerLocale } from "react-datepicker";
import es from 'date-fns/locale/es';
import "react-datepicker/dist/react-datepicker.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/agregartareas.css";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import ErrorMensaje from "../components/ErrorMensaje";
import { FaCalendarAlt, FaUser, FaUsers, FaFileAlt, FaSave, FaTimes, FaListAlt, FaRegClock, FaProjectDiagram } from "react-icons/fa";
import logo3 from "../imagenes/logo3.png";

// Registrar locale español para DatePicker
registerLocale('es', es);

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
// CORRECCIÓN 1: El componente TaskCard ahora usa la clase CSS correcta
// para eliminar el padding interno no deseado.
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

function AgregarTareas() {
  const navigate = useNavigate();
  const location = useLocation();
 const {
  id_proyecto,
  id_departamento_inicial,
  id_usuario,
  nombre,          
  p_nombre,        
  descripcion,
  pf_inicio,
  pf_fin
} = location.state || {};
const nombreProyectoFinal = p_nombre || nombre || "Proyecto";


  const nombreTareaRef = useRef(null);
  const descripcionTareaRef = useRef(null);

  const [departamentos, setDepartamentos] = useState([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(id_departamento_inicial || "");
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");

  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [errores, setErrores] = useState({});
  const [tareaGuardada, setTareaGuardada] = useState(false);

  const [loadingInicial, setLoadingInicial] = useState(false);
  const [loadingTarea, setLoadingTarea] = useState(false);

  const [idTareaRecienCreada, setIdTareaRecienCreada] = useState(null);
  const [minFecha, setMinFecha] = useState(null);
  const [maxFecha, setMaxFecha] = useState(null);
  const [camposModificados, setCamposModificados] = useState({});
  const [proyectoActual, setProyectoActual] = useState(null);
  const [nombreProyecto, setNombreProyecto] = useState("");
  const [usuarioSeleccionadoInfo, setUsuarioSeleccionadoInfo] = useState(null);
const API_URL = import.meta.env.VITE_API_URL;


  const ajustarAltura = (ref) => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  };

  const getHeaders = () => {
    const token = sessionStorage.getItem("jwt_token");
    if (!token) {
      sessionStorage.removeItem("jwt_token");
      sessionStorage.removeItem("usuario");
      navigate("/Login", { replace: true });
      return null;
    }
    return { Authorization: `Bearer ${token}`, Accept: "application/json" };
  };

useEffect(() => {
  console.log("location.state:", location.state);

  const token = sessionStorage.getItem("jwt_token");
  if (!token) {
    navigate("/Login", { replace: true });
    return;
  }

  if (location.state && location.state.id_proyecto) {
    setProyectoActual({ id_proyecto: location.state.id_proyecto });

    const nombreProyectoFinal =
      location.state.nombre_proyecto || 
      location.state.p_nombre ||        
      location.state.nombre ||        
      location.state.nombre_proyecto_final ||  
      "Proyecto";
 

    console.log("Nombre final:", nombreProyectoFinal);
    setNombreProyecto(nombreProyectoFinal);

  } else {
    navigate("/NuevoProyecto", { replace: true });
  }
}, [navigate, location]);



  useEffect(() => {
    if (!proyectoActual?.id_proyecto) return;

    const cargarTodo = async () => {
      const headers = getHeaders();
      if (!headers) return;

      try {
        setLoadingInicial(true);

       const [fechasRes, depRes] = await Promise.all([
  fetch(`${API_URL}/api/proyectos/${proyectoActual.id_proyecto}/fechasProyecto`, { headers }),
  fetch(`${API_URL}/api/CatalogoDepartamentos`, { headers })
]);


        if (fechasRes.status === 401 || depRes.status === 401) {
          sessionStorage.removeItem("jwt_token");
          navigate("/Login", { replace: true });
          return;
        }

        const fechas = await fechasRes.json();
        const deps = await depRes.json();

        if (fechas.success) {
          const inicio = new Date(fechas.pf_inicio);
          const fin = new Date(fechas.pf_fin);

          const inicioMex = new Date(inicio);
          inicioMex.setHours(inicioMex.getHours() + 6);

          const finMex = new Date(fin);
          finMex.setHours(finMex.getHours() + 6);

          setMinFecha(inicioMex);
          setMaxFecha(finMex);
        }

        setDepartamentos(deps);

        let depFinal;
        if (id_departamento_inicial) {
          depFinal = parseInt(id_departamento_inicial);
        } else if (deps.length > 0) {
          depFinal = deps[0].id_departamento;
        } else {
          depFinal = "";
        }

        setDepartamentoSeleccionado(depFinal);

        if (depFinal) {
       const usuariosRes = await fetch(`${API_URL}/api/departamentos/${depFinal}/usuarios`, { headers });


          if (usuariosRes.status === 401) {
            sessionStorage.removeItem("jwt_token");
            navigate("/Login", { replace: true });
            return;
          }

          const usuariosData = await usuariosRes.json();
          setUsuarios(usuariosData);
        }

        setLoadingInicial(false);
      } catch (err) {
        console.error(err);
        setLoadingInicial(false);
      }
    };

    cargarTodo();
  }, [proyectoActual]);

  useEffect(() => {
    if (!departamentoSeleccionado) return;

    const fetchUsuarios = async () => {
      const headers = getHeaders();
      if (!headers) return;

      try {
        const res = await fetch(
  `${API_URL}/api/departamentos/${departamentoSeleccionado}/usuarios`,
  { headers }
);


        if (res.status === 401) {
          sessionStorage.removeItem("jwt_token");
          navigate("/Login", { replace: true });
          return;
        }

        const data = await res.json();
        setUsuarios(data);
        setUsuarioSeleccionado("");
        setUsuarioSeleccionadoInfo(null);
      } catch (err) {
        console.error(err);
        setUsuarios([]);
        setUsuarioSeleccionado("");
      }
    };

    fetchUsuarios();
  }, [departamentoSeleccionado]);

  useEffect(() => {
    if (usuarioSeleccionado && usuarios.length > 0) {
      const usuario = usuarios.find(u => u.id_usuario == usuarioSeleccionado);
      setUsuarioSeleccionadoInfo(usuario || null);
    } else {
      setUsuarioSeleccionadoInfo(null);
    }
  }, [usuarioSeleccionado, usuarios]);

  const handleGuardar = async () => {
    const nombre = nombreTareaRef.current.value.trim();
    const descripcion = descripcionTareaRef.current.value.trim();
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

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

    const nuevaTarea = {
      id_usuario: parseInt(usuarioSeleccionado),
      id_proyecto,
      t_nombre: nombre,
      descripcion,
      tf_inicio: fechaInicio.toISOString().split("T")[0],
      tf_fin: fechaFin.toISOString().split("T")[0],
      id_departamento: parseInt(departamentoSeleccionado),
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("jwt_token")}`
    };

    try {
      setLoadingTarea(true);
      const res = await fetch(`${API_URL}/api/AgregarTareas`, {
  method: "POST",
  headers,
  body: JSON.stringify(nuevaTarea),
});

      if (res.status === 401) {
        sessionStorage.removeItem("jwt_token");
        sessionStorage.removeItem("usuario");
        navigate("/Login", { replace: true });
        return;
      }

      const data = await res.json();

      if (data.success) {
        setTareaGuardada(true);
        setIdTareaRecienCreada(data.tarea.id_tarea);
        limpiarCampos(true);
setCamposModificados({}); 
timer = setTimeout(() => {
        setTareaGuardada(false);
      }, 3000);
      } else {
        console.error("Error al crear tarea:", data.message);
      }
    } catch (err) {
      console.error("Error al guardar tarea:", err);
    } finally {
      setLoadingTarea(false);
    }
  };

  const limpiarCampos = (mantener) => {
    if (nombreTareaRef.current) nombreTareaRef.current.value = "";
    if (descripcionTareaRef.current) descripcionTareaRef.current.value = "";

    ajustarAltura(nombreTareaRef);
    ajustarAltura(descripcionTareaRef);

    setFechaInicio(null);
    setFechaFin(null);
    setUsuarioSeleccionado("");
    setErrores({});
    setUsuarioSeleccionadoInfo(null);
    if (!mantener) setTareaGuardada(false);
    setIdTareaRecienCreada(null);
  };

  const handleCancelar = () => {
    if (Object.keys(camposModificados).length > 0) {
      const confirmar = window.confirm("Tienes cambios sin guardar. ¿Seguro que quieres cancelar?");
      if (!confirmar) return;
    }
setCamposModificados({}); 
    navigate(-1);
  };

  const handleInputChange = (campo) => {
    setErrores(prev => ({ ...prev, [campo]: null }));
    setCamposModificados(prev => ({ ...prev, [campo]: true }));
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (Object.keys(camposModificados).length > 0) {
        e.preventDefault();
        e.returnValue = ""; 
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [camposModificados]);

  if (loadingInicial) {
    return (
      <div className="loader-container">
        <div className="loader-logo"><img src={logo3} alt="Cargando" /></div>
        <div className="loader-texto">CARGANDO...</div>
        <div className="loader-spinner"></div>
      </div>
    );
  }

  const calcularDuracion = () => {
   if (fechaInicio && fechaFin) {
     // Calcula la diferencia en milisegundos
     const diffTime = Math.abs(fechaFin - fechaInicio);
     // Convierte a días (redondea para obtener un número entero de días)
     const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
     // Suma 1 para incluir el día de inicio
     return diffDays + 1; 
   }
   return 0;
 };

  return (
   <Layout titulo="NUEVA TAREA" sidebar={<MenuDinamico activeRoute="Nueva tarea" />}>
    <div className="agregartareas-contenedor">
      <div className="agregartareas-project-header d-flex align-items-center gap-3 mb-4 p-3 rounded">
        <div className="flex-grow-1">
          <h1 className="agregartareas-titulo mb-1">Crear Nueva Tarea</h1>
          <div className="agregartareas-project-info d-flex flex-wrap gap-3 align-items-center">
            <span className="agregartareas-muted">
              <strong>Proyecto:</strong> {nombreProyecto}
            </span>
          </div>
        </div>
      </div>


      {tareaGuardada && (
      <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="alert">
              <FaSave />
              <div>
                <strong>¡Tarea guardada exitosamente!</strong> La tarea ha sido guardada y puedes verla en la lista de tareas.
              </div>
            
            </div>
          )}

      <div className="agregartareas-form-content-panel p-4 rounded"> 
       
        {/* ======================================================= */}
        {/* TaskCard 1: Información de la Tarea */}
        {/* Le aplicamos mb-4 a la tarjeta completa. */}
        {/* ======================================================= */}
        <TaskCard title={<span className="agregartareas-task-card-title">Información de la Tarea</span>}
  icon={<FaFileAlt color="#861542" />} className="mb-4"> 
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
              onInput={() => {
                ajustarAltura(nombreTareaRef);
                handleInputChange("nombre");
              }}
            />
            <ErrorMensaje mensaje={errores.nombre} />
          </div>

          {/* CORRECCIÓN 2: Quitamos el mb-4 al último elemento de la tarjeta para que no empuje a la siguiente. */}
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
        {/* Le aplicamos mb-4 a la tarjeta completa. */}
        {/* ======================================================= */}
        <TaskCard title={<span className="agregartareas-task-card-title">Usuarios</span>}
  icon={<FaFileAlt color="#861542" />} className="mb-4">
          <div className="row g-3">
            
            {/* Departamento */}
            <div className="col-12 mb-3">
              <label htmlFor="departamento" className="agregartareas-label ">
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
                  {departamentos.map(d => (
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
                  {usuarios.map(u => (
                    <option key={u.id_usuario} value={u.id_usuario}>
                      {`${u.nombre} ${u.apaterno} ${u.amaterno}`
                        .split(" ")
                        .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
                        .join(" ")}
                    </option>
                  ))}
                </select>
              </div>
              <ErrorMensaje mensaje={errores.usuario} />
            </div>
          </div>

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
        {/* Mantenemos mb-0 porque el panel de acciones tiene mt-4. */}
        {/* ======================================================= */}
        <TaskCard title={<span className="agregartareas-task-card-title">Cronograma</span>}
  icon={<FaFileAlt color="#861542" />} className="mb-0">
          <div className="row g-4">
              <div className="col-12 col-md-6">
                <div className="agregartareas-fecha-container">
                <label className="agregartareas-label d-flex align-items-center gap-2 mb-2">
                  <span className="agregartareas-required-field">*</span>
                  Fecha de inicio
                </label>
                <DatePicker
                  selected={fechaInicio}
                  onChange={date => {
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

          <div className="col-12 col-md-6">
              <div className="agregartareas-fecha-container">
                <label className="agregartareas-label d-flex align-items-center gap-2 mb-2">
                  <span className="agregartareas-required-field">*</span>
                  Fecha de fin
                </label>
                <DatePicker
                  selected={fechaFin}
                  onChange={date => {
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
 <span className="agregartareastext-muted">{calcularDuracion()} días</span>
              <p className="agregartareas-text-muted small mb-0">Duración estimada</p>
            </div>
          )}

          {/* Rango del proyecto (Último elemento) */}
          {/* CORRECCIÓN 4: Añadimos mb-0 para que no haya margen extra al final. */}
          {minFecha && maxFecha && (
            <div className="agregartareas-project-range mt-3 p-2 rounded small mb-0">
              <p className="mb-1"><strong>Rango del proyecto:</strong></p>
              <p className="mb-0 agregartareas-text-muted">
                {minFecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}{" - "}
                {maxFecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
          )}
        </TaskCard>

 
      <div className="agregartareas-actions-panel p-4 rounded mt-4">

        <div className="d-flex flex-wrap gap-2 justify-content-center">
         

          <button
            type="button"
            className="agregartareas-btn-action agregartareas-btn-cancel d-flex align-items-center justify-content-center gap-2"
            onClick={handleCancelar}
            disabled={loadingTarea}
          >
            <FaTimes />
            Cancelar
          </button>
 <button
            type="button"
            className="agregartareas-btn-action agregartareas-btn-save d-flex align-items-center justify-content-center gap-2"
            onClick={handleGuardar}
            disabled={loadingTarea}
          >
            {loadingTarea ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Guardando…
              </>
            ) : (
              <>
                <FaSave />
                Guardar Tarea
              </>
            )}
          </button>
        </div>

        {tareaGuardada && !loadingTarea && (
          <div className="mt-3 d-flex justify-content-center">
            <button
              type="button"
              className="agregartareas-btn-action agregartareas-btn-list d-flex align-items-center justify-content-center gap-2"
              onClick={() => navigate("/ListaDeTareas", { state: { id_proyecto } })}
            >
              <FaListAlt />
              Ver Tareas
            </button>
          </div>
        )}

        {/* Estado del formulario */}
        <div className="mt-4 pt-3 border-top">
          <div className="agregartareas-form-status d-flex justify-content-between align-items-center">
         
            <small className="agregartareas-text-muted">
              <span className="agregartareas-required-field me-1">*</span> Obligatorio
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</Layout>

  );
}

export default AgregarTareas;








