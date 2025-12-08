import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCalendarAlt, FaExclamationTriangle,FaBars } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/global.css';
import '../css/NuevoProyecto.css';
import '../css/ModificarProyecto.css';
import logo3 from "../imagenes/logo3.png";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import ErrorMensaje from "../components/ErrorMensaje";
import ConfirmModal from "../components/ConfirmModal"; 
import EmptyState from "../components/EmptyState";
import { useRolNavigation } from "./utils/navigation";


registerLocale("es", es);

// Estado guardado
const EstadoGuardado = ({ tipo }) => (
  <div className="mp-estado-guardado-wrapper mb-3">
    <div className={`mp-estado-guardado ${tipo === 'guardado' ? 'guardado' : 'no-guardado'}`}>
      <span className="indicador"></span>
      {tipo === 'guardado' ? 'Todos los cambios guardados' : 'Cambios sin guardar'}
    </div>
  </div>
);

// Botón de calendario reutilizable
const CalendarButton = React.forwardRef(({ value, onClick }, ref) => (
  <button
    type="button"
    className="btn-calendario nv-btn-calendario w-100 d-flex align-items-center gap-2"
    onClick={onClick}
    ref={ref}
  >
    <FaCalendarAlt className={!value ? "nv-text" : ""} /> 
    <span className={!value ? "nv-text" : ""}>
      {value || "Seleccionar fecha"}
    </span>
  </button>
));

// Selector de fecha
const SelectorFecha = ({ label, selected, onChange, minDate, error, disabled, onBlur }) => (
  <div className="fecha-item mb-3 d-flex flex-column">
    <label className="form-label fw-bold mb-1">{label}</label>
    <DatePicker
      selected={selected}
      onChange={onChange}
      onBlur={onBlur}
      dateFormat="dd/MM/yyyy"
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      locale="es"
      minDate={minDate}
      customInput={<CalendarButton hasError={!!error} value={selected} disabled={disabled} />}
      disabled={disabled}
      popperPlacement="bottom-start"
    />
    {error && <small className="modificarproyecto-error">{error}</small>}
  </div>
);

function ModificarProyecto() {
  const navigate = useNavigate();
  const location = useLocation();
  const { idProyecto } = location.state || {};

  const nombreProyectoRef = useRef(null);
  const descripcionProyectoRef = useRef(null);

  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [proyectoCargado, setProyectoCargado] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [camposModificados, setCamposModificados] = useState({});
  const [errorServidor, setErrorServidor] = useState(null);
  const [datosOriginales, setDatosOriginales] = useState(null);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [mostrarEstado, setMostrarEstado] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const [mostrarConfirmarModificar, setMostrarConfirmarModificar] = useState(false);
  const [loadingProyecto, setLoadingProyecto] = useState(false); 
const [loadingModificar, setLoadingModificar] = useState(false);

 



  const [touched, setTouched] = useState({
    fechaInicio: false,
    fechaFin: false,
  });

  // Ajusta altura de los textarea
  const ajustarAltura = (ref) => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    ajustarAltura(nombreProyectoRef);
    ajustarAltura(descripcionProyectoRef);
  }, []);

  // Carga del proyecto
 useEffect(() => {
  if (idProyecto && !proyectoCargado) {
    setLoadingProyecto(true); 
    const token = sessionStorage.getItem("jwt_token");
    
    if (!token) {
      setErrorServidor("No autenticado");
      setLoadingProyecto(false);
      return;
    }

    fetch(`http://127.0.0.1:8000/api/proyecto/${idProyecto}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    })
      .then(res => res.ok ? res.json() : Promise.reject("Error al cargar"))
      .then(data => {
        const proyecto = data.proyecto;
        setDatosOriginales(proyecto);
        if (nombreProyectoRef.current) nombreProyectoRef.current.value = proyecto.p_nombre || '';
        if (descripcionProyectoRef.current) descripcionProyectoRef.current.value = proyecto.descripcion || '';
        if (proyecto.pf_inicio) setFechaInicio(new Date(proyecto.pf_inicio));
        if (proyecto.pf_fin) setFechaFin(new Date(proyecto.pf_fin));
        ajustarAltura(nombreProyectoRef);
        ajustarAltura(descripcionProyectoRef);
        setProyectoCargado(true);
      })
      .catch(err => setErrorServidor("Error al cargar los datos del proyecto"))
      .finally(() => setLoadingProyecto(false));
  }
}, [idProyecto, proyectoCargado]);


  // Verifica cambios
  const verificarCambios = () => {
    if (!datosOriginales || !proyectoCargado) return false;

    const cambios = {};
    const nombre = nombreProyectoRef.current?.value.trim() || '';
    const descripcion = descripcionProyectoRef.current?.value.trim() || '';

    if (nombre !== datosOriginales.p_nombre) cambios.nombre = true;
    if (descripcion !== datosOriginales.descripcion) cambios.descripcion = true;
    if (fechaInicio?.getTime() !== new Date(datosOriginales.pf_inicio).getTime()) cambios.fechaInicio = true;
    if (fechaFin?.getTime() !== new Date(datosOriginales.pf_fin).getTime()) cambios.fechaFin = true;

    setCamposModificados(cambios);
    setMostrarEstado(Object.keys(cambios).length > 0 || guardadoExitoso);
    return Object.keys(cambios).length > 0;
  };

  // Detectar cambios en fechas y campos
  useEffect(() => {
    if (proyectoCargado) verificarCambios();
  }, [fechaInicio, fechaFin]);

  const handleInputChange = (campo) => {
    setErrores(prev => ({ ...prev, [campo]: null }));
    setErrorServidor(null);
    setTimeout(() => verificarCambios(), 500);
  };

  const validarFechas = (inicio, fin) => {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    if (!touched.fechaInicio && !touched.fechaFin) return null;

    if (inicio && inicio < hoy) return "La fecha de inicio no puede ser anterior a hoy";
    if (inicio && fin && fin < inicio) return "La fecha de fin no puede ser anterior a la fecha de inicio";

    if (inicio && fin) {
      const dosAnios = new Date(inicio);
      dosAnios.setFullYear(dosAnios.getFullYear() + 2);
      if (fin > dosAnios) return "La fecha de fin no puede ser más de 2 años después de la fecha de inicio";
    }

    return null;
  };

  const validarFormulario = () => {
    const nombre = nombreProyectoRef.current?.value.trim() || '';
    const descripcion = descripcionProyectoRef.current?.value.trim() || '';
    const inicio = fechaInicio;
    const fin = fechaFin;

    const nuevosErrores = {};
    if (!nombre) nuevosErrores.nombre = "El nombre del proyecto es obligatorio.";
    
    

    if (!descripcion) nuevosErrores.descripcion = "La descripción es obligatoria.";
    

    if (!inicio) nuevosErrores.inicio = "Selecciona la fecha de inicio.";
    if (!fin) nuevosErrores.fin = "Selecciona la fecha de fin.";

    const errorFechas = validarFechas(inicio, fin);
    if (errorFechas) nuevosErrores.fechas = errorFechas;

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleModificar = async () => {
  if (!validarFormulario()) return;
  try {
     setLoadingModificar(true); // 🔹 Solo al guardar cambios
    setErrorServidor(null);

    const token = sessionStorage.getItem("jwt_token");
    const nombre = nombreProyectoRef.current?.value.trim() || '';
    const descripcion = descripcionProyectoRef.current?.value.trim() || '';

    // URL específica para modificar
    const res = await fetch(`http://127.0.0.1:8000/api/modificar/proyecto/${idProyecto}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        p_nombre: nombre,
        descripcion: descripcion,
        pf_inicio: fechaInicio ? `${fechaInicio.getFullYear()}-${String(fechaInicio.getMonth()+1).padStart(2,'0')}-${String(fechaInicio.getDate()).padStart(2,'0')}` : null,
        pf_fin: fechaFin ? `${fechaFin.getFullYear()}-${String(fechaFin.getMonth()+1).padStart(2,'0')}-${String(fechaFin.getDate()).padStart(2,'0')}` : null
      })
    });

    if (res.status === 401) {
      sessionStorage.removeItem("jwt_token");
      navigate("/Login", { replace: true });
      return;
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(errorData.message || 'Error al actualizar');
    }

    setCamposModificados({});
    setGuardadoExitoso(true);
    setMostrarEstado(true);

    setTimeout(() => {
      setGuardadoExitoso(false);
      setMostrarEstado(false);
    }, 2000);

  } catch (error) {
     setErrorServidor(error.message);
  } finally {
    setLoadingModificar(false);
  }
};
// CAMBIOS SIN GUARDARRRRR
useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (Object.keys(camposModificados).length > 0) {
      e.preventDefault();
      e.returnValue = ""; // Necesario para mostrar el diálogo
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [camposModificados]);




  const handleCancelar = () => {
  console.log("Cancelar presionado, cambios:", camposModificados);
  if (Object.keys(camposModificados).length > 0) 
    setMostrarConfirmacion(true);
  else 
    navigate("/ProyectosListaModificar");
};


  const confirmarCancelar = () => navigate("/ProyectosListaModificar");
  const cancelarCancelar = () => setMostrarConfirmacion(false);

  return (
     <Layout
            titulo="MODIFICAR PROYECTO"
            sidebar={<MenuDinamico activeRoute="modificar" />}
          >
{loadingProyecto && (
      <div className="loader-container">
        <div className="loader-logo">
          <img src={logo3} alt="Cargando proyectos" />
        </div>
        <div className="loader-texto">CARGANDO...</div>
        <div className="loader-spinner"></div>
      </div>
    )}
     <div className="nv-contenedor">
            <div className="row justify-content-center g-0">
          <div className="col-12 col-md-8 col-lg-10">

              <h1 className="titulo-global">Modificar Proyecto</h1>
                

        {mostrarEstado && <EstadoGuardado tipo={guardadoExitoso ? 'guardado' : 'no-guardado'} />}

        {errorServidor && <div className="alert alert-danger">{errorServidor}</div>}

        <div className="mb-3 d-flex flex-column">
                      <label htmlFor="nombreProyecto" className="nv-form-label fw-bold form-label">Nombre del proyecto</label>
                      <textarea
                        id="nombreProyecto"
                        ref={nombreProyectoRef}
                        className="mp-form-control nv-form-input"
                        placeholder="Escribe el nombre del proyecto"
                        rows={1}
                        onInput={() => { ajustarAltura(nombreProyectoRef); handleInputChange("nombre"); }}
                      />
                       <ErrorMensaje mensaje={errores.nombre} />
                    </div>

           <div className="mb-3 d-flex flex-column">
              <label htmlFor="descripcionProyecto" className="nv-form-label fw-bold nuevoproyecto-label">Descripción del proyecto</label>
              <textarea
                id="descripcionProyecto"
                ref={descripcionProyectoRef}
                className="mp-form-control nv-form-input"
                placeholder="Escribe la descripción del proyecto"
                rows={3}
                onInput={() => { ajustarAltura(descripcionProyectoRef); handleInputChange("descripcion"); }}
              />
              <ErrorMensaje mensaje={errores.descripcion} />
            </div>

          <div className="row mb-3 g-0"> 
  <div className="col-12 col-md-6 mb-3 d-flex flex-column ps-0 pe-2"> 
    <label className="nv-form-label fw-bold mb-1">Fecha de inicio</label>
             <DatePicker
              label="Fecha de inicio"
              selected={fechaInicio}
              onChange={(date) => { setFechaInicio(date); setTouched(prev => ({...prev, fechaInicio: true})); }}
              minDate={new Date()}
              error={errores.inicio || errores.fechas}
              onBlur={() => verificarCambios()}
              customInput={<CalendarButton />}
            />
            <ErrorMensaje mensaje={errores.inicio} />
            </div>

             <div className="col-12 col-md-6 mb-3 d-flex flex-column ps-2 pe-0">
    <label className="nv-form-label fw-bold mb-1">Fecha de fin</label>
              <DatePicker
              label="Fecha de fin"
              selected={fechaFin}
              onChange={(date) => { setFechaFin(date); setTouched(prev => ({...prev, fechaFin: true})); }}
              minDate={fechaInicio || new Date()}
              error={errores.fin || errores.fechas}
              onBlur={() => verificarCambios()}
              customInput={<CalendarButton />}
            />
             <ErrorMensaje mensaje={errores.fin} />
          </div>
</div>
          <div className="d-flex flex-column flex-md-row gap-2 justify-content-center">
            <button 
              type="button"
                    className="nv-btn-form w-100 w-md-auto"
              onClick={handleCancelar}
              disabled={loadingProyecto || loadingModificar}

            >
              Cancelar
            </button>

       <button
  type="button"
  className="nv-btn-form w-100 w-md-auto"
  onClick={() => setMostrarConfirmarModificar(true)}
  disabled={loadingModificar || Object.keys(camposModificados).length === 0} 
>
  {loadingModificar ? (
    <>
      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      Guardando…
    </>
  ) : "Guardar Cambios"}
</button>


{/* Modal de confirmación antes de modificar */}
<ConfirmModal
  isOpen={mostrarConfirmarModificar}
  title="¿Modificar proyecto?"
  message="¿Estás seguro de que deseas modificar este proyecto? Los cambios se guardarán."
  onConfirm={() => { 
    handleModificar(); 
    setMostrarConfirmarModificar(false); 
  }}
  onCancel={() => setMostrarConfirmarModificar(false)}
/>


          </div>
        </div>

        <ConfirmModal
  isOpen={mostrarConfirmacion}  
  onConfirm={confirmarCancelar}
  onCancel={cancelarCancelar}
  title="¿Descartar cambios?"
  message="Tienes cambios sin guardar. Si cancelas, perderás todos los cambios realizados."
/>

      </div>
      

        </div>
       
       </Layout>
  );
}

export default ModificarProyecto;













