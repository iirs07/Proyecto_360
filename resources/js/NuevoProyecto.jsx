import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ErrorMensaje from "../components/ErrorMensaje";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/global.css';
import '../css/formulario.css';
import '../css/NuevoProyecto.css';
import { FaCalendarAlt, FaTasks, FaEye, FaSave, FaTimes, FaProjectDiagram, FaInfoCircle,FaClipboardList} from "react-icons/fa";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";


registerLocale("es", es);

const CalendarButton = React.forwardRef(({ value, onClick, disabled }, ref) => (
  <button
    type="button"
    className="btn-calendario nv-btn-calendario w-100 d-flex align-items-center gap-2"
    onClick={onClick}
    ref={ref}
    disabled={disabled}
  >
    <FaCalendarAlt className={!value ? "nv-text" : ""} /> 
    <span className={!value ? "nv-text" : ""}>
      {value || "Seleccionar fecha"}
    </span>
  </button>
));

// Componente de tarjeta para agrupar campos relacionados
const FieldCard = ({ children, className = "" }) => (
  <div className={`nv-field-card p-4 mb-4 ${className}`}>
    {children}
  </div>
);

function NuevoProyecto() {
  const navigate = useNavigate();
  const nombreProyectoRef = useRef(null);
  const descripcionProyectoRef = useRef(null);
  const menuRef = useRef(null);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const [isOpen, setIsOpen] = useState(false);
  
  const [mostrarExtras, setMostrarExtras] = useState(true);
  const [idProyectoGuardado, setIdProyectoGuardado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false); 
  const [camposModificados, setCamposModificados] = useState({});
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const usuario = JSON.parse(sessionStorage.getItem("usuario"));
  const id_usuario = usuario?.id_usuario;
  const id_departamento = usuario?.id_departamento;

  const toggleMenu = () => setIsOpen(!isOpen);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (campo) => {
    setErrores((prev) => ({ ...prev, [campo]: null }));
    setCamposModificados((prev) => ({ ...prev, [campo]: true }));
    if (guardadoExitoso) setGuardadoExitoso(false);
  };

  const handleCancelar = () => {
    if (Object.keys(camposModificados).length > 0) {
      const confirmar = window.confirm("Tienes cambios sin guardar. ¿Seguro que quieres cancelar y salir?");
      if (!confirmar) return;
    }
    navigate(-1);
  };

  const handleNuevaTarea = () => {
    if (!idProyectoGuardado) return;

    navigate("/AgregarTareas", { 
        state: { 
            id_departamento_inicial: id_departamento,
            id_usuario, 
            id_proyecto: idProyectoGuardado,
            p_nombre: nombreProyectoRef.current.value,
            descripcion: descripcionProyectoRef.current.value,
            pf_inicio: fechaInicio ? fechaInicio.toISOString() : null,
            pf_fin: fechaFin ? fechaFin.toISOString() : null
        } 
    });
  };

  const handleGuardar = async (e) => {
    e?.preventDefault();
    const token = sessionStorage.getItem("jwt_token");
    if (!token) {
        alert("Sesión expirada. Redirigiendo al login.");
        navigate("/Login", { replace: true });
        return;
    }

    if (!id_usuario) return alert("No se encontró el usuario logueado.");

    const nombre = nombreProyectoRef.current.value.trim();
    const descripcion = descripcionProyectoRef.current.value.trim();
    const inicio = fechaInicio;
    const fin = fechaFin;
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const nuevosErrores = {};
    if (!nombre) nuevosErrores.nombre = "El nombre del proyecto es obligatorio.";
    if (!descripcion) nuevosErrores.descripcion = "La descripción es obligatoria.";
    if (!inicio) nuevosErrores.inicio = "Selecciona la fecha de inicio.";
    if (!fin) nuevosErrores.fin = "Selecciona la fecha de fin.";
    if (inicio && inicio < hoy) nuevosErrores.inicio = "La fecha de inicio no puede ser anterior al día de hoy.";
    if (inicio && fin && fin < inicio) nuevosErrores.fin = "La fecha de fin no puede ser menor a la fecha de inicio.";

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    const proyecto = {
        id_usuario: parseInt(id_usuario),
        id_departamento: parseInt(id_departamento),
        p_nombre: nombre,
        descripcion: descripcion,
        pf_inicio: `${inicio.getFullYear()}-${String(inicio.getMonth()+1).padStart(2,'0')}-${String(inicio.getDate()).padStart(2,'0')}`,
        pf_fin: `${fin.getFullYear()}-${String(fin.getMonth()+1).padStart(2,'0')}-${String(fin.getDate()).padStart(2,'0')}`
    };

    try {
        setLoading(true); 
        const res = await fetch("http://127.0.0.1:8000/api/GuardarNuevoProyecto", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(proyecto)
        });

        if (res.status === 401) {
            alert("Token inválido o expirado. Redirigiendo al login.");
            sessionStorage.removeItem("jwt_token");
            navigate("/Login", { replace: true });
            return;
        }

        const data = await res.json().catch(async () => ({ error: await res.text() }));
        if (!res.ok) return alert("Error al guardar el proyecto: " + (data.message || JSON.stringify(data)));

        const idProyecto = data.id_proyecto || data.proyecto?.id_proyecto;
        
        setIdProyectoGuardado(idProyecto);
        setMostrarExtras(false);
        setGuardadoExitoso(true);
        setErrores({});
        setCamposModificados({});

    } catch (error) {
        alert("Error al conectar con el servidor");
        console.error(error);
    } finally {
        setLoading(false); 
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (Object.keys(camposModificados).length > 0 && mostrarExtras) {
        e.preventDefault();
        e.returnValue = ""; 
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [camposModificados, mostrarExtras]);

  return (
     <Layout
       titulo="NUEVO PROYECTO"
       sidebar={<MenuDinamico activeRoute="Nuevo proyecto" />}
     >
             <div className="nv-contenedor">

    <div className="nv-contenedor-encabezado">
        <div className="d-flex nv-icono-titulo">
            <div >
                <h1 className="nv-titulo mb-0">Crear Nuevo Proyecto</h1>
                <p className="nv-muted mb-0">
                    Complete todos los campos requeridos para registrar un nuevo proyecto
                </p>
            </div>
        </div>
    </div>
          {guardadoExitoso && (
            <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="alert">
              <FaSave />
              <div>
                <strong>¡Proyecto guardado exitosamente!</strong> Ahora puede agregar tareas o ver todos los proyectos.
              </div>
            </div>
          )}

          {/* Sección de información básica */}
          <FieldCard>
           <h3 className="nv-seccion-titulo mb-4 d-flex align-items-center gap-2">
    <span className="nv-seccion-icono">
        <FaClipboardList /> 
    </span>
    Datos del proyectos
</h3>
            
            <div className="mb-4">
              <label htmlFor="nombreProyecto" className="nv-form-label d-flex align-items-center gap-2 mb-2">
                <span className="nv-campo-requerido">*</span>
                Nombre del proyecto
              </label>
              <textarea
                id="nombreProyecto"
                ref={nombreProyectoRef}
                className="form-control nv-form-input"
                placeholder="Ingrese un nombre para el proyecto"
                rows={1}
                disabled={!mostrarExtras}
                onInput={() => { ajustarAltura(nombreProyectoRef); handleInputChange("nombre"); }}
              />
              <div className="d-flex justify-content-between align-items-center mt-1">
                <ErrorMensaje mensaje={errores.nombre} />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="descripcionProyecto" className="nv-form-label d-flex align-items-center gap-2 mb-2">
                <span className="nv-campo-requerido">*</span>
                Descripción del proyecto
              </label>
              <textarea
                id="descripcionProyecto"
                ref={descripcionProyectoRef}
                className="form-control nv-form-input"
                placeholder="Describa los detalles del proyecto"
                rows={4}
                disabled={!mostrarExtras}
                onInput={() => { ajustarAltura(descripcionProyectoRef); handleInputChange("descripcion"); }}
              />
              <div className="d-flex justify-content-between align-items-center mt-1">
                <ErrorMensaje mensaje={errores.descripcion} />
               
              </div>
           
          
            <div className="row g-4">
              <div className="col-12 col-md-6">
                <div className="nv-fecha-container">
                  <label className="nv-form-label d-flex align-items-center gap-2 mb-2">
                    <span className="nv-campo-requerido">*</span>
                    Fecha de inicio
                  </label>
                  <div className="position-relative">
                    <DatePicker
                      selected={fechaInicio}
                      onChange={(date) => { setFechaInicio(date); handleInputChange("inicio"); }}
                      dateFormat="dd/MM/yyyy"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      locale="es"
                      minDate={new Date()}
                      disabled={!mostrarExtras}
                      customInput={<CalendarButton disabled={!mostrarExtras} />}
                    />
                  </div>
                  <ErrorMensaje mensaje={errores.inicio} />
                  {fechaInicio && (
                    <small className="nv-text-muted mt-1 d-block">
                      Inicia: {fechaInicio.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </small>
                  )}
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="nv-fecha-container">
                  <label className="nv-form-label d-flex align-items-center gap-2 mb-2">
                    <span className="nv-campo-requerido">*</span>
                    Fecha de fin
                  </label>
                  <div className="position-relative">
                    <DatePicker
                      selected={fechaFin}
                      onChange={(date) => { setFechaFin(date); handleInputChange("fin"); }}
                      dateFormat="dd/MM/yyyy"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      locale="es"
                      minDate={fechaInicio || new Date()}
                      disabled={!mostrarExtras}
                      customInput={<CalendarButton disabled={!mostrarExtras} />}
                    />
                  </div>
                  <ErrorMensaje mensaje={errores.fin} />
                  {fechaFin && (
                    <small className="nv-text-muted mt-1 d-block">
                      Finaliza: {fechaFin.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </small>
                  )}
                </div>
                 </div>
              </div>
              {fechaInicio && fechaFin && (
                <div className="col-12">
                  <div className="nv-duracion-indicador p-3 mt-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">Duración estimada:</span>
                      <span className="fw-bold">
                        {Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24))} días
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
   
       
            <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
              {mostrarExtras ? (
                <>
                  <button 
                    type="button"
                    className="nv-btn-accion nv-btn-cancelar d-flex align-items-center justify-content-center gap-2"
                    onClick={handleCancelar}
                    disabled={loading}
                  >
                    <FaTimes />
                    Cancelar
                  </button>
                  <button 
                    type="button"
                    className="nv-btn-accion nv-btn-guardar d-flex align-items-center justify-content-center gap-2"
                    onClick={handleGuardar}
                    disabled={loading}
                  > 
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Guardando…
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Guardar Proyecto
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button"
                    className="nv-btn-accion nv-btn-tarea d-flex align-items-center justify-content-center gap-2"
                    onClick={handleNuevaTarea}
                  >
                    <FaTasks />
                    Agregar Nueva Tarea
                  </button>
                  <button 
                    type="button"
                    className="nv-btn-accion nv-btn-ver d-flex align-items-center justify-content-center gap-2"
                    onClick={() => navigate("/ListaProyectos")}
                  >
                    <FaEye />
                    Ver Todos los Proyectos
                  </button>
                </>
              )}
            </div>

            {/* Leyenda de campos requeridos */}
            <div className="mt-4 pt-3 border-top text-center">
              <small className="nv-text-muted">
                <span className="nv-campo-requerido me-1">*</span> Campos obligatorios
              </small>
            </div>
          </FieldCard>
        </div>
    </Layout>
  );
}

export default NuevoProyecto;

