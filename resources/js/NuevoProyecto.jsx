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
import { FaCalendarAlt } from "react-icons/fa";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";

registerLocale("es", es);

const CalendarButton = React.forwardRef(({ value, onClick, disabled }, ref) => (
  <button
    type="button"
    className="btn-calendario nv-btn-calendario w-100 d-flex align-items-center gap-2"
    onClick={onClick}
    ref={ref}
    disabled={disabled} // Agregado para respetar el bloqueo
  >
    <FaCalendarAlt className={!value ? "nv-text" : ""} /> 
    <span className={!value ? "nv-text" : ""}>
      {value || "Seleccionar fecha"}
    </span>
  </button>
));

function NuevoProyecto() {
  const navigate = useNavigate();
  const nombreProyectoRef = useRef(null);
  const descripcionProyectoRef = useRef(null);
  const menuRef = useRef(null);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const [isOpen, setIsOpen] = useState(false);
  
  // Estado para controlar qué botones se muestran (Guardar vs Nueva Tarea)
  const [mostrarExtras, setMostrarExtras] = useState(true);
  
  // Estado para guardar el ID del proyecto recién creado
  const [idProyectoGuardado, setIdProyectoGuardado] = useState(null);

  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false); 
  const [camposModificados, setCamposModificados] = useState({});

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
  };

  // --- LÓGICA MODIFICADA: Cancelar regresa a la pantalla anterior ---
  const handleCancelar = () => {
    if (Object.keys(camposModificados).length > 0) {
      const confirmar = window.confirm("Tienes cambios sin guardar. ¿Seguro que quieres cancelar y salir?");
      if (!confirmar) return;
    }
    // Regresa a la página anterior en el historial
    navigate(-1);
  };

  // --- LÓGICA MODIFICADA: Redirige usando el ID guardado ---
  const handleNuevaTarea = () => {
    if (!idProyectoGuardado) return;

    navigate("/AgregarTareas", { 
        state: { 
            id_departamento_inicial: id_departamento,
            id_usuario, 
            id_proyecto: idProyectoGuardado,
            p_nombre: nombreProyectoRef.current.value,
            descripcion: descripcionProyectoRef.current.value,
            pf_inicio: fechaInicio ? fechaInicio.toISOString() : null, // Asegurar formato fecha
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

        // --- ÉXITO ---
        const idProyecto = data.id_proyecto || data.proyecto?.id_proyecto;
        
        // 1. Guardamos el ID para usarlo después
        setIdProyectoGuardado(idProyecto);

        // 2. Cambiamos el estado de los botones
        setMostrarExtras(false);
        
        // 3. Limpiamos errores y modificaciones para evitar alertas al salir
        setErrores({});
        setCamposModificados({});

        
        
        // NOTA: Ya no limpiamos los campos (nombreRef.current.value = "") 
        // para que el usuario vea la información del proyecto creado.

    } catch (error) {
        alert("Error al conectar con el servidor");
        console.error(error);
    } finally {
        setLoading(false); 
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Si hay cambios y aun NO se ha guardado (mostrarExtras es true)
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
            <div className="row justify-content-center g-0">
           <div className="col-12 col-md-8 col-lg-6">
              <h1 className="titulo-global">Nuevo Proyecto</h1>
           </div>
           
            <div className="mb-3 d-flex flex-column">
              <label htmlFor="nombreProyecto" className="nv-form-label fw-bold nv-label">Nombre del proyecto</label>
              <textarea
                id="nombreProyecto"
                ref={nombreProyectoRef}
                className="form-control nv-form-input"
                placeholder="Escribe el nombre del proyecto"
                rows={1}
                disabled={!mostrarExtras} // Se bloquea si ya se guardó
                onInput={() => { ajustarAltura(nombreProyectoRef); handleInputChange("nombre"); }}
              />
               <ErrorMensaje mensaje={errores.nombre} />
            </div>

            <div className="mb-3 d-flex flex-column">
              <label htmlFor="descripcionProyecto" className="nv-form-label fw-bold nv-label">Descripción del proyecto</label>
              <textarea
                id="descripcionProyecto"
                ref={descripcionProyectoRef}
                className="form-control nv-form-input"
                placeholder="Escribe la descripción del proyecto"
                rows={3}
                disabled={!mostrarExtras} // Se bloquea si ya se guardó
                onInput={() => { ajustarAltura(descripcionProyectoRef); handleInputChange("descripcion"); }}
              />
              <ErrorMensaje mensaje={errores.descripcion} />
            </div>

           <div className="row mb-3 g-0"> 
             <div className="col-12 col-md-6 mb-3 d-flex flex-column ps-0 pe-2"> 
                <label className="nv-form-label fw-bold mb-1">Fecha de inicio</label>
                <DatePicker
                  selected={fechaInicio}
                  onChange={(date) => { setFechaInicio(date); handleInputChange("inicio"); }}
                  dateFormat="dd/MM/yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  locale="es"
                  minDate={new Date()}
                  disabled={!mostrarExtras} // Se bloquea si ya se guardó
                  customInput={<CalendarButton disabled={!mostrarExtras} />}
                />
                <ErrorMensaje mensaje={errores.inicio} />
             </div>

             <div className="col-12 col-md-6 mb-3 d-flex flex-column ps-2 pe-0">
                <label className="nv-form-label fw-bold mb-1">Fecha de fin</label>
                <DatePicker
                  selected={fechaFin}
                  onChange={(date) => { setFechaFin(date); handleInputChange("fin"); }}
                  dateFormat="dd/MM/yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  locale="es"
                  minDate={fechaInicio || new Date()}
                  disabled={!mostrarExtras} // Se bloquea si ya se guardó
                  customInput={<CalendarButton disabled={!mostrarExtras} />}
                />
                <ErrorMensaje mensaje={errores.fin} />
             </div>
           </div>

            <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
              {mostrarExtras ? (
                <>
                  <button 
                    type="button"
                    className="nv-btn-form w-100 w-md-auto"
                    onClick={handleCancelar}
                    disabled={loading} 
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button"
                    className="nv-btn-form w-100 w-md-auto"
                    onClick={handleGuardar}
                    disabled={loading} 
                  > 
                    {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                    {loading ? "Guardando…" : "Guardar Proyecto"} 
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button"
                    className="nv-btn-form w-100 w-md-auto"
                    onClick={handleNuevaTarea}
                  >
                    Nueva Tarea
                  </button>
                  <button 
                    type="button"
                    className="nv-btn-form w-100 w-md-auto"
                    
                    onClick={() => navigate("/ListaProyectos")}
                  >
                    Ver Proyectos
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
    </Layout>
  );
}

export default NuevoProyecto;


