import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCalendarAlt, FaTimes, FaSave } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/global.css';
import '../css/NuevoProyecto.css';
import '../css/ModificarProyecto.css';
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import ErrorMensaje from "../components/ErrorMensaje";
import ConfirmModal from "../components/ConfirmModal";
import { parseISO } from "date-fns";

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
    <span className={!value ? "nv-text" : ""}>{value || "Seleccionar fecha"}</span>
  </button>
));

// Componente de tarjeta
const FieldCard = ({ children, className = "" }) => (
  <div className={`nv-field-card p-4 mb-4 ${className}`}>{children}</div>
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
  const [loadingProyecto, setLoadingProyecto] = useState(false);
  const [loadingModificar, setLoadingModificar] = useState(false);
  const [proyectoCargado, setProyectoCargado] = useState(false);
  const [datosOriginales, setDatosOriginales] = useState(null);
  const [camposModificados, setCamposModificados] = useState({});
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarConfirmarModificar, setMostrarConfirmarModificar] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const [touched, setTouched] = useState({ fechaInicio: false, fechaFin: false });
const API_URL = import.meta.env.VITE_API_URL;
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

  // Cargar proyecto
  useEffect(() => {
    if (idProyecto && !proyectoCargado) {
      setLoadingProyecto(true);
      const token = sessionStorage.getItem("jwt_token");
      if (!token) {
        setErrorServidor("No autenticado");
        setLoadingProyecto(false);
        return;
      }

      fetch(`${API_URL}/api/proyecto/${idProyecto}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      })
        .then(res => res.ok ? res.json() : Promise.reject("Error al cargar"))
        .then(data => {
          const proyecto = data.proyecto;
          const inicio = proyecto.pf_inicio ? parseISO(proyecto.pf_inicio) : null;
const fin = proyecto.pf_fin ? parseISO(proyecto.pf_fin) : null;

          setDatosOriginales({ ...proyecto, pf_inicio: inicio, pf_fin: fin });

          if (nombreProyectoRef.current) nombreProyectoRef.current.value = proyecto.p_nombre || '';
          if (descripcionProyectoRef.current) descripcionProyectoRef.current.value = proyecto.descripcion || '';
          setFechaInicio(inicio);
          setFechaFin(fin);

          ajustarAltura(nombreProyectoRef);
          ajustarAltura(descripcionProyectoRef);
          setProyectoCargado(true);
        })
        .catch(() => setErrorServidor("Error al cargar los datos del proyecto"))
        .finally(() => setLoadingProyecto(false));
    }
  }, [idProyecto, proyectoCargado]);

  // Comparación de fechas ignorando hora
  const isSameDate = (date1, date2) => {
    if (!date1 && !date2) return true;
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // Verificar cambios
  const verificarCambios = () => {
    if (!datosOriginales || !proyectoCargado) return false;
    const cambios = {};
    const nombre = nombreProyectoRef.current?.value.trim() || '';
    const descripcion = descripcionProyectoRef.current?.value.trim() || '';
    if (nombre !== datosOriginales.p_nombre) cambios.nombre = true;
    if (descripcion !== datosOriginales.descripcion) cambios.descripcion = true;
    if (!isSameDate(fechaInicio, datosOriginales.pf_inicio)) cambios.fechaInicio = true;
    if (!isSameDate(fechaFin, datosOriginales.pf_fin)) cambios.fechaFin = true;
    setCamposModificados(cambios);
    return Object.keys(cambios).length > 0;
  };

  useEffect(() => {
    if (proyectoCargado) verificarCambios();
  }, [fechaInicio, fechaFin]);

  const handleInputChange = (campo) => {
    setErrores(prev => ({ ...prev, [campo]: null }));
    setErrorServidor(null);
    verificarCambios();
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
      setLoadingModificar(true);
      setErrorServidor(null);
      const token = sessionStorage.getItem("jwt_token");
      const nombre = nombreProyectoRef.current?.value.trim() || '';
      const descripcion = descripcionProyectoRef.current?.value.trim() || '';

     const res = await fetch(`${API_URL}/api/modificar/proyecto/${idProyecto}`, {
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
      setTimeout(() => setGuardadoExitoso(false), 2000);

    } catch (error) {
      setErrorServidor(error.message);
    } finally {
      setLoadingModificar(false);
    }
  };

  // Confirmar salida
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

  const handleCancelar = () => {
    if (Object.keys(camposModificados).length > 0) setMostrarConfirmacion(true);
    else navigate("/ProyectosPorModificar");
  };
  const confirmarCancelar = () => navigate("/ProyectosPorModificar");
  const cancelarCancelar = () => setMostrarConfirmacion(false);

  return (
    <Layout titulo="MODIFICAR PROYECTO" sidebar={<MenuDinamico activeRoute="modificar" />}>
      <div className="nv-contenedor">
        <div className="nv-contenedor-encabezado">
          <div className="d-flex nv-icono-titulo">
            <div>
              <h1 className="nv-titulo mb-0">Modificar Proyecto</h1>
              <p className="nv-muted mb-0">Actualiza los campos del proyecto según sea necesario</p>
            </div>
          </div>
        </div>

        {guardadoExitoso && (
  <div
    className="alert alert-success d-flex align-items-center gap-2 mb-4 mp-alerta-zindex"
    role="alert"
  >
    <FaSave />
    <div>
      <strong>¡Proyecto modificado exitosamente!</strong> Ahora puede agregar tareas o ver todos los proyectos.
    </div>
  </div>
)}


        {errorServidor && <div className="alert alert-danger">{errorServidor}</div>}

        <FieldCard>
          <div className="mb-4">
            <label htmlFor="nombreProyecto" className="nv-form-label d-flex align-items-center gap-2 mb-2">
              <span className="nv-campo-requerido">*</span>Nombre del proyecto
            </label>
            <textarea
              id="nombreProyecto"
              ref={nombreProyectoRef}
              className="form-control nv-form-input"
              placeholder="Escribe el nombre del proyecto"
              rows={1}
              onInput={() => { ajustarAltura(nombreProyectoRef); handleInputChange("nombre"); }}
            />
            <ErrorMensaje mensaje={errores.nombre} />
          </div>

          <div className="mb-4">
            <label htmlFor="descripcionProyecto" className="nv-form-label d-flex align-items-center gap-2 mb-2">
              <span className="nv-campo-requerido">*</span>Descripción del proyecto
            </label>
            <textarea
              id="descripcionProyecto"
              ref={descripcionProyectoRef}
              className="form-control nv-form-input"
              placeholder="Escribe la descripción del proyecto"
              rows={4}
              onInput={() => { ajustarAltura(descripcionProyectoRef); handleInputChange("descripcion"); }}
            />
            <ErrorMensaje mensaje={errores.descripcion} />
          </div>

          <div className="row g-4">
            <div className="col-12 col-md-6">
              <div className="nv-fecha-container">
                <label className="nv-form-label d-flex align-items-center gap-2 mb-2">
                  <span className="nv-campo-requerido">*</span>Fecha de inicio
                </label>
                <DatePicker
                  selected={fechaInicio}
                  onChange={(date) => {
                    setFechaInicio(date);
                    setTouched(prev => ({ ...prev, fechaInicio: true }));
                  }}
                  dateFormat="dd/MM/yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  locale="es"
                  minDate={new Date()}
                  customInput={<CalendarButton />}
                />
                <ErrorMensaje mensaje={errores.inicio} />
             

              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="nv-fecha-container">
                <label className="nv-form-label d-flex align-items-center gap-2 mb-2">
                  <span className="nv-campo-requerido">*</span>Fecha de fin
                </label>
                <DatePicker
                  selected={fechaFin}
                  onChange={(date) => {
                    setFechaFin(date);
                    setTouched(prev => ({ ...prev, fechaFin: true }));
                  }}
                  dateFormat="dd/MM/yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  locale="es"
                  minDate={fechaInicio || new Date()}
                  customInput={<CalendarButton />}
                />
                <ErrorMensaje mensaje={errores.fin} />
                <ErrorMensaje mensaje={errores.fechas} />
              </div>
            </div>
          </div>

          <div className="d-flex flex-column flex-md-row gap-3 justify-content-center mt-4">
            <button
              type="button"
              className="nv-btn-accion nv-btn-cancelar d-flex align-items-center justify-content-center gap-2"
              onClick={handleCancelar}
              disabled={loadingProyecto || loadingModificar}
            >
              <FaTimes /> Cancelar
            </button>
            <button
              type="button"
              className="nv-btn-accion nv-btn-guardar d-flex align-items-center justify-content-center gap-2"
              onClick={() => setMostrarConfirmarModificar(true)}
              disabled={loadingModificar || Object.keys(camposModificados).length === 0}
            >
              {loadingModificar ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Guardando…
                </>
              ) : (
                <>
                  <FaSave /> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </FieldCard>

        <ConfirmModal
          isOpen={mostrarConfirmarModificar}
          title="¿Modificar proyecto?"
          message="¿Estás seguro de que deseas modificar este proyecto? Los cambios se guardarán."
          onConfirm={() => { handleModificar(); setMostrarConfirmarModificar(false); }}
          onCancel={() => setMostrarConfirmarModificar(false)}
        />

        <ConfirmModal
          isOpen={mostrarConfirmacion}
          onConfirm={confirmarCancelar}
          onCancel={cancelarCancelar}
          title="¿Descartar cambios?"
          message="Tienes cambios sin guardar. Si cancelas, perderás todos los cambios realizados."
        />
      </div>
    </Layout>
  );
}

export default ModificarProyecto;














