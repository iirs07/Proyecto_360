import { useState, useRef } from "react";
import React from "react";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaAngleDown, FaFilePdf, FaBars, FaTimes } from "react-icons/fa"; 
import { useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/global.css';
import '../css/reporte.css';
import PdfViewer from "./PdfViewer";
import Layout from "../components/Layout";
import MenuDinamico from "../components/MenuDinamico";
import ErrorMensaje from "../components/ErrorMensaje";

function Reporte() {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [mostrarVisor, setMostrarVisor] = useState(false);
  const [errores, setErrores] = useState({});
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  
  // ESTADOS para el filtro de Mes y Año
  const [mesSeleccionado, setMesSeleccionado] = useState(null); 
  const [anioSeleccionado, setAnioSeleccionado] = useState(null);
  
  const [reporteSeleccionado, setReporteSeleccionado] = useState(''); 
  
  const [metodoFiltrado, setMetodoFiltrado] = useState('ninguno'); 
  
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
const API_URL = import.meta.env.VITE_API_URL;
  // Referencia para el AbortController
  const abortControllerRef = useRef(null); 
  
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const selectRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const [botonHover, setBotonHover] = useState(false); 

  // OPCIONES para el Radio Button
  const opcionesReporte = [
    { value: "vencidas", label: "Tareas Vencidas" },
    { value: "proximas", label: "Próximas a Vencer" },
    { value: "completadas", label: "Tareas Completadas" },
    { value: "modificaciones", label: "Historial de Modificaciones" } 
  ];

  // OPCIONES para el Selector de Método
  const opcionesMetodo = [
    { value: "ninguno", label: "Seleccionar Filtro de Tiempo" }, 
    { value: "rango", label: "Por Rango de Fechas" },
    { value: "mesAnio", label: "Por Mes y Año" }
  ];

  
  const CalendarButton = React.forwardRef(({ value, onClick }, ref) => (
    <button
      type="button"
      className="btn-calendario w-100 d-flex align-items-center gap-2"
      onClick={onClick}
      ref={ref}
    >
      <FaCalendarAlt className={!value ? "text" : ""} /> 
      <span className={!value ? "text" : ""}>
        {value || "Seleccionar fecha"}
      </span>
    </button>
  ));
  
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        // Lógica de clic fuera
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


    // 💡 NUEVO useEffect para manejar la advertencia de recarga/cierre
    React.useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (cargando) {
                // El navegador mostrará un mensaje genérico para evitar que el usuario pierda el trabajo
                event.preventDefault();
                event.returnValue = ''; // Necesario para navegadores antiguos/compatibilidad
                return '¿Estás seguro de que quieres salir? Se perderá el progreso de la generación del PDF.';
            }
        };

        // Si la carga está activa, añadimos el listener
        if (cargando) {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }

        // Función de limpieza: eliminamos el listener al desmontar o si cargando es false
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [cargando]); // Dependencia: se ejecuta cada vez que 'cargando' cambia
  
  const limpiarFiltrosFecha = () => {
    setFechaInicio(null);
    setFechaFin(null);
    setMesSeleccionado(null);
    setAnioSeleccionado(null);
    setErrores({});
  };
  
  // FUNCIÓN PARA LIMPIAR TODO Y CANCELAR SI ES NECESARIO
  const limpiarYCancelar = () => {
    if (cargando && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    limpiarFiltrosFecha();
    setMetodoFiltrado('ninguno');
    setReporteSeleccionado('');
    setErrores({});
  };
  
  const handleReporteSelect = (event) => {
    setReporteSeleccionado(event.target.value);
    setErrores(e => ({...e, reporte: undefined})); 
    setMostrarVisor(false);
  };

  const handleMetodoChange = (event) => {
    const nuevoMetodo = event.target.value;
    setMetodoFiltrado(nuevoMetodo);
    setErrores(e => ({...e, metodoFiltrado: undefined})); 
    limpiarFiltrosFecha(); 
    setMostrarVisor(false);
  };

  // Función de cambio para los rangos de fecha
  const handleRangoFechaChange = (setter, key) => (date) => {
    setter(date);
    setErrores(prev => ({ ...prev, [key]: undefined })); 
  };

  const handleMesAnioChange = (setter, isMes) => (date) => {
    if (isMes) {
      setter(date ? date.getMonth() : null);
      if (date && anioSeleccionado === null) setAnioSeleccionado(new Date().getFullYear());
      if (!date) setAnioSeleccionado(null);
      setErrores(prev => ({ ...prev, mes: undefined })); 
    } else {
      setter(date ? date.getFullYear() : null);
      if (date && mesSeleccionado === null) setMesSeleccionado(new Date().getMonth());
      if (!date) setAnioSeleccionado(null);
      setErrores(prev => ({ ...prev, anio: undefined })); 
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    
    if (!reporteSeleccionado) {
      nuevosErrores.reporte = "Debes seleccionar un Tipo de Reporte para continuar.";
      setErrores(nuevosErrores);
      return false;
    }
    
    if (metodoFiltrado === 'ninguno') {
      nuevosErrores.metodoFiltrado = "Selecciona un método de filtro de tiempo.";
      setErrores(nuevosErrores);
      return false;
    }
    
    let hayErroresDeCampo = false;

    if (metodoFiltrado === 'mesAnio') {
      if (mesSeleccionado === null) {
        nuevosErrores.mes = "Debes seleccionar el Mes.";
        hayErroresDeCampo = true;
      }
      if (anioSeleccionado === null) {
        nuevosErrores.anio = "Debes seleccionar el Año.";
        hayErroresDeCampo = true;
      }
    }

    const requiereRango = ['vencidas', 'completadas', 'modificaciones'].includes(reporteSeleccionado);
    const requiereHasta = reporteSeleccionado === 'proximas';

    if (metodoFiltrado === 'rango') {
      if (requiereRango) {
        if (!fechaInicio) { nuevosErrores.fechaInicio = "Selecciona la fecha de inicio."; hayErroresDeCampo = true; }
        if (!fechaFin) { nuevosErrores.fechaFin = "Selecciona la fecha de fin."; hayErroresDeCampo = true; }
      }
      if (requiereHasta && !fechaFin) {
        nuevosErrores.fechaFin = "Selecciona la fecha límite (Hasta)."; hayErroresDeCampo = true;
      }
    }
    
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

const generarPDF = async () => {
    if (!validarFormulario()) return;

    // Inicializar AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    setCargando(true);
    setProgreso(0);

    const usuario = JSON.parse(sessionStorage.getItem('usuario'));
    const tiposReporteUrl = reporteSeleccionado; 

    let url = `${API_URL}/generar-pdf?tipos=${tiposReporteUrl}&id_usuario=${usuario.id_usuario}`;
    if (usuario.id_departamento) {
        url += `&id_departamento=${usuario.id_departamento}`;
    }
    if (metodoFiltrado === 'mesAnio') {
    url += `&mes=${mesSeleccionado + 1}&anio=${anioSeleccionado}`;
} 
else if (metodoFiltrado === 'rango') {

   
    const requiereRango = ['vencidas', 'completadas', 'modificaciones', 'proximas']
        .includes(reporteSeleccionado);

    if (requiereRango && fechaInicio) { 
        url += `&fechaInicio=${fechaInicio.toISOString().split('T')[0]}`;
    }

    if (fechaFin) {
        url += `&fechaFin=${fechaFin.toISOString().split('T')[0]}`;
    }
}

console.log("mesSeleccionado (0-based):", mesSeleccionado, "anioSeleccionado:", anioSeleccionado);


    console.log("URL de solicitud:", url);

    const intervalo = setInterval(() => {
      setProgreso(prev => {
        if (prev >= 90) {
          clearInterval(intervalo);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Pasar la señal de aborto al fetch
      const response = await fetch(url, { signal });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al generar el PDF: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      
      clearInterval(intervalo);
      setProgreso(100);
      
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      
      const nuevaUrl = URL.createObjectURL(blob);
      
      setPdfUrl(nuevaUrl);
      setMostrarVisor(true);
      
      limpiarFiltrosFecha();
      setMetodoFiltrado('ninguno');
      setReporteSeleccionado(''); 
      
      setTimeout(() => setProgreso(0), 500);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Generación de PDF cancelada.');
        // No se muestra alert, ya que limpiarYCancelar ya limpia y el botón de Cancelar es una acción intencional.
      } else {
        console.error("Error al generar el PDF:", error);
        alert(`Error al generar el PDF: ${error.message}`);
      }
    } finally {
      clearInterval(intervalo);
      setCargando(false);
      abortControllerRef.current = null; // Limpiar la referencia
    }
  };

  const cerrarVisor = () => {
    setMostrarVisor(false);
    setTimeout(() => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    }, 1000);
  };
  
  const requiereFechaInicio = ['vencidas', 'completadas', 'modificaciones'].includes(reporteSeleccionado);

  return (
    <Layout titulo="GENERAR REPORTES" sidebar={<MenuDinamico activeRoute="Nuevo proyecto" />}>
      
      <div className="reportes-d container my-4">
       
        
        {/* CONTENEDOR DEL FORMULARIO (Secciones 1, 2, 3 se mantienen igual) */}
        <div className="reportes-d-container mt-4 p-4 shadow-lg rounded-3" 
             style={{ 
               backgroundColor: 'white', 
               position: 'relative',
               zIndex: 1
             }}>
          
        <div className="reportes-seccion mb-4 p-3 border rounded-3">
            <h3 className="reportes-d-form-label fw-bold mb-3">Tipo de Reporte a Generar:</h3>
            <div className="row g-3">
              {opcionesReporte.map((opcion) => (
                <div className="col-md-6" key={opcion.value}>
                  <div className="form-check form-check-bordered" style={{ position: 'relative', zIndex: 11 }}>
                    <input
                      className="form-check-input"
                      type="radio" 
                      name="tipoReporte" 
                      value={opcion.value}
                      id={`radio-${opcion.value}`}
                      onChange={handleReporteSelect}
                      checked={reporteSeleccionado === opcion.value}
                      style={{ position: 'relative', zIndex: 10 }}
                    />
                    <label className="form-check-label" htmlFor={`radio-${opcion.value}`}>
                      {opcion.label}
                    </label>
                  </div>
                </div>
              ))}
            </div>
            {errores.reporte && <ErrorMensaje mensaje={errores.reporte} />}
          </div>

          {/* SECCIÓN 2: MÉTODO DE FILTRADO */}
          <div className="reportes-seccion mb-4 p-3 border rounded-3" 
               style={{ 
                 position: 'relative',
                 zIndex: 2,
                 backgroundColor: '#f8f9fa'
               }}>
            <h3 className="reportes-d-form-label fw-bold mb-3">Filtro de Tiempo</h3>
            <div className="row">
              <div className="col-md-8">
                <label className="form-label fw-semibold">Método de Filtrado:</label>
                <select
                  className={`form-select form-control ${errores.metodoFiltrado ? 'is-invalid' : ''}`}
                  value={metodoFiltrado}
                  onChange={handleMetodoChange}
                  style={{ position: 'relative', zIndex: 10 }}
                >
                  {opcionesMetodo.map(opcion => (
                    <option key={opcion.value} value={opcion.value} disabled={opcion.value === 'ninguno'}>
                      {opcion.label}
                    </option>
                  ))}
                </select>
                {errores.metodoFiltrado && <ErrorMensaje mensaje={errores.metodoFiltrado} />}
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: FILTROS ESPECÍFICOS (Se mantiene igual) */}
          {metodoFiltrado !== 'ninguno' && (
            <div className="reportes-seccion mb-4 p-3 border rounded-3" 
                 style={{ 
                   position: 'relative',
                   zIndex: 8,
                   backgroundColor: '#f8f9fa'
                 }}>
              <h3 className="reportes-d-form-label fw-bold mb-3">
                {metodoFiltrado === 'mesAnio' ? 'Seleccionar Mes y Año' : 'Seleccionar Rango de Fechas'}
              </h3>
              
              {metodoFiltrado === 'mesAnio' && (
                <div className="row g-3">
                    {/* MES */}
                  <div className="col-md-6 d-flex flex-column">
                    <label className="form-label fw-semibold">Mes:</label>
                    <DatePicker
                      selected={mesSeleccionado !== null ? new Date(anioSeleccionado || new Date().getFullYear(), mesSeleccionado, 1) : null}
                      onChange={handleMesAnioChange(setMesSeleccionado, true)}
                      dateFormat="MMMM"
                      showMonthYearPicker
                      showMonthDropdown
                      dropdownMode="select"
                      locale={es}
                      customInput={<CalendarButton value={mesSeleccionado !== null ? es.localize.month(mesSeleccionado, { width: 'wide' }) : 'Seleccionar mes'} />}
                      className="w-100"
                    />
                    {errores.mes && <ErrorMensaje mensaje={errores.mes} />}
                  </div>
                    {/* AÑO */}
                  <div className="col-md-6 d-flex flex-column">
                    <label className="form-label fw-semibold">Año:</label>
                    <DatePicker
                      selected={anioSeleccionado ? new Date(anioSeleccionado, 0, 1) : null}
                      onChange={handleMesAnioChange(setAnioSeleccionado, false)}
                      dateFormat="yyyy"
                      showYearPicker
                      dropdownMode="select"
                      locale={es}
                      customInput={<CalendarButton value={anioSeleccionado || 'Seleccionar año'} />}
                      className="w-100"
                    />
                    {errores.anio && <ErrorMensaje mensaje={errores.anio} />}
                  </div>
                </div>
              )}
              
              {metodoFiltrado === 'rango' && (
                <div className="row g-3">
                    {/* FECHA DE INICIO */}
                  {requiereFechaInicio && (
                    <div className="col-md-6 d-flex flex-column">
                      <label className="form-label fw-semibold">Fecha de inicio:</label>
                      <DatePicker
                        selected={fechaInicio}
                        onChange={handleRangoFechaChange(setFechaInicio, 'fechaInicio')}
                        dateFormat="dd/MM/yyyy"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        locale={es}
                        maxDate={fechaFin || null}
                        customInput={<CalendarButton />}
                        className="w-100"
                      />
                      <ErrorMensaje mensaje={errores.fechaInicio} />
                    </div>
                  )}
                    {/* FECHA DE FIN / LÍMITE */}
                  <div className={requiereFechaInicio ? "col-md-6 d-flex flex-column" : "col-12 d-flex flex-column"}>
                    <label className="form-label fw-semibold">
                      {requiereFechaInicio ? "Fecha de fin:" : "Fecha límite (Hasta):"}
                    </label>
                    <DatePicker
                      selected={fechaFin}
                      onChange={handleRangoFechaChange(setFechaFin, 'fechaFin')}
                      dateFormat="dd/MM/yyyy"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      locale={es}
                     maxDate={requiereFechaInicio ? new Date() : null} // Limita a hoy si requiere inicio (vencidas, completadas, mods)
        minDate={requiereFechaInicio ? (fechaInicio || null) : new Date()}
                      customInput={<CalendarButton />}
                      className="w-100"
                    />
                    <ErrorMensaje mensaje={errores.fechaFin} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECCIÓN 4: BARRA DE PROGRESO */}
          {cargando && (
            <div className="reportes-seccion mb-4 p-3 border rounded-3">
              <div className="reportes-d-progress-contenedor">
                <div className="d-flex justify-content-between mb-2">
                  <small className="reportes-d-text">Generando PDF...</small>
                  <small className="reportes-d-text fw-bold">{progreso}%</small>
                </div>
                <div className="reportes-d-progress">
                  <div
                    className="reportes-d-progress-bar"
                    role="progressbar"
                    style={{ width: `${progreso}%` }}
                    aria-valuenow={progreso}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 5: BOTONES */}
          <div className="reportes-seccion p-3">
            <div className="d-flex flex-column flex-md-row justify-content-center gap-3">
              <button 
                type="button"
                // 💡 CAMBIO CLAVE 5: Llama a limpiarYCancelar para manejar el Abort
                onClick={limpiarYCancelar} 
                className={cargando ? "btn btn-primary btn-md-custom px-4 py-2" : "btn btn-secondary btn-md-custom px-4 py-2"}
                disabled={false} // Siempre puede usarse para Limpiar o Cancelar
                style={{ position: 'relative', zIndex: 5 }}
              >
                {cargando ? (
                  // MUESTRA CANCELAR
                  <>
                    <FaTimes className="me-2" /> 
                    Cancelar Operación
                  </>
                ) : (
                  // MUESTRA LIMPIAR FILTROS
                  <>
                    <FaBars className="me-2" />
                    Limpiar Filtros
                  </>
                )}
              </button>
              
              <button 
                type="button"
              className="btn btn-md-custom mi-boton"
                onClick={generarPDF}
                disabled={cargando || !reporteSeleccionado || metodoFiltrado === 'ninguno'}
                onMouseEnter={() => setBotonHover(true)}
                onMouseLeave={() => setBotonHover(false)}
                style={{ position: 'relative', zIndex: 5 }}
              >
                {cargando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <FaFilePdf className="me-2" />
                    Generar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* VISOR DE PDF */}
        {mostrarVisor && pdfUrl && (
          <PdfViewer
            pdfUrl={pdfUrl}
            fileName={`Reporte_de_tareas_${reporteSeleccionado}.pdf`}
            onClose={cerrarVisor}
          />
        )}
      </div>
    </Layout>
  );
}

export default Reporte;